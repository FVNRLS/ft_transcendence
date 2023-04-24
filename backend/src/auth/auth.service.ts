import { Body, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from './session.service';
import { SecurityService } from './security.service';
import { JwtService } from '@nestjs/jwt';
import { GoogleDriveService } from './google_drive/google.drive.service';
import { AuthDto } from './dto';
import { ApiResponse } from './dto/response.dto'
import { User } from '@prisma/client';

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
      await this.securityService.verifyUsernamePassword(dto);
      
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
      this.securityService.verifyUsernamePassword(dto);
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
      const decryptedCookiehash = await this.securityService.decryptCookie(cookie);
      const session = await this.sessionService.getSessionByCookieHash(decryptedCookiehash)
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
}
