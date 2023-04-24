/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   auth.service.ts                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:54:21 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/24 20:09:59 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Body, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from './session.service';
import { SecurityService } from './security.service';
import { JwtService } from '@nestjs/jwt';
import { GoogleDriveService } from './google_drive/google.drive.service';
import { AuthDto } from './dto';
import { ApiResponse } from './dto/response.dto'
import { Session, User } from '@prisma/client';
import { hash } from 'argon2';

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
  async signup(dto: AuthDto, file?: Express.Multer.File): Promise<ApiResponse> {
    try {
      await this.securityService.validateToken(dto);
      await this.securityService.verifyDto(dto);
      
      const { salt, hashedPassword } = await this.securityService.hashPassword(dto.password);
      await this.prisma.user.create({
        data: {
          username: dto.username,
          hashedPasswd: hashedPassword,
          salt: salt,
          profilePicture: "",
        },
      })

      const user: User = await this.securityService.getVerifiedUserData(dto);
      const session = await this.sessionService.createSession(user);
      await this.googleDriveService.setFirstProfilePicture(session.cookie, file);

      return { status: HttpStatus.CREATED, message: 'You signed up successfully', cookie: session.cookie };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error.code === 'P2002') {
				throw new HttpException('Username already exists', HttpStatus.CONFLICT);
      }
			throw new HttpException('Ooops...Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //protect versus sql injections!
  async signin(dto: AuthDto): Promise<ApiResponse> {
    try {
      this.securityService.verifyDto(dto);
      const user: User = await this.securityService.getVerifiedUserData(dto);
      const existingSession = await this.prisma.session.findFirst({ where: { userId: user.id } });
      if (existingSession) {
        try {
          const jwtToken = existingSession.jwtToken;
          this.jwtService.verify(jwtToken, { ignoreExpiration: false });

					throw new HttpException('You are already signed in', HttpStatus.ACCEPTED);
        } catch (error) {
          if (error.name === 'TokenExpiredError') {
            await this.prisma.session.delete({ where: { id: existingSession.id } });
            throw new HttpException('Your previous session has expired', HttpStatus.UNAUTHORIZED);
          }
        }
      }

			const session = await this.sessionService.createSession(user);
			return { status: HttpStatus.CREATED, message: 'You signed in successfully', cookie: session.cookie };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
				throw new HttpException('Ooops...Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

  }

  async logout(@Body('cookie') cookie: string): Promise<ApiResponse> {
    try {
      const session: Session = await this.securityService.verifyCookie(cookie);
      
      await this.prisma.session.deleteMany({ where: { userId: session.userId } });

      return { status: HttpStatus.OK, message: 'You have been logged out successfully.' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
				throw new HttpException('Ooops...Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  //TODO: test more - also with expired cookie/token
	async updateProfile(@Body('cookie') cookie: string, file?: Express.Multer.File, dto?: AuthDto): Promise<ApiResponse> {
    try {   
      if (file) {
        await this.googleDriveService.uploadProfilePicture(cookie, file);
      }
      
      const session: Session = await this.securityService.verifyCookie(cookie);
      const user: User = await this.prisma.user.findUnique({ where: {id: session.userId} });
      
      if (dto.password) {
        console.log(user.hashedPasswd);
        const { salt, hashedPassword } = await this.securityService.hashPassword(dto.password);
        
        await this.prisma.user.update({ where: { username: user.username }, data: { 
          hashedPasswd: hashedPassword, 
          salt: salt
        } });
      }

      if (dto.username) {
        await this.prisma.user.update({ where: { username: user.username }, data: { username: dto.username } });
      }
      
      return { status: HttpStatus.OK, message: 'Profile updated successfully' };
    }
    catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
				throw new HttpException('Ooops...Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
}
