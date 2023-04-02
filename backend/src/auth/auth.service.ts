import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as argon from 'argon2';
import { AuthDto } from './dto';
import { Tokens } from 'src/auth/types';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private jwtService: JwtService,
		) {}


	async signupLocal(dto: AuthDto): Promise<Tokens> {
		return
	}	

	// async signinLocal(dto: AuthDto) {
		
	// }

	// async logout(userId: number): Promise<boolean> {
		
	// }
}
