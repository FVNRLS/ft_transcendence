import { ForbiddenException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { AuthDto } from './dto';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(dto: AuthDto): Promise<{ success: boolean }> {
    console.log('**********************');
    console.log(dto.password);
    // console.log(token);

    // const authorized = await this.validateToken(token);
    // if (!authorized) {
    // 	throw new UnauthorizedException('Invalid token');
    // }

    const { salt, hashedPassword } = await this.hashPassword(dto.password);
    if (!salt || !hashedPassword) {
      throw new HttpException('Failed to hash password', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          username: dto.username,
          hashed_passwd: hashedPassword,
          salt: salt,
          token: dto.token,
        },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials incorrect');
        }
      }
      throw error;
    }
  }

  private async validateToken(token: string): Promise<boolean> {
    if (!token) {
      return false;
    }

    const tokenParts = token.split(' ');

    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return false;
    }

    const decodedToken = tokenParts[1];

    try {
      const decoded: string | jwt.JwtPayload = jwt.decode(decodedToken, { complete: true }) as string | jwt.JwtPayload;
      console.log(decoded);
      return true; // Token is valid
    } catch (err) {
      console.error(err);
      return false; // Token is invalid
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

	private async hashPassword(password: string): Promise<{ salt: string, hashedPassword: string }> {
		const salt = randomBytes(32);
		const hashedPassword = await argon2.hash(password, { salt });
		return { salt: salt.toString(), hashedPassword };
	}
}		
