import { HttpException, HttpStatus, Injectable, UploadedFile } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { empty, PrismaClientKnownRequestError } from '@prisma/client/runtime/binary';
import * as argon2 from 'argon2';
import { AuthDto } from './dto';
import { randomBytes } from 'crypto';
import { createReadStream } from 'fs';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
  ) {}

  //protect versus sql injections!
  async signup(dto: AuthDto, file?: Express.Multer.File): Promise<{ status: HttpStatus, message?: string }> {
    if (!this.validateAccessToken(dto.token))
      return { status: HttpStatus.UNAUTHORIZED, message: 'Invalid access token' };

    const { salt, hashedPassword } = await this.hashPassword(dto.password);
    if (!salt || !hashedPassword)
      throw new HttpException('Failed to hash password', HttpStatus.INTERNAL_SERVER_ERROR);

      // Upload the file to Google Drive
      try {
        const user = await this.prisma.user.create({
          data: {
            username: dto.username,
            hashed_passwd: hashedPassword,
            salt: salt,
            token: dto.token,
            profile_picture: "",
          },
        });
      if (file) {
        try {
          this.uploadProfilePicture(dto, file);
        }
        catch (error) {
          return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Error uploading file' };
        }
      }
    
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
  
  async uploadProfilePicture(dto: AuthDto, @UploadedFile() file: Express.Multer.File): Promise<{ status: HttpStatus, message?: string }> {
  
    if (!file) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'File is required'
      };
    }
    
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedMimeTypes.includes(file.mimetype))
      return { status: HttpStatus.BAD_REQUEST, message: "Invalid file type. Only JPG, JPEG, or PNG allowed" };
  
    try {
      const user = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });

      if (user.profile_picture)
        this.deleteProfilePicture(dto);

      const { google } = require('googleapis');
      const path = require('path');

      const oauth2Client = new google.auth.OAuth2({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
      });

      oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

      const drive = google.drive({
        version: 'v3',
        auth: oauth2Client,
      });

      const filePath = file.path;
      const fileName = path.basename(filePath);
      const fileMimeType = file.mimetype;
      const fileSize = file.size;

      const media = {
        mimeType: fileMimeType,
        body: createReadStream(filePath),
      };

      const res = await drive.files.create({
        requestBody: {
          name: fileName,
          mimeType: fileMimeType,
        },
        media,
      }, {
        // Use a resumable upload if the file is larger than 5MB
        onUploadProgress: evt => console.log(`Uploaded ${evt.bytesRead} bytes of ${fileSize} bytes`)
      });

      if (res.status === 200) {
        await this.prisma.user.update({
          where: { username: dto.username },
          data: { profile_picture: res.data.id },
        });
        return { status: HttpStatus.OK, message: res.data.id };
      } 
      else
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to upload file to Google Drive'};
    } 
    catch (err) {
      console.error('Error uploading file:', err);
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to upload file'};
    }
  }

  async deleteProfilePicture(dto: AuthDto): Promise<{ status: HttpStatus, message?: string }> {
    try {
      const user = await this.getUserData(dto);
      if (!user || !user.profile_picture)
        return { status: HttpStatus.NOT_FOUND, message: 'User or profile picture not found'};

      const isPasswdMatch = await argon2.verify(user.hashed_passwd, dto.password);
      if (!isPasswdMatch || dto.token != user.token)
        return { status: HttpStatus.UNAUTHORIZED, message: 'Invalid credentials' };
  
      const drive = await this.getGoogleDriveClient();
      if (!drive)
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to connect to the storage' };
      await drive.files.delete({ fileId: user.profile_picture });

      await this.prisma.user.update({
        where: { username: dto.username },
        data: { profile_picture: "" },
      });
  
      return { status: HttpStatus.OK, message: 'Profile picture deleted successfully' };
    } 
    catch (err) {
      console.error('Error deleting file:', err);
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to delete profile picture' };
    }
  }
  
  private async getUserData(dto: AuthDto): Promise<User> | null {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        username: true,
        salt: true,
        hashed_passwd: true,
        token: true,
        profile_picture: true,
      },
    });
    return user;
  }

  private async getGoogleDriveClient(): Promise<any> | null {
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    });
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    return Promise.resolve(drive);
  }

  /* Checks if the token is of 42 token type: 
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
