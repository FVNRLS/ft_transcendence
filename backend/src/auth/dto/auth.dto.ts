import { IsNotEmpty, IsString } from 'class-validator';
import { File } from 'express-fileupload';

export class AuthDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsString()
  token: string;

  profile_picture: File;
}