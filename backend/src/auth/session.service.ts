import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { randomBytes, createCipheriv, createDecipheriv, scrypt } from 'crypto';
import { createReadStream } from 'fs';
import { Session, User } from '@prisma/client';
import axios from 'axios';
import { JwtService } from '@nestjs/jwt';
import * as fs from 'fs';
import { Request } from 'express';
import { serialize } from 'cookie';
import { promisify } from 'util';

const COOKIE_NAME = 'session';
const COOKIE_SECRET = process.env.COOKIE_SECRET;

const cookieOptions = {
  maxAge: 2 * 60 * 60, // 2 hours
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const, // 'strict' is one of the allowed values for sameSite
};

@Injectable()
export class SessionService {
	constructor(
		private prisma: PrismaService,
		private jwtService: JwtService,
	) {}
	
	async createSession(user: User): Promise<{ status: HttpStatus, message?: string, cookie?: string }> {
		try {
			const sessionPayload = { userId: user.id };
			const jwt_token = this.jwtService.sign(sessionPayload);
			const serializedCookie = await this.serializeCookie(user, jwt_token);
			const hashedCookie = await argon2.hash(serializedCookie);
			const encryptedCookie = await this.encryptCookie(hashedCookie);
			await this.pushSessionToDatabase(user, jwt_token, hashedCookie, serializedCookie);
			return { status: HttpStatus.CREATED, message: 'Login successful', cookie: encryptedCookie };
		}
		catch (error) {
		  throw error;
		}
	} 
	
	private async serializeCookie(user: User, token: string): Promise<string> {
	const sessionDuration = 2 * 60 * 60; // 2 hours in seconds
	try {
		const cookieValue = JSON.stringify({
		jwt_token: token,
		userId: user.id,
		createdAt: new Date(),
		expiresAt: new Date(Date.now() + sessionDuration * 1000),
		});
	
		const serializedCookie = serialize(COOKIE_NAME, cookieValue, cookieOptions);     
		return serializedCookie;
	}
	catch(error) {
		throw error;
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
		throw new Error('Failed to create session');
	}
	}

	/* Hash the session string with argon2
	Generate a random initialization vector
	Create a cipher using the cookie secret as the key and the initialization vector
	Encrypt the hashed session string with the cipher
	Combine the encrypted session string and the initialization vector into a single buffer
	Return the base64-encoded encrypted session string 
	*/
	private async encryptCookie(hashedSession: string): Promise<string> {
	
	try {
	const iv = randomBytes(16);
	const key = (await promisify(scrypt)(COOKIE_SECRET, 'salt', 32)) as Buffer;
	const cipher = createCipheriv('aes-256-ctr', key, iv);
	
	const encryptedCookie = Buffer.concat([
		iv, // Prefix the IV to the encrypted data
		cipher.update(hashedSession),
		cipher.final(),
	]);
	
	return encryptedCookie.toString('base64');
	} catch (error) {
	const status = HttpStatus.INTERNAL_SERVER_ERROR;
	const message = 'Failed to encrypt cookie';
	throw new Error(`${status}: ${message}`);
	}
}

	/* Decode the base64-encoded encrypted session string
	Extract the initialization vector from the buffer
	Create a decipher using the cookie secret as the key and the initialization vector
	Decrypt the session string with the decipher
	Verify the decrypted string with argon2 
	Return the decrypted session string
	*/
	private async decryptCookie(encryptedCookie: string) {
	const encryptedData = Buffer.from(encryptedCookie, 'base64');
	
	const iv = encryptedData.slice(0, 16); // Extract the IV from the encrypted data
	const encryptedText = encryptedData.slice(16);
	
	const key = (await promisify(scrypt)(COOKIE_SECRET, 'salt', 32)) as Buffer;
	const decipher = createDecipheriv('aes-256-ctr', key, iv);
	
	const decryptedCookieHash = Buffer.concat([
		decipher.update(encryptedText),
		decipher.final(),
	]);

	const databaseEntry = await this.prisma.session.findUnique({ where: { hashedCookie: decryptedCookieHash.toString() } });
	const serializedCookie = databaseEntry.serializedCookie;    

	const dehashedSession = await argon2.verify(decryptedCookieHash.toString(), serializedCookie);
	if (!dehashedSession) {
		throw new Error('Invalid cookie');
	}
	
	return serializedCookie;
	}
}