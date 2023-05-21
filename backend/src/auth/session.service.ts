/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   session.service.ts                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jtsizik <jtsizik@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:55:37 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/21 13:02:47 by jtsizik          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SecurityService } from "../security/security.service";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { Session, User } from "@prisma/client";

@Injectable()
export class SessionService {
	constructor(
		private prisma: PrismaService,
		private securityService: SecurityService,
		private jwtService: JwtService,
	) {}
	
	async createSession(user: User, token42: string): Promise<{ status: HttpStatus, message?: string, cookie?: string }> {
		try {
			const sessionPayload = { userId: user.id };
			const jwt_token = this.jwtService.sign(sessionPayload);
			const serializedCookie = await this.securityService.serializeCookie(user, jwt_token);
			const hashedCookie = await argon2.hash(serializedCookie);
			const encryptedCookie = await this.securityService.encryptCookie(hashedCookie);
			const decryptedToken = await this.securityService.decryptToken(token42);
			await this.pushSessionToDatabase(user, jwt_token, hashedCookie, serializedCookie, decryptedToken);
			
			return { status: HttpStatus.CREATED, message: "Login successful", cookie: encryptedCookie };
		} catch (error) {
			console.log(error);
			throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
		}
	} 
	
	async getSessionByCookieHash(decryptedCookieHash: string): Promise<any> {
		try {
			const databaseEntry = await this.prisma.session.findUnique({ where: { hashedCookie: decryptedCookieHash.toString() } });
			const serializedCookie = databaseEntry.serializedCookie;
			await argon2.verify(decryptedCookieHash.toString(), serializedCookie);

			return databaseEntry;
		} catch (error) {
			throw new HttpException("Invalid credentials", HttpStatus.UNAUTHORIZED);
		}
	}

	private async pushSessionToDatabase(user: User, token: string, hashedCookie: string, serializedCookie: string, token42?: string): Promise<Session> {
		const sessionDuration = 2 * 60 * 60; // 2 hours in seconds
		if (!token42)
			token42 = "";
		try {
			const session = await this.prisma.session.create({
			data: {
				createdAt: new Date(),
				expiresAt: new Date(Date.now() + sessionDuration * 1000),
				userId: user.id,
				jwtToken: token,
				serializedCookie: serializedCookie,
				hashedCookie: hashedCookie,
				token42: token42
			},
			include: { user: true },
			});
			return session;
		} catch (error) {
			throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}