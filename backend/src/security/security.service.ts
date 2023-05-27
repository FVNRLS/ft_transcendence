/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   security.service.ts                                :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jtsizik <jtsizik@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:55:23 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/27 13:46:14 by jtsizik          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as argon2 from "argon2";
import { randomBytes, createCipheriv, createDecipheriv, scrypt } from "crypto";
import { promisify } from "util";
import { Session, User } from "@prisma/client";
import { serialize } from "cookie";
import axios from "axios";
import { AuthDto } from "../auth/dto";
import { AuthResponse } from "../auth/dto/response.dto";
import { JwtService } from "@nestjs/jwt";


@Injectable()
export class SecurityService {
	constructor(
		private prisma: PrismaService,
		private jwtService: JwtService,
	) {}

	public validateCredentials(dto: AuthDto): void {
		if (!dto.username) {
			throw new HttpException("Username is required!", HttpStatus.UNAUTHORIZED);
		} else if (!dto.password) {
			throw new HttpException("Password is required!", HttpStatus.UNAUTHORIZED);
		}
		
		const usernameValid = this.validateUsername(dto.username);
		if (!usernameValid) {
			throw new HttpException("Invalid username!", HttpStatus.BAD_REQUEST);
		}
			
		return ;
	}

	private validateUsername(username: string): boolean {
    const regex = /^[a-zA-Z0-9]+$/; // Regular expression to check for alphanumeric characters
    return regex.test(username); // Returns true if username matches the regular expression
  }

	//TODO: apply in the end!
	private validatePassword(password: string): boolean {
    const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
    return regex.test(password);
  }

	async validateToken(token: string): Promise<{ status: HttpStatus, message?: string }> {
		try {
		  const url = "https://api.intra.42.fr/v2/achievements";
		  await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, responseType: "arraybuffer" });
			
