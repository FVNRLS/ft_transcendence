import { Body, Controller, Get, Req, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service'
import { AuthDto } from './dto';
import { Tokens } from './types';


@Controller('/auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post('/signup')
	async signupLocal(@Body() dto: AuthDto): Promise<Tokens> {
		return this.authService.signupLocal(dto);
	}

	// @Post('/signin')
	// signinLocal(@Body() dto: AuthDto): Promise<Tokens> {
	// 	return this.authService.signinLocal(dto);
	// }

	// @Post('/logout')
	// @HttpCode(HttpStatus.OK)
	// logout(@GetCurrentUserId() userId: number): Promise<boolean> {
	//   return this.authService.logout(userId);
	// }
}