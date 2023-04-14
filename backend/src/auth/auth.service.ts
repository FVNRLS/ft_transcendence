import { HttpException, HttpStatus, Injectable, UploadedFile } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { AuthDto } from './dto';
import { randomBytes } from 'crypto';
import { createReadStream } from 'fs';
import { User } from '@prisma/client';
import axios from 'axios';
import { JwtService } from '@nestjs/jwt';
import * as fs from 'fs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}


  //CONTROLLER FUNCTIONS
  //TODO: protect versus sql injections!
  async signup(dto: AuthDto, file?: Express.Multer.File): Promise<{ status: HttpStatus, message?: string}> {
    
    const token = await this.validateToken(dto);
    if (token.status !== HttpStatus.OK)
      return token;
 
    const { salt, hashedPassword } = await this.hashPassword(dto.password);
    if (!salt || !hashedPassword)
      throw new HttpException('Failed to hash password', HttpStatus.INTERNAL_SERVER_ERROR);

    try {
      await this.prisma.user.create({
        data: {
          username: dto.username,
          hashed_passwd: hashedPassword,
          salt: salt,
          profile_picture: "",
        },
      });

      const result = await this.setFirstProfilePicture(dto, file);
      if (result.status !== HttpStatus.CREATED) {
        console.log("problems!!!1!\n");
        return(result);
      }
      
      const user: User = await this.getVerifiedUserData(dto);
      if (!user) {
        return { status: HttpStatus.UNAUTHORIZED, message: 'Invalid credentials' };
      }
      
      try {
        await this.createSession(user);
        return { status: HttpStatus.CREATED, message: 'Login successful' };
      } 
      catch (error) {
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to create session' };
      }
    }
    catch (error) {
      if (error.code === 'P2002')
        return { status: HttpStatus.CONFLICT, message: 'Username already exists' };
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Ooops...Something went wrong' };
    }
  }

  //protect versus sql injections!
  async signin(dto: AuthDto): Promise<{ status: HttpStatus, message?: string }> {
    const user: User = await this.getVerifiedUserData(dto);
    if (!user) {
      return { status: HttpStatus.UNAUTHORIZED, message: 'Invalid credentials' };
    }
  
    try {
      await this.createSession(user);
      return { status: HttpStatus.OK, message: 'Login successful' };
    } 
    catch (error) {
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to create session' };
    }
  }

  async logout(dto: AuthDto): Promise<{ status: HttpStatus, message?: string }> {
    const user = await this.getVerifiedUserData(dto);
    if (!user)
      return { status: HttpStatus.UNAUTHORIZED, message: 'Invalid credentials' };

    //TODO: end session here!
    try {
      // await this.prisma.user.update({
      //   where: {
      //     username: user.username,
      //   },
      //   data: {
      //     token: "",
      //   },
      // });
      return { status: HttpStatus.OK, message: 'You have been logged out successfully.' };
    }
    catch {
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to update database' };
    }
  }
  
  async uploadProfilePicture(dto: AuthDto, @UploadedFile() file: Express.Multer.File): Promise<{ status: HttpStatus, message?: string }> {
  
    if (!file)
      return { status: HttpStatus.BAD_REQUEST, message: 'File is required'};

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedMimeTypes.includes(file.mimetype))
      return { status: HttpStatus.BAD_REQUEST, message: "Invalid file type. Only JPG, JPEG, or PNG allowed" };
  
    try {
      const user: User = await this.getVerifiedUserData(dto);
      if (!user)
        return { status: HttpStatus.UNAUTHORIZED, message: 'Invalid credentials' };
      
      if (user.profile_picture)
        this.deleteProfilePicture(dto);
      
      const drive = await this.getGoogleDriveClient();
      if (!drive)
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to connect to the storage' };

      const response = await this.uploadFileToGoogleDrive(file, drive);
      if (response.status === HttpStatus.OK) {
        await this.prisma.user.update({
          where: { username: dto.username },
          data: { profile_picture: response.data.id },
        });
        return { status: HttpStatus.OK, message: "File uploaded successfully!"};
      } 
      else
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to upload file'};
    } 
    catch (err) {
      console.error('Error uploading file:', err);
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to upload file'};
    }
  }

  async deleteProfilePicture(dto: AuthDto): Promise<{ status: HttpStatus, message?: string }> {
    try {
      const user: User = await this.getVerifiedUserData(dto);
      if (!user)
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
    }
    catch (error) {
      if (error.response && error.response.status === HttpStatus.UNAUTHORIZED)
        return { status: HttpStatus.UNAUTHORIZED, message: 'Invalid client credentials' };
      else
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to request access token from Google Drive' };
    }
  }

  //TODO: if this approach works, next step could be try to obtain list of usernames with appropriate picture id 
  //to get all profile pictures --> new controller function!
  // -- > so return a table or something like that, that frontend can parse and get all pictures
  async getProfilePicture(dto: AuthDto): Promise<{ fieldname: string; originalname: string; encoding: string; mimetype: string; buffer: any; size: number; }> | null {
    if (!dto.googleAccessToken)
      return null;

    const user: User = await this.getVerifiedUserData(dto);
    if (!user)
      return null;
    
    const fileId = user.profile_picture;
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&fields=mimeType,data`;

    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${dto.googleAccessToken}` },
        responseType: 'arraybuffer',
      });

      const fileData = response.data;
      const fileName = `profile_picture_${user.id}`;
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
  private async createSession(user: User): Promise<string> {
    const payload = { userId: user.id };
    const token = this.jwtService.sign(payload);
    const sessionDuration = 4 * 60 * 60; // 4 hours in seconds
  
    try {
      await this.prisma.session.create({
        data: {
          jwt_token: token,
          userId: user.id,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + sessionDuration * 1000),
        },
      });
    } catch (error) {
      console.log('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  
    return token;
  }

  private async setFirstProfilePicture(dto: AuthDto, file?: Express.Multer.File) {
    try {
      if (file)
        this.uploadProfilePicture(dto, file);
      else {
        const defaultAvatars = fs.readdirSync('./default_avatars');
        const randomIndex = Math.floor(Math.random() * defaultAvatars.length);
        const randomPicturePath = `./default_avatars/${defaultAvatars[randomIndex]}`;
        const buffer = fs.readFileSync(randomPicturePath);
        
        const defaultFile = {
          fieldname: 'profile_picture',
          originalname: defaultAvatars[randomIndex],
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: buffer,
          path: randomPicturePath,
        };
        this.uploadProfilePicture(dto, defaultFile as Express.Multer.File);
      }

      return { status: HttpStatus.CREATED };
    } 
    catch (error) {
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

  private async getVerifiedUserData(dto: AuthDto): Promise<User> | null {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        username: true,
        salt: true,
        hashed_passwd: true,
        profile_picture: true,
      },
    });
    if (!user)
      return null;

    const isPasswdMatch = await argon2.verify(user.hashed_passwd, dto.password);
    if (!isPasswdMatch)
      return null;
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
    }
    catch(error){
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
