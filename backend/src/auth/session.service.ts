import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityService } from './security.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Session, User } from '@prisma/client';

@Injectable()
export class SessionService {
	constructor(
		private prisma: PrismaService,
		private securityService: SecurityService,
		private jwtService: JwtService,
	) {}
	
	async createSession(user: User): Promise<{ status: HttpStatus, message?: string, cookie?: string }> {
		try {
			const sessionPayload = { userId: user.id };
			const jwt_token = this.jwtService.sign(sessionPayload);
			const serializedCookie = await this.securityService.serializeCookie(user, jwt_token);
			const hashedCookie = await argon2.hash(serializedCookie);
			const encryptedCookie = await this.securityService.encryptCookie(hashedCookie);
			await this.pushSessionToDatabase(user, jwt_token, hashedCookie, serializedCookie);
			
			return { status: HttpStatus.CREATED, message: 'Login successful', cookie: encryptedCookie };
		} catch (error) {
			throw new HttpException('Ooops...Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	} 
	
	async getSessionByCookieHash(decryptedCookieHash: string): Promise<any> {
		try {
			const databaseEntry = await this.prisma.session.findUnique({ where: { hashedCookie: decryptedCookieHash.toString() } });
			const serializedCookie = databaseEntry.serializedCookie;
			await argon2.verify(decryptedCookieHash.toString(), serializedCookie);

			return databaseEntry;
		} catch (error) {
			throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
		}
	}

	private async pushSessionToDatabase(user: User, token: string, hashedCookie: string, serializedCookie: string): Promise<Session> {
		const sessionDuration = 2 * 60 * 60; // 2 hours in seconds
		
		try {
			const session = await this.prisma.session.create({
			data: {
				createdAt: new Date(),
				expiresAt: new Date(Date.now() + sessionDuration * 1000),
				userId: user.id,
				jwtToken: token,
				serializedCookie: serializedCookie,
				hashedCookie: hashedCookie
			},
			include: { user: true },
			});
			return session;
		} catch (error) {
			throw new HttpException('Ooops...Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}