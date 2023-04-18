import { Body, Controller, HttpStatus, Post, UploadedFile, UseInterceptors, Req, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service'
import { Request } from 'express';
import { AuthDto } from './dto';

//TODO: implement SESSIONS with database!

@Controller('/auth')
export class AuthController {
	constructor(
		private authService: AuthService,
		) {}

	@Post('/signup')
	@UseInterceptors(FileInterceptor('file', { dest: 'uploads' }))
	async signup(@Body() dto: AuthDto, @UploadedFile() file?: Express.Multer.File): Promise<{ status: HttpStatus, message?: string, cookie?: string }> {
		return this.authService.signup(dto, file);
	}

	@Post('/signin')
	signin(@Body() dto: AuthDto) {
		return this.authService.signin(dto);
	}

	@Post('/logout')
	logout(@Req() request?: Request): Promise<{ status: HttpStatus, message?: string }> {
		return this.authService.logout(request);
	}
}
