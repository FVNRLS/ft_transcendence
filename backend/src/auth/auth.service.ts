import { HttpException, HttpStatus, Injectable, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from './session.service';
import { SecurityService } from './security.service';
import { JwtService } from '@nestjs/jwt';
import { GoogleDriveService } from './google.drive.service';
import { AuthDto } from './dto';
import { User } from '@prisma/client';
import { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private sessionService: SessionService,
		private securityService: SecurityService,
    private googleDriveService: GoogleDriveService,
  ) {}

  //CONTROLLER FUNCTIONS
  //TODO: protect versus sql injections!
  async signup(dto: AuthDto, file?: Express.Multer.File): Promise<{ status: HttpStatus, message?: string, cookie?: string }> {
    
    const token = await this.securityService.validateToken(dto);
    if (token.status !== HttpStatus.OK) {
      return token;
    }
 
    const { salt, hashedPassword } = await this.securityService.hashPassword(dto.password);
    if (!salt || !hashedPassword) {
      throw new HttpException('Failed to hash password', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      await this.prisma.user.create({
        data: {
          username: dto.username,
          hashedPasswd: hashedPassword,
          salt: salt,
          profilePicture: "",
        },
      });

      const result = await this.googleDriveService.setFirstProfilePicture(dto, file);
      if (result.status !== HttpStatus.CREATED) {
        return(result);
      }
      
      const user: User = await this.securityService.getVerifiedUserData(dto);
      if (!user) {
        return { status: HttpStatus.UNAUTHORIZED, message: 'Invalid credentials' };
      }
      
      try {
        const session = await this.sessionService.createSession(user);
        return { status: HttpStatus.CREATED, message: 'You signed up successfully', cookie: session.cookie };

      } catch (error) {
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to create session' };
      }
    } catch (error) {
      if (error.code === 'P2002') {
        return { status: HttpStatus.CONFLICT, message: 'Username already exists' };
      }
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Ooops...Something went wrong' };
    }
  }

  //protect versus sql injections!
  async signin(dto: AuthDto): Promise<{ status: HttpStatus, message?: string, cookie?: string }> {
    const user: User = await this.securityService.getVerifiedUserData(dto);
    if (!user) {
      return { status: HttpStatus.UNAUTHORIZED, message: 'Invalid credentials' };
    }

    const existingSession = await this.prisma.session.findFirst({ where: { userId: user.id }, });
    if (existingSession) {
      try {
        const jwtToken = existingSession.jwtToken;
        this.jwtService.verify(jwtToken, { ignoreExpiration: false });
        return { status: HttpStatus.ACCEPTED, message: 'You are already logged in' };
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          await this.prisma.session.delete({ where: { id: existingSession.id } });
          return { status: HttpStatus.UNAUTHORIZED, message: 'Your previous session has expired' };
        }
      }
    }
  
    try {
      const session = await this.sessionService.createSession(user);
      return { status: HttpStatus.CREATED, message: 'You signed in successfully', cookie: session.cookie };
    } catch (error) {
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to create session' };
    }
  }

  async logout(@Req() request?: Request): Promise<{ status: HttpStatus, message?: string }> {
    try {
      const cookieParser = require('cookie-parser')
      const jwtToken = request.cookies.access_token;
      console.log("Token: ", jwtToken);
      if (!jwtToken) {
        throw new Error('Invalid token');
      }

      await this.prisma.session.deleteMany({
        where: {
          jwtToken: jwtToken,
        },
      });
  
      return { status: HttpStatus.OK, message: 'You have been logged out successfully.' };
    } catch (error) {
      console.log('Error ending session:', error);
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to end session' };
    }
  }
}
