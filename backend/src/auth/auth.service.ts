import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as argon from 'argon2';
import { AuthDto } from './dto';
import { ConfigService } from '@nestjs/config';


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
		} 
		catch (e) {
			return false;
		}
	}

	async signup(dto: AuthDto, token: string): Promise<boolean> {
		const authorized = await this.authorize(token);
		if (!authorized) {
			throw new UnauthorizedException('Invalid token');
		}

		const hash = await argon.hash(dto.password);

		const user = await this.prisma.user
			.create({
				data: {
					username: dto.username,
					hashed_passwd: hash,
					token_42: token,
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

		return true;
	}
	// async signin(dto: AuthDto) {
		
		// }
		
		// async logout(userId: number): Promise<boolean> {
			
			// }
}
