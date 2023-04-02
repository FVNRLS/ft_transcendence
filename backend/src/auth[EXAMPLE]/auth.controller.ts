import { Body, Controller, Get, Req, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service'
import { AuthDto } from './dto';
import { Tokens } from './types';
import { RtGuard, AtGuard } from './guards';
import { GetCurrentUserId, Public, GetCurrentUser } from './decorators'

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {

	}

	@Post('/local/signup')
	async signupLocal(@Body() dto: AuthDto): Promise<Tokens> {
		return this.authService.signupLocal(dto);
	}

	@Post('/local/signin')
	signinLocal(@Body() dto: AuthDto): Promise<Tokens> {
		return this.authService.signinLocal(dto);
	}

	@Post('logout')
	@HttpCode(HttpStatus.OK)
	logout(@GetCurrentUserId() userId: number): Promise<boolean> {
	  return this.authService.logout(userId);
	}
  
	@Public()
	@UseGuards(RtGuard)
	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	refreshTokens(
	  @GetCurrentUserId() userId: number,
	  @GetCurrentUser('refreshToken') refreshToken: string,
	): Promise<Tokens> {
	  return this.authService.refreshTokens(userId, refreshToken);
	}
}