		  return { status: HttpStatus.OK, message: "Token valid" };
		} catch(error){
			throw new HttpException("Invalid credentials", HttpStatus.UNAUTHORIZED);
		}
	}

	/*
    A salt is a random sequence of characters that is added to a password before hashing it.
    The salt makes it much harder for attackers to guess the original password by adding
    a layer of complexity to the hashed password.
    When you store a user"s hashed password in the database, you should also store the salt that
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
		try {
			const salt = randomBytes(32);
			const hashedPassword = await argon2.hash(password, { salt: salt });

			return { salt: salt.toString(("hex")), hashedPassword };
		} catch(error) {
			throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
		}
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
					TFAMode: true,
					email: true,
					TFACode: true,
					TFAExpiresAt: true,
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
				throw new HttpException("Invalid credentials", HttpStatus.UNAUTHORIZED);
			}

			const passwordValid = await argon2.verify(user.hashedPasswd, dto.password);
			if (!passwordValid) {
				throw new HttpException("Invalid credentials", HttpStatus.UNAUTHORIZED);
			}

			return user;
		} catch (error) {
			if (error instanceof HttpException)
				throw new HttpException("Invalid credentials", HttpStatus.UNAUTHORIZED);
			throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async serializeCookie(user: User, token: string): Promise<string> {
		const COOKIE_NAME = "session";

		const cookieOptions = {
		maxAge: 2 * 60 * 60, // 2 hours
		httpOnly: true,
		secure: true,
		sameSite: "strict" as const, // "strict" is one of the allowed values for sameSite
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
			throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
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
			const key = (await promisify(scrypt)(COOKIE_SECRET, "salt", 32)) as Buffer;
			const cipher = createCipheriv("aes-256-ctr", key, iv);
			
			const encryptedCookie = Buffer.concat([
				iv, // Prefix the IV to the encrypted data
				cipher.update(hashedSession),
				cipher.final(),
			]);
			
			return encryptedCookie.toString("base64");
		} catch (error) {
			throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/* Decode the base64-encoded encrypted session string
	Extract the initialization vector from the buffer
	Create a decipher using the cookie secret as the key and the initialization vector
	Decrypt the session string with the decipher
	Verify the decrypted string with argon2 
	Return the decrypted session string
	*/
	private async decryptCookie(encryptedCookie: string): Promise<string> {
		try {
			if (!encryptedCookie) {
				throw new HttpException("Invalid credentials", HttpStatus.UNAUTHORIZED);
			}
	
			const COOKIE_SECRET = process.env.COOKIE_SECRET;
			const encryptedData = Buffer.from(encryptedCookie, "base64");
			const iv = encryptedData.slice(0, 16);
			const encryptedText = encryptedData.slice(16);
			const key = (await promisify(scrypt)(COOKIE_SECRET, "salt", 32)) as Buffer;
			const decipher = createDecipheriv("aes-256-ctr", key, iv);
	
			const decryptedCookieHash = Buffer.concat([
				decipher.update(encryptedText),
				decipher.final(),
			]);

			return decryptedCookieHash.toString();
		} catch (error) {
			throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async encryptToken(token: string): Promise<string> {
		const SECRET = process.env.COOKIE_SECRET.slice(0, 32);
		const iv = randomBytes(16);
		const cipher = createCipheriv('aes-256-gcm', SECRET, iv);

		const encryptedData = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
		const tag = cipher.getAuthTag();

		const encryptedToken = Buffer.concat([iv, encryptedData, tag]).toString('base64');
		return encryptedToken;
	}

	async decryptToken(raw: string): Promise<string> {
		const SECRET = process.env.COOKIE_SECRET.slice(0, 32);
		
		const encryptedToken = raw.replace(/ /g, '+');

		const encryptedBuffer = Buffer.from(encryptedToken, 'base64');
		const iv = Buffer.alloc(16);
		const encryptedData = Buffer.alloc(encryptedBuffer.length - 32); // Extract the encrypted data (excluding IV and tag)
		const tag = Buffer.alloc(16); // Extract the authentication tag

		encryptedBuffer.copy(iv, 0, 0, 16);
		encryptedBuffer.copy(encryptedData, 0, 16, encryptedBuffer.length - 16);
		encryptedBuffer.copy(tag, 0, encryptedBuffer.length - 16);
		const decipher = createDecipheriv('aes-256-gcm', SECRET, iv);
		decipher.setAuthTag(tag);

		const decryptedToken = Buffer.concat([decipher.update(encryptedData), decipher.final()]).toString('utf8');
		return decryptedToken;
	}

	async verifyCookie(encryptedCookie: string): Promise<Session> {
		try {
			const decryptedCookieHash = await this.decryptCookie(encryptedCookie);
			const existingSession: Session = await this.prisma.session.findUnique({ where: { hashedCookie: decryptedCookieHash } });
			await argon2.verify(decryptedCookieHash.toString(), existingSession.serializedCookie);
			const jwtToken = existingSession.jwtToken;
			this.jwtService.verify(jwtToken, { ignoreExpiration: false });
	
			return existingSession;
		} catch (error) {
			console.log(error);
			if (error.name === "TokenExpiredError") {
				const decryptedCookieHash = await this.decryptCookie(encryptedCookie);
				const existingSession: Session = await this.prisma.session.findUnique({ where: { hashedCookie: decryptedCookieHash } });
				await this.prisma.session.delete({ where: { id: existingSession.id } });
				
				throw new HttpException("Your previous session has expired", HttpStatus.UNAUTHORIZED);
			} else {
				throw new HttpException("Invalid credentials", HttpStatus.UNAUTHORIZED);
			}
		}
	}

	async changeTFA(encryptedCookie: string): Promise<AuthResponse> {
		try {
			const session: Session = await this.verifyCookie(encryptedCookie);
			const user: User = await this.prisma.user.findUnique( {where: {id: session.userId} } );
		
			await this.prisma.user.update({ where: { username: user.username }, data: { TFAMode: !user.TFAMode} });
			
			let tfa_message: string
			if (user.TFAMode === true) {
				tfa_message = "Two Factor Authentication disabled";
			} else {
				if (!user.email) {
					return { status: HttpStatus.ACCEPTED, message: "Please provide your email address"};
				}
				tfa_message = "Two Factor Authentication enabled";
			}
			
      return { status: HttpStatus.OK, message: tfa_message};
		} catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
      }
		}
	}

	async setEmailAddress(encryptedCookie: string, newEmail: string): Promise<AuthResponse> {
		try {
			const session: Session = await this.verifyCookie(encryptedCookie);
			const user: User = await this.prisma.user.findUnique( {where: {id: session.userId} } );
			
			const emailValid = await this.validateEmail(newEmail);
			if (!emailValid) {
				throw new HttpException("Invalid email address", HttpStatus.BAD_REQUEST);
			}

			const email = await this.prisma.user.findFirst( {where: { email: newEmail } } )
			if (email) {
					throw new HttpException("The email address is already in use by another user", HttpStatus.BAD_REQUEST);
			}
			
			await this.prisma.user.update({ where: { username: user.username }, data: { email: newEmail } });
			
			return { status: HttpStatus.OK, message: "Thank you! Your email address is now verified and ready for Two-Factor Authentication." };
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
	}

	private async validateEmail(email: string): Promise<boolean> {
		const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	async generateTFACode(user: User): Promise<string> {
		try {
			const code = Math.floor(100000 + Math.random() * 900000).toString();
			const expiresInMinutes = 2;
			const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toUTCString();
			await this.prisma.user.update({ where: { username: user.username }, data: { TFACode: code, TFAExpiresAt: expiresAt} });
			
			return code;
		} catch (error) {
			throw error;
		}

	}
	
	async validateTFACode(user: User, dto: AuthDto): Promise<void> {
		try {
			if (user.TFACode != dto.TFACode) {
				throw new HttpException("Invalid code.", HttpStatus.UNAUTHORIZED);
			}
			
			const currentTime = new Date().toUTCString();
			if (currentTime > user.TFAExpiresAt) {
				throw new HttpException("Code expired.", HttpStatus.UNAUTHORIZED);
			}
		} catch (error) {
			throw error;
		}
	

	}
}