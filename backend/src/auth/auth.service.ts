import { ForbiddenException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/binary';
import * as argon2 from 'argon2';
import { AuthDto } from './dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
  ) {}

  //protect versus sql injections!
  async signup(dto: AuthDto): Promise<{ status: HttpStatus, message?: string }> {
    if (!this.validateAccessToken(dto.token))
      return { status: HttpStatus.UNAUTHORIZED, message: 'Invalid access token' };

    const { salt, hashedPassword } = await this.hashPassword(dto.password);
    if (!salt || !hashedPassword)
      throw new HttpException('Failed to hash password', HttpStatus.INTERNAL_SERVER_ERROR);

      try {
        const user = await this.prisma.user.create({
          data: {
            username: dto.username,
            hashed_passwd: hashedPassword,
            salt: salt,
            token: dto.token,
            profile_picture: dto.profile_picture,
          },
        });
        return { status: HttpStatus.CREATED };
      } 
      catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            const target = error.meta.target as string;
            if (target.includes('token'))
              return { status: HttpStatus.CONFLICT, message: 'Token already exists' };
            else if (target.includes('username'))
              return { status: HttpStatus.CONFLICT, message: 'Username already exists' };
          }
        }
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Ooops...Something went wrong' };
      }     
  }

  //here implement the token refreshing request for each hour!
  //protect versus sql injections!
  async signin(dto: AuthDto): Promise<{ status: HttpStatus, message?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (!user)
      return { status: HttpStatus.NOT_FOUND, message: `User with username ${dto.username} not found` };

    const hashedPassword = await argon2.hash(dto.password, { salt: Buffer.from(user.salt, 'hex') });
    if (hashedPassword !== user.hashed_passwd)
      return { status: HttpStatus.UNAUTHORIZED, message: `Incorrect password for user ${dto.username}` };
    return { status: HttpStatus.OK };
  }

  async logout(dto: AuthDto): Promise<{ status: HttpStatus, message?: string }> {
    const user = await this.prisma.user.findUnique({
      where: {
        token: dto.token,
      },
    });

    if (!user)
      return { status: HttpStatus.UNAUTHORIZED, message: 'Invalid access token' };
  
    await this.prisma.user.update({
      where: {
        username: user.username,
      },
      data: {
        token: undefined,
      },
    });

    return { status: HttpStatus.OK, message: 'You have been logged out successfully.' };
  }  

  /* Checks if the token is 42 token: 
      Check if the token has the correct length
      Check if the token contains only hexadecimal characters
      If the token passes all checks, it is valid 
  */
  private validateAccessToken(token: string): boolean{
    if (typeof token !== 'string' || token.length !== 64 || !/^[0-9a-fA-F]+$/.test(token))
      return false;
    return true;
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
		const hashedPassword = await argon2.hash(password, { salt: salt });
		return { salt: salt.toString(('hex')), hashedPassword };
	}
}		
