import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as bcrypt from 'bcrypt'
import * as argon from 'argon2';
import { AuthDto } from './dto';
import { Tokens } from './types';


@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private jwtService: JwtService,
		private config: ConfigService,
		) {}


	async signupLocal(dto: AuthDto): Promise<Tokens> {
		const hash = await this.hashData(dto.password);
		const newUser = await this.prisma.user
		.create({
			data: {
			  email: dto.email, 
			  hash,
			},
		  })
		.catch((error) => {
		if (error instanceof PrismaClientKnownRequestError) {
			if (error.code === 'P2002') {
			throw new ForbiddenException('Credentials incorrect');
			}
		}
		throw error;
		});

		const tokens = await this.getTokens(newUser.id, newUser.email);
		await this.updateRtHash(newUser.id, tokens.refresh_token);

		return tokens;
	}	

	async signinLocal(dto: AuthDto) {
		const user = await this.prisma.user.findUnique({
			where: {
				email: dto.email,
			}
		});

		if (!user) throw new ForbiddenException('Access Denied!');

		const passwordMatches = await bcrypt.compare(dto.password, user.hash);
		if (!passwordMatches) throw new ForbiddenException('Access Denied!');

		const tokens = await this.getTokens(user.id, user.email);
		await this.updateRtHash(user.id, tokens.refresh_token);
		return tokens;
	}

	async logout(userId: number): Promise<boolean> {
		await this.prisma.user.updateMany({
		  where: {
			id: userId,
			hashedRt: {
			  not: null,
			},
		  },
		  data: {
			hashedRt: null,
		  },
		});
		return true;
	  }
	
	  async refreshTokens(userId: number, rt: string): Promise<Tokens> {
		const user = await this.prisma.user.findUnique({
		  where: {
			id: userId,
		  },
		});
		if (!user || !user.hashedRt) throw new ForbiddenException('Access Denied');
	
		const rtMatches = await argon.verify(user.hashedRt, rt);
		if (!rtMatches) throw new ForbiddenException('Access Denied');
	
		const tokens = await this.getTokens(user.id, user.email);
		await this.updateRtHash(user.id, tokens.refresh_token);
	
		return tokens;
	  }
	
	  async updateRtHash(userId: number, rt: string): Promise<void> {
		const hash = await argon.hash(rt);
		await this.prisma.user.update({
		  where: {
			id: userId,
		  },
		  data: {
			hashedRt: hash,
		  },
		});
	  }


	hashData(data: string) {
		return bcrypt.hash(data, 10);
	}

	  async getTokens(userId: number, email: string): Promise<Tokens> {
		const [at, rt] = await Promise.all([
		  this.jwtService.signAsync({
			secret: 'AT_SECRET',
			expiresIn: '15m',
		  }),
		  this.jwtService.signAsync({
			secret: 'RT_SECRET',
			expiresIn: '7d',
		  }),
		]);
	
		return {
		  access_token: at,
		  refresh_token: rt,
		};
	  }
}
