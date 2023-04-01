import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as bcrypt from 'bcrypt';
import { Tokens } from './types';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';

@Injectable()
export class AuthService {
	constructor(private prisma: PrismaService,
		private jwtService: JwtService) {}

	hashData(data: string) {
		return bcrypt.hash(data, 10);
	}

	async getTokens(userId: number, email: string): Promise<Tokens> {
		const [at, rt] = await Promise.all([
		  this.jwtService.signAsync({
			secret: 'at-secret',
			expiresIn: '15m',
		  }),
		  this.jwtService.signAsync({
			secret: 'rt-secret',
			expiresIn: '7d',
		  }),
		]);
	
		return {
		  access_token: at,
		  refresh_token: rt,
		};
	  }

	async signupLocal(dto: AuthDto): Promise<Tokens> {
		const hash = await this.hashData(dto.password);
		const newUser = await this.prisma.user.create({
			data: {
			  email: dto.email,
			  hash: hash,
			},
		  });
		const tokens = await this.getTokens(newUser.id, newUser.email);
		return tokens;
	}

	signinLocal() {

	}

	logout() {

	}

	refreshTokens() {

	}
}
