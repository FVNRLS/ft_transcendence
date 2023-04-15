import { Body, Controller, HttpStatus, Post, UploadedFile, UseInterceptors, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service'
import { AuthDto } from './dto';

//TODO: implement SESSIONS with database!

@Controller('/auth')
export class AuthController {
	constructor(
		private authService: AuthService,
		) {}

	@Post('/signup')
	@UseInterceptors(FileInterceptor('file', { dest: 'uploads' }))
	async signup(@Body() dto: AuthDto, @UploadedFile() file?: Express.Multer.File): Promise<{ status: HttpStatus, message?: string }> {
		return this.authService.signup(dto, file);
	}

	@Post('/signin')
	signin(@Body() dto: AuthDto): Promise<{ status: HttpStatus, message?: string }> {
		return this.authService.signin(dto);
	}

	@Post('/logout')
	logout(@Body('token') token: string): Promise<{ status: HttpStatus, message?: string }> {
		return this.authService.logout(token);
	}

	@Post('/upload')
	@UseInterceptors(FileInterceptor('file', { dest: 'uploads' }))
	async uploadProfilePicture(@Body() dto: AuthDto, @UploadedFile() file: Express.Multer.File): Promise<{ status: HttpStatus, message?: string }> {
		return this.authService.uploadProfilePicture(dto, file);
	}

	@Post('/delete')
	@UseInterceptors(FileInterceptor('file', { dest: 'uploads' }))
	async deleteProfilePicture(@Body() dto: AuthDto): Promise<{ status: HttpStatus, message?: string }> {
		return this.authService.deleteProfilePicture(dto);
	}

	@Post('/get_google_drive_access_token')
	async getGoogleDriveAcessToken(@Body() dto: AuthDto): Promise<{ status: HttpStatus, message?: string }> {
		return this.authService.getGoogleDriveAcessToken(dto);
	}

	@Post('/get_profile_picture')
	async getProfilePicture(@Body() dto: AuthDto): Promise<{ fieldname: string; originalname: string; encoding: string; mimetype: string; buffer: any; size: number; }> | null {
		return this.authService.getProfilePicture(dto);
	}
}
