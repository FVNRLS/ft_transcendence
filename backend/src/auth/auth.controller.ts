import { Body, Controller, Get, Req, HttpCode, HttpStatus, Post, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service'
import { AuthDto } from './dto';


@Controller('/auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post('/signup')
	async signup(@Body() dto: AuthDto): Promise<{ status: HttpStatus, message?: string }> {
		return this.authService.signup(dto);
	}

	@Post('/signin')
	signin(@Body() dto: AuthDto): Promise<{ status: HttpStatus, message?: string }> {
		return this.authService.signin(dto);
	}

	@Post('/logout')
	logout(@Body() dto: AuthDto): Promise<{ status: HttpStatus, message?: string }> {
		return this.authService.logout(dto);
	}

	@Post('/upload')
	@UseInterceptors(FileInterceptor('file', { dest: 'uploads' }))
	async upload(@UploadedFile() file): Promise<{ status: HttpStatus, message?: string }> {
	  return this.authService.uploadFile(file);
	}

}
