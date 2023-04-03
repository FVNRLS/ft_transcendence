import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { JwtService } from '@nestjs/jwt';
import crypto from 'crypto';
import { AuthDto } from './dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async authorize(token: string): Promise<boolean> {
    try {
      const decodedToken = this.jwtService.verify(token);
      return true;
    } catch (e) {
      return false;
    }
  }

  async signup(dto: AuthDto, token: string): Promise<boolean> {
    const authorized = await this.authorize(token);
    if (!authorized) {
      throw new UnauthorizedException('Invalid token');
    }

    const { salt, hashedPassword } = await this.hashPassword(dto.password);

    const user = await this.prisma.user
      .create({
        data: {
          username: dto.username,
          hashed_passwd: hashedPassword,
		  salt: salt,
          token_42: token,
        },
      })
      .catch((error: any) => {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new ForbiddenException('Credentials incorrect');
          }
        }
        throw error;
      });

    return true;
  }

  private async hashPassword(password: string): Promise<{ salt: string, hashedPassword: string }> {
	const salt: string = crypto.randomBytes(16).toString('hex');
	const iterations: number = 10000;
	const keylen: number = 64;
	const hashedPassword: string = crypto.pbkdf2Sync(password, salt, iterations, keylen, 'sha512').toString('hex');
	return { salt, hashedPassword };
  }
}


	

	// async signin(dto: AuthDto) {
		
		// }
	
	// async logout(userId: number): Promise<boolean> {
		
		// }
	
