import { HttpException, HttpStatus, Injectable, Req, Res, UploadedFile } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { AuthDto } from './dto';
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
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}


  //CONTROLLER FUNCTIONS
  //TODO: protect versus sql injections!
  async signup(dto: AuthDto, file?: Express.Multer.File): Promise<{ status: HttpStatus, message?: string, cookie?: string }> {
    
    const token = await this.validateToken(dto);
    if (token.status !== HttpStatus.OK) {
      return token;
    }
 
    const { salt, hashedPassword } = await this.hashPassword(dto.password);
    if (!salt || !hashedPassword) {
      throw new HttpException('Failed to hash password', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      await this.prisma.user.create({
        data: {
          username: dto.username,
          hashedPasswd: hashedPassword,
          salt: salt,
          profilePicture: "",
        },
      });

      const result = await this.setFirstProfilePicture(dto, file);
      if (result.status !== HttpStatus.CREATED) {
        return(result);
      }
      
      const user: User = await this.getVerifiedUserData(dto);
      if (!user) {
        return { status: HttpStatus.UNAUTHORIZED, message: 'Invalid credentials' };
      }
      
      try {
        const session = await this.createSession(user);
        return { status: HttpStatus.CREATED, message: 'You signed up successfully', cookie: session.cookie };

      } catch (error) {
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to create session' };
      }
    } catch (error) {
      if (error.code === 'P2002') {
        return { status: HttpStatus.CONFLICT, message: 'Username already exists' };
      }
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Ooops...Something went wrong' };
    }
  }

  //protect versus sql injections!
  async signin(dto: AuthDto): Promise<{ status: HttpStatus, message?: string, cookie?: string }> {
    const user: User = await this.getVerifiedUserData(dto);
    if (!user) {
      return { status: HttpStatus.UNAUTHORIZED, message: 'Invalid credentials' };
    }

    const existingSession = await this.prisma.session.findFirst({ where: { userId: user.id }, });
    if (existingSession) {
      try {
        const jwtToken = existingSession.jwtToken;
        this.jwtService.verify(jwtToken, { ignoreExpiration: false });
        return { status: HttpStatus.ACCEPTED, message: 'You are already logged in' };
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          await this.prisma.session.delete({ where: { id: existingSession.id } });
          return { status: HttpStatus.UNAUTHORIZED, message: 'Your previous session has expired' };
        }
      }
    }
  
    try {
      const session = await this.createSession(user);
      return { status: HttpStatus.CREATED, message: 'You signed up successfully', cookie: session.cookie };

    } catch (error) {
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to create session' };
    }
  }

  async logout(@Req() request?: Request): Promise<{ status: HttpStatus, message?: string }> {
    try {
      const cookieParser = require('cookie-parser')
      const jwtToken = request.cookies.access_token;
      console.log("Token: ", jwtToken);
      if (!jwtToken) {
        throw new Error('Invalid token');
      }

      await this.prisma.session.deleteMany({
        where: {
          jwtToken: jwtToken,
        },
      });
  
      return { status: HttpStatus.OK, message: 'You have been logged out successfully.' };
    } catch (error) {
      console.log('Error ending session:', error);
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to end session' };
    }
  }
  
  async uploadProfilePicture(dto: AuthDto, @UploadedFile() file: Express.Multer.File): Promise<{ status: HttpStatus, message?: string }> {
  
    if (!file) {
      return { status: HttpStatus.BAD_REQUEST, message: 'File is required'};
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return { status: HttpStatus.BAD_REQUEST, message: "Invalid file type. Only JPG, JPEG, or PNG allowed" };
    }
  
    try {
      const user: User = await this.getVerifiedUserData(dto);
      if (!user) {
        return { status: HttpStatus.UNAUTHORIZED, message: 'Invalid credentials' };
      }
      
      if (user.profilePicture) {
        const res = await this.deleteProfilePicture(dto);
        if (res.status !== HttpStatus.OK) {
          return (res);
        }
      }
      
      const drive = await this.getGoogleDriveClient();
      if (!drive)
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to connect to the storage' };

      const response = await this.uploadFileToGoogleDrive(file, drive);
      if (response.status === HttpStatus.OK) {
        await this.prisma.user.update({
          where: { username: dto.username },
          data: { profilePicture: response.data.id },
        });
        return { status: HttpStatus.OK, message: "File uploaded successfully!"};
      } 
      else
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to upload file'};
    } catch (err) {
      console.error('Error uploading file:', err);
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to upload file'};
    }
  }

  async deleteProfilePicture(dto: AuthDto): Promise<{ status: HttpStatus, message?: string }> {
    try {
      const user: User = await this.getVerifiedUserData(dto);
      if (!user) {
        return { status: HttpStatus.UNAUTHORIZED, message: 'Invalid credentials' };
      }
  
      const drive = await this.getGoogleDriveClient();
      if (!drive) {
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to connect to the storage' };
      }
      await drive.files.delete({ fileId: user.profilePicture });

      await this.prisma.user.update({
        where: { username: dto.username },
        data: { profilePicture: "" },
      });
  
      return { status: HttpStatus.OK, message: 'Profile picture deleted successfully' };
    } catch (err) {
      console.error('Error deleting file:', err);
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to delete profile picture' };
    }
  }
  
  async getGoogleDriveAcessToken(dto: AuthDto): Promise<{ status: HttpStatus, message?: string }> {
    try {
      const user: User = await this.getVerifiedUserData(dto);
      if (!user)
        return { status: HttpStatus.UNAUTHORIZED, message: 'Invalid credentials' };
      
      const response = await axios.post('https://oauth2.googleapis.com/token', null, {
        params: {
          grant_type: "refresh_token",
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI,
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        },
      });
      return { status: HttpStatus.OK, message: response.data.access_token };
    } catch (error) {
      if (error.response && error.response.status === HttpStatus.UNAUTHORIZED) {
        return { status: HttpStatus.UNAUTHORIZED, message: 'Invalid client credentials' };
      }
      else
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to request access token from Google Drive' };
    }
  }

  //TODO: if this approach works, next step could be try to obtain list of usernames with appropriate picture id 
  //to get all profile pictures --> new controller function!
  // -- > so return a table or something like that, that frontend can parse and get all pictures
  async getProfilePicture(dto: AuthDto): Promise<{ fieldname: string; originalname: string; encoding: string; mimetype: string; buffer: any; size: number; }> | null {
    if (!dto.googleAccessToken) {
      return null;
    }

    const user: User = await this.getVerifiedUserData(dto);
    if (!user) {
      return null;
    }
    
    const fileId = user.profilePicture;
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&fields=mimeType,data`;

    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${dto.googleAccessToken}` },
        responseType: 'arraybuffer',
      });

      const fileData = response.data;
      const fileName = `profilePicture_${user.id}`;
      const mimeType = response.headers['content-type'];

      return {
        fieldname: 'profilePicture',
        originalname: fileName,
        encoding: '7bit',
        mimetype: mimeType,
        buffer: fileData,
        size: fileData.length,
      };
    } catch (error) {
      console.error(error);
      return null;
    }
  }


  //HELPING MEMBER FUNCTIONS
  private async createSession(user: User): Promise<{ status: HttpStatus, message?: string, cookie?: string }> {
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

  

  private async setFirstProfilePicture(dto: AuthDto, file?: Express.Multer.File) {
    try {
      if (file) {
        await this.uploadProfilePicture(dto, file);
      }
      else {
        const defaultAvatars = fs.readdirSync('./default_avatars');
        const randomIndex = Math.floor(Math.random() * defaultAvatars.length);
        const randomPicturePath = `./default_avatars/${defaultAvatars[randomIndex]}`;
        const buffer = fs.readFileSync(randomPicturePath);
        
        const defaultFile = {
          fieldname: 'profilePicture',
          originalname: defaultAvatars[randomIndex],
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: buffer,
          path: randomPicturePath,
        };
        this.uploadProfilePicture(dto, defaultFile as Express.Multer.File);
      }

      return { status: HttpStatus.CREATED };
    } catch (error) {
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Error uploading file' };
    }
  }

  private async uploadFileToGoogleDrive(file: Express.Multer.File, drive: any) {
    const path = require('path');
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
  
    return res;
  }

  private async getVerifiedUserData(dto: AuthDto): Promise<User | null> {
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
      return null;
    }
  
    const isPasswdMatch = await argon2.verify(user.hashedPasswd, dto.password);
    if (!isPasswdMatch) {
      return null;
    }
  
    return user;
  }
  
  private async  validateToken(dto: AuthDto): Promise<{ status: HttpStatus, message?: string }> {
    try {
      const url = 'https://api.intra.42.fr/v2/achievements';
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${dto.token_42}` },
        responseType: 'arraybuffer',
      });
      return { status: HttpStatus.OK, message: 'Token valid' };
    } catch(error){
      return { status: HttpStatus.UNAUTHORIZED, message: 'Token invalid' };
    }
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
