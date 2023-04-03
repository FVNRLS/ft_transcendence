import { Body, Controller, Get, Req, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service'
import { AuthDto } from './dto';


@Controller('/auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	// @Post('/authorize')
	// async authorize(token: string): Promise<boolean> {
	// 	return this.authService.authorize(token);
	// }

	@Post('/signup')
	async signup(@Body() dto: AuthDto): Promise<{ success: boolean }> {
		return this.authService.signup(dto);
	}

	// @Post('/signin')
	// signin(@Body() dto: AuthDto): Promise<Tokens> {
	// 	return this.authService.signinLocal(dto);
	// }

	// @Post('/logout')
	// @HttpCode(HttpStatus.OK)
	// logout(@GetCurrentUserId() userId: number): Promise<boolean> {
	//   return this.authService.logout(userId);
	// }
}



