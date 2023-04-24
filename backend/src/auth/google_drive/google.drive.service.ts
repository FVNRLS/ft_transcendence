/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   google.drive.service.ts                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:54:11 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/24 15:31:28 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Body, HttpException, HttpStatus, Injectable, UploadedFile } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SecurityService } from '../security.service';
import { AuthDto } from '../dto';
import * as fs from 'fs';
import { Session, User } from '@prisma/client';
import axios from 'axios';
import { JwtService } from '@nestjs/jwt';
import { ApiResponse } from '../dto/response.dto';


@Injectable()
export class GoogleDriveService {
	constructor(
		private securityService: SecurityService,
    private prisma: PrismaService,
    private jwtService: JwtService,
	) {}

	async setFirstProfilePicture(@Body('cookie') cookie: string, file?: Express.Multer.File): Promise<void> {

    
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

      return ;
    } catch (error) {
			throw new HttpException('Ooops...Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async uploadProfilePicture(cookie: string, @UploadedFile() file: Express.Multer.File): Promise<ApiResponse> {
    if (!file) {
      throw new HttpException("File is required", HttpStatus.BAD_REQUEST);
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new HttpException("Invalid file type. Only JPG, JPEG, or PNG allowed", HttpStatus.BAD_REQUEST);
    }

    try {
      const existingSession: Session = await this.securityService.verifyCookie(cookie);
      const user = await this.prisma.user.findFirst({ where: { id: existingSession.userId } });
      if (user.profilePicture)
        await this.deleteProfilePicture(cookie);
      
      const drive = await this.getGoogleDriveClient();
      const response = await this.uploadFileToGoogleDrive(file, drive);
      
      await this.prisma.user.update({ where: { username: user.username }, data: { profilePicture: response.data.id } });

      return { status: HttpStatus.OK, message: "File uploaded successfully!"};
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
				throw new HttpException('Ooops...Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  private async uploadFileToGoogleDrive(file: Express.Multer.File, drive: any): Promise<any> {
    try {
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
    } catch (error) {
				throw new HttpException('Ooops...Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async getGoogleDriveClient(): Promise<any> {
    try {
      const { google } = require('googleapis');
      const oauth2Client = new google.auth.OAuth2({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
      });
      oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
      const drive = google.drive({ version: 'v3', auth: oauth2Client });  
      
      return Promise.resolve(drive);
    } catch (error) {
				throw new HttpException('Ooops...Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteProfilePicture(@Body('cookie') cookie: string): Promise<ApiResponse> {
    try {
      const existingSession: Session = await this.securityService.verifyCookie(cookie);

      const drive = await this.getGoogleDriveClient();
      
      const user = await this.prisma.user.findFirst({ where: { id: existingSession.userId } });  
      const fileId = user.profilePicture;
      await drive.files.delete({ fileId: fileId });

      await this.prisma.user.update({ where: { id: existingSession.userId }, data: { profilePicture: "" } });
      return { status: HttpStatus.OK, message: 'Profile picture deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
				throw new HttpException('Ooops...Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  
  async getGoogleDriveAcessToken(dto: AuthDto): Promise<ApiResponse> {
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