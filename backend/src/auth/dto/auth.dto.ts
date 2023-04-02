import { IsNotEmpty, IsString } from 'class-validator'

export class AuthDto {
	@IsNotEmpty()
	@IsString()
	username: string;
}