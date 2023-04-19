import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { randomBytes, createCipheriv, createDecipheriv, scrypt } from 'crypto';
import { promisify } from 'util';
import { User } from '@prisma/client';
import { serialize } from 'cookie';
import axios from 'axios';
import { AuthDto } from './dto';

@Injectable()
export class SecurityService {
	constructor(
		private prisma: PrismaService,
	) {}

	async verifyUsernamePassword(dto: AuthDto): Promise<void> {
		if (!dto.username)
			throw new HttpException('Username is required!', HttpStatus.UNAUTHORIZED);
		else if (!dto.password)
			throw new HttpException('Password is required!', HttpStatus.UNAUTHORIZED);
		return;
	}

	async validateToken(dto: AuthDto): Promise<{ status: HttpStatus, message?: string }> {
		try {
		  const url = 'https://api.intra.42.fr/v2/achievements';
		  await axios.get(url, {
			headers: { Authorization: `Bearer ${dto.token_42}` },
			responseType: 'arraybuffer',
		  });
		  return { status: HttpStatus.OK, message: 'Token valid' };
		} catch(error){
		  return { status: HttpStatus.UNAUTHORIZED, message: 'Token invalid' };
		}
	}

	/*
    A salt is a random sequence of characters that is added to a password before hashing it.
    The salt makes it much harder for attackers to guess the original password by adding
    a layer of complexity to the hashed password.
    When you store a user's hashed password in the database, you should also store the salt that
    was used to create the hash. Later, when the user logs in, you retrieve the salt from the database
    and use it to generate the hash of the password they entered during login.
    Then, you compare the generated hash with the hash stored in the database.
    If they match, the user has entered the correct password.
    Without a salt, an attacker could use a dictionary attack or a rainbow table attack to guess
    the password based on the hashed value. But with a unique salt for each user,
    the attacker would need to generate a new rainbow table for each user to have any chance of cracking the password.
    This makes it much harder and more time-consuming for attackers to gain access to user accounts.
  */
	async hashPassword(password: string): Promise<{ salt: string, hashedPassword: string }> {
		const salt = randomBytes(32);
		const hashedPassword = await argon2.hash(password, { salt: salt });
		return { salt: salt.toString(('hex')), hashedPassword };
	}

	async getVerifiedUserData(dto: AuthDto): Promise<User> {
		try {
			const user: User = await this.prisma.user.findUnique({
				where: { username: dto.username },
				select: { 
					id: true,
					username: true,
					hashedPasswd: true,
					salt: true,
					profilePicture: true,
					createdAt: true,
					updatedAt: true,
					sessions: {
						select: {
							id: true,
							createdAt: true,
							updatedAt: true,
							expiresAt: true,
							jwtToken: true,
							serializedCookie: true,
							hashedCookie: true,
						}
					}
				},
			});
	
			if (!user) {
				throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
			}
	
			const isPasswdMatch = await argon2.verify(user.hashedPasswd, dto.password);
			if (!isPasswdMatch) {
				throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
			}
	
			return user;
		} catch (error) {
			throw new HttpException('Ooops...Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async serializeCookie(user: User, token: string): Promise<string> {
		const COOKIE_NAME = 'session';

		const cookieOptions = {
		maxAge: 2 * 60 * 60, // 2 hours
		httpOnly: true,
		secure: true,
		sameSite: 'strict' as const, // 'strict' is one of the allowed values for sameSite
		};

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

	/* Hash the session string with argon2
Generate a random initialization vector
Create a cipher using the cookie secret as the key and the initialization vector
Encrypt the hashed session string with the cipher
Combine the encrypted session string and the initialization vector into a single buffer
Return the base64-encoded encrypted session string 
*/
	async encryptCookie(hashedSession: string): Promise<string> {
		const COOKIE_SECRET = process.env.COOKIE_SECRET;
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
			throw new HttpException('Ooops...Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/* Decode the base64-encoded encrypted session string
	Extract the initialization vector from the buffer
	Create a decipher using the cookie secret as the key and the initialization vector
	Decrypt the session string with the decipher
	Verify the decrypted string with argon2 
	Return the decrypted session string
	*/
	async decryptCookie(encryptedCookie: string) {
		try {
			if (!encryptedCookie) {
				throw new HttpException({ status: HttpStatus.UNAUTHORIZED, message: 'Cookie is required' }, HttpStatus.UNAUTHORIZED);
			}
	
			const COOKIE_SECRET = process.env.COOKIE_SECRET;
			if (!COOKIE_SECRET) {
				throw new HttpException('Ooops...Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
			}

			const encryptedData = Buffer.from(encryptedCookie, 'base64');
			const iv = encryptedData.slice(0, 16);
			const encryptedText = encryptedData.slice(16);
			const key = (await promisify(scrypt)(COOKIE_SECRET, 'salt', 32)) as Buffer;
			const decipher = createDecipheriv('aes-256-ctr', key, iv);
	
			const decryptedCookieHash = Buffer.concat([
				decipher.update(encryptedText),
				decipher.final(),
			]);

			return decryptedCookieHash.toString();
		} catch (error) {
			throw new HttpException('Ooops...Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}