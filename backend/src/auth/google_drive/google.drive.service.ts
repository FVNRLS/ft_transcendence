import { Body, HttpStatus, Injectable, UploadedFile } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SecurityService } from '../security.service';
import { AuthDto } from '../dto';
import * as fs from 'fs';
import { User } from '@prisma/client';
import axios from 'axios';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class GoogleDriveService {
	constructor(
		private securityService: SecurityService,
    private prisma: PrismaService,
    private jwtService: JwtService,
	) {}

	async setFirstProfilePicture(@Body('cookie') cookie: string, file?: Express.Multer.File) {

    
    try {
      if (file) {
        await this.uploadProfilePicture(cookie, file);
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
        this.uploadProfilePicture(cookie, defaultFile as Express.Multer.File);
      }

      return { status: HttpStatus.CREATED };
    } catch (error) {
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Error uploading file' };
    }
  }

  async uploadProfilePicture(cookie: string, @UploadedFile() file: Express.Multer.File): Promise<{ status: HttpStatus, message?: string }> {
    if (!file) {
      return { status: HttpStatus.BAD_REQUEST, message: 'File is required'};
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return { status: HttpStatus.BAD_REQUEST, message: "Invalid file type. Only JPG, JPEG, or PNG allowed" };
    }

    const decryptedCookieHash = await this.securityService.decryptCookie(cookie);
    const existingSession = await this.prisma.session.findFirst({ where: { hashedCookie: decryptedCookieHash } });
    try {
      await argon2.verify(decryptedCookieHash.toString(), existingSession.serializedCookie);

      const jwtToken = existingSession.jwtToken;
      this.jwtService.verify(jwtToken, { ignoreExpiration: false });
      
      try {
        const user = await this.prisma.user.findFirst({ where: { id: existingSession.userId } });  
        if (user.profilePicture) {
          const res = await this.deleteProfilePicture(cookie);
          if (res.status !== HttpStatus.OK) {
            return (res);
          }
        }
        
        const drive = await this.getGoogleDriveClient();
        if (!drive)
          return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to connect to the storage' };
  
        const response = await this.uploadFileToGoogleDrive(file, drive);
        if (response.status === HttpStatus.OK) {
          await this.prisma.user.update({ where: { username: user.username }, data: { profilePicture: response.data.id } });
          return { status: HttpStatus.OK, message: "File uploaded successfully!"};
        } 
        else
          return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to upload file'};
      } catch (err) {
        console.error('Error uploading file:', err);
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to upload file'};
      }

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        await this.prisma.session.delete({ where: { id: existingSession.id } });
        return { status: HttpStatus.UNAUTHORIZED, message: 'Your previous session has expired' };
      }
      else {
        return { status: HttpStatus.UNAUTHORIZED, message: 'Invalid credentials' };
      }
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
      body: fs.createReadStream(filePath),
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

  async deleteProfilePicture(@Body('cookie') cookie: string): Promise<{ status: HttpStatus, message?: string }> {
    const decryptedCookieHash = await this.securityService.decryptCookie(cookie);
    const existingSession = await this.prisma.session.findFirst({ where: { hashedCookie: decryptedCookieHash } });
    try {
      try {
        await argon2.verify(decryptedCookieHash.toString(), existingSession.serializedCookie);
        const jwtToken = existingSession.jwtToken;
        this.jwtService.verify(jwtToken, { ignoreExpiration: false });
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          await this.prisma.session.delete({ where: { id: existingSession.id } });
          return { status: HttpStatus.UNAUTHORIZED, message: 'Your previous session has expired' };
        } else {
          return { status: HttpStatus.UNAUTHORIZED, message: 'Invalid credentials' };
        }
      }

      const drive = await this.getGoogleDriveClient();
      if (!drive) {
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to connect to the storage' };
      }
      const user = await this.prisma.user.findFirst({ where: { id: existingSession.userId } });  
      if (user.profilePicture) {
        const fileId = user.profilePicture;
        try {
          await drive.files.delete({ fileId: fileId });
        } catch (err) {
          console.error('Error deleting file:', err);
          return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to delete profile picture' };
        }
      }
      await this.prisma.user.update({ where: { id: existingSession.userId }, data: { profilePicture: "" } });
      return { status: HttpStatus.OK, message: 'Profile picture deleted successfully' };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to delete profile picture' };
    }
  }

  
  async getGoogleDriveAcessToken(dto: AuthDto): Promise<{ status: HttpStatus, message?: string }> {
    try {
      const user: User = await this.securityService.getVerifiedUserData(dto);
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

    const user: User = await this.securityService.getVerifiedUserData(dto);
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
}