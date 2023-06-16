/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   auth.service.ts                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.de> +#+  +:+       +#+        */
  /*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:54:21 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/03 16:49:36 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Body, HttpException, HttpStatus, Injectable, Res } from '@nestjs/common';
import { PrismaService } from "../prisma/prisma.service";
import { SessionService } from "./session.service";
import { SecurityService } from "../security/security.service";
import { JwtService } from "@nestjs/jwt";
import { GoogleDriveService } from "./google_drive/google.drive.service";
import { AuthDto } from "./dto";
import { AuthResponse, UserDataResponse } from "./dto/response.dto"
import { Session, User } from "@prisma/client";
import { MailService } from "./mail.service";
import axios from "axios";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private sessionService: SessionService,
		private securityService: SecurityService,
    private googleDriveService: GoogleDriveService,
  ) {}



  is42AuthEnabled(): boolean {
    const isEnabled = process.env.ENABLED_AUTH_42 === 'true';
    return isEnabled;
  }

  //CONTROLLER FUNCTIONS
  async authorizeCallback(code: string): Promise<string> {
    const is42AuthEnabled = process.env.AUTH_ENABLED_42 === 'true';

    if (!is42AuthEnabled) {
      throw new HttpException("42 Authentication is disabled.", HttpStatus.BAD_REQUEST);
    }
    try {
      const CLIENT_ID = process.env.REACT_APP_ID;
      const REDIRECT_URI = "http://localhost:5000/auth/authorize_callback";
      const SECRET = process.env.REACT_APP_SECRET;
  
      const response = await axios.post("https://api.intra.42.fr/oauth/token", {
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        client_secret: SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      });

      const accessToken: string = response.data.access_token;
      await this.securityService.validateToken(accessToken);
      const encryptedToken = await this.securityService.encryptToken(accessToken);
      return (encryptedToken);
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error;
      } else {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async get42email(token: string): Promise<string> {
    
    const decrypted = await this.securityService.decryptToken(token);
    const response = await axios.get("https://api.intra.42.fr/v2/me", { headers: { Authorization: `Bearer ${decrypted}` }});
    return (response.data.email);
  }

  async signup(dto: AuthDto, file?: Express.Multer.File): Promise<AuthResponse> {
    try {
      let email42;
      const is42AuthEnabled = process.env.AUTH_ENABLED_42 === 'true';

      if (!dto.token_42 && is42AuthEnabled) {
        return { status: HttpStatus.UNAUTHORIZED, message: "Please authorize via 42 API again!"};
      }

      this.securityService.validateCredentials(dto);
      if (is42AuthEnabled) {

        email42 = await this.get42email(dto.token_42);
      } else {
        email42 = "N/A"
      }
      const { salt, hashedPassword } = await this.securityService.hashPassword(dto.password);
      await this.prisma.user.create({
        data: {
          username: dto.username,
          hashedPasswd: hashedPassword,
          salt: salt,
          profilePicture: "",
          TFAMode: false,
          email: email42,
          TFACode: "",
          TFAExpiresAt: "",
          status: "online",
        },
      })

      const user: User = await this.securityService.getVerifiedUserData(dto);

      const maxRank = await this.prisma.rating.aggregate({ _max: { rank: true } });
      await this.prisma.rating.create({
        data: {
          userId: user.id,
          username: user.username,
          totalMatches: 0,
          wins: 0,
          losses: 0,
          rank: maxRank._max.rank + 1,
        },
      })
      
      const session = await this.sessionService.createSession(user, dto.token_42);
      await this.googleDriveService.setFirstProfilePicture(session.cookie, file);

      return { status: HttpStatus.CREATED, message: "You signed up successfully", cookie: session.cookie };
    } catch (error) {
      if (error.code === "P2002") {
				return { status: HttpStatus.CONFLICT, message: "Username already exists"};
      }
      if (error instanceof HttpException) {
        return { status: HttpStatus.UNAUTHORIZED, message: error.message};
      }
			throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async signin(dto: AuthDto): Promise<AuthResponse> {
    const is42AuthEnabled = process.env.AUTH_ENABLED_42 === 'true';
    try {
      if (!dto.token_42 && is42AuthEnabled) {
        return { status: HttpStatus.UNAUTHORIZED, message: "Please authorize via 42 API again!"};
      }

      this.securityService.validateCredentials(dto);
      const user: User = await this.securityService.getVerifiedUserData(dto);
      const existingSession = await this.prisma.session.findFirst({ where: { userId: user.id } });
      if (existingSession) {
        try {
          const jwtToken = existingSession.jwtToken;
          this.jwtService.verify(jwtToken, { ignoreExpiration: false });

					throw new HttpException("You are already signed in", 403);
        } catch (error) {
          if (error.name === "TokenExpiredError") {
            await this.prisma.session.delete({ where: { id: existingSession.id } });
            throw new HttpException("Your previous session has expired", HttpStatus.UNAUTHORIZED);
          }
        }
      }

      if (user.TFAMode) { 
        const code = await this.securityService.generateTFACode(user);
        const mailService = new MailService();
        await mailService.sendVerificationCode(user.email, code);
                
        return { status: HttpStatus.ACCEPTED, message: "Please check your email and enter the provided 2FA code" };
      } else {
        const session = await this.sessionService.createSession(user, dto.token_42);
        return { status: HttpStatus.CREATED, message: "You signed in successfully", cookie: session.cookie };
      }
    } catch (error) {
      if (error instanceof HttpException) {
        return { status: HttpStatus.UNAUTHORIZED, message: error.message};
      } else {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async signinWithTFA(dto: AuthDto) {
    try {
        const user: User = await this.securityService.getVerifiedUserData(dto);
        await this.securityService.validateTFACode(user, dto);        
        const session = await this.sessionService.createSession(user, dto.token_42);
        
        return { status: HttpStatus.CREATED, message: "You signed in successfully", cookie: session.cookie };
    } catch (error) {
      if (error instanceof HttpException) {
        return { status: HttpStatus.UNAUTHORIZED, message: error.message};
      } else {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
	}

  async updateProfile(cookie: string, file?: Express.Multer.File, username?: string, email?: string): Promise<AuthResponse> {
    try {

      if (username) {
        if (this.securityService.validateUsername(username) !== true)
         throw new HttpException("Invalid username!", HttpStatus.BAD_REQUEST);
      }
        
  
      if (email) {
        await this.securityService.setEmailAddress(cookie, email);
      }
      
      if (file) {
        await this.googleDriveService.uploadProfilePicture(cookie, file);
      }
      
      const session: Session = await this.securityService.verifyCookie(cookie);
      const user: User = await this.prisma.user.findUnique({ where: {id: session.userId} });
      
      // if (dto.password) {
      //   const { salt, hashedPassword } = await this.securityService.hashPassword(dto.password);
      //   await this.prisma.user.update({ where: { username: user.username }, data: {
      //     hashedPasswd: hashedPassword,
      //     salt: salt
      //   } });
      // }

      if (username) {
        try {
        await this.prisma.user.update({ where: { username: user.username }, data: { username: username } });
        } catch (error) {
          throw new HttpException("Username is already taken", HttpStatus.CONFLICT);
        }
      }

      return { status: HttpStatus.OK, message: "Profile updated successfully" };
    } catch (error) {
      if (error instanceof HttpException) {
        return { status: HttpStatus.CONFLICT, message: error.message };
      } else {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
  
  async logout(@Body("cookie") cookie: string): Promise<AuthResponse> {
    try {
      const session: Session = await this.securityService.verifyCookie(cookie);
      
      await this.prisma.session.deleteMany({ where: { userId: session.userId } });

      return { status: HttpStatus.OK, message: "You have been logged out successfully." };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async getUserData(cookie: string): Promise<UserDataResponse> {
    try {
      const session: Session = await this.securityService.verifyCookie(cookie);
      const user: User = await this.prisma.user.findUnique({where: {id: session.userId}});

      return ({username: user.username, email: user.email});

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async setUserStatus(cookie: string, status: string): Promise<AuthResponse> {
    try {
      const session: Session = await this.securityService.verifyCookie(cookie);
      const user: User = await this.prisma.user.findUnique({where: {id: session.userId}});

      await this.prisma.user.update({ where: { username: user.username }, data: { status: status } });

      return ({status: HttpStatus.OK, message: "Status updated"});

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
}
