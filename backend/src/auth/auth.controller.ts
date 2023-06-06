/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   auth.controller.ts                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jtsizik <jtsizik@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:54:53 by rmazurit          #+#    #+#             */
/*   Updated: 2023/06/03 15:56:58 by jtsizik          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Body, Query, Controller, Get, Res, Headers, Post, UploadedFile, UseInterceptors} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthService } from "./auth.service"
import { AuthDto } from "./dto";
import { AuthResponse, UserDataResponse } from "./dto/response.dto";
import { Response, Request } from 'express';

// const REDIRECT_URI = "http://localhost:5000/auth/authorize_callback";

@Controller("/auth")

export class AuthController {
	constructor( private authService: AuthService ) {}

	/*
		User accesses the /authorize endpoint.
		They are redirected to the authorization server to authorize the application.
		After authorization, the user is redirected back to the redirect_uri specified in the authorization request.
		The authorizeCallback() function is called, and the authorization code is received as a parameter.
		The authorization code can then be used to obtain an access token and complete the authorization process.
	*/
//   @Get("/authorize")
//   @Redirect(`https://api.intra.42.fr/oauth/authorize?client_id=${process.env.REACT_APP_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`, 200)
//   authorize() {}

  @Get("/authorize_callback")
  async authorizeCallback(@Query('code') code: string, @Res() res: Response, ): Promise<void> {
    try {
		const token = await this.authService.authorizeCallback(code);
		res.redirect(`http://localhost:3000/form?token=${token}`);
    } catch (error) {
    	throw error;
    }
  }

	@Post("/signup")
	@UseInterceptors(FileInterceptor("file", { dest: "uploads" }))
	async signup(@Body() dto: AuthDto, @UploadedFile() file?: Express.Multer.File): Promise<AuthResponse> {
		try {
			return await this.authService.signup(dto, file);
		} catch(error) {
			throw error;
		}
	}

	@Post("/login")
	async signin(@Body() dto: AuthDto): Promise<AuthResponse> {
		try {
			return await this.authService.signin(dto);
		} catch(error) {
			throw error;
		}
	}

	@Post("/login_tfa")
	async signinWithTFA(@Body() dto: AuthDto): Promise<AuthResponse> {
		try {
			return await this.authService.signinWithTFA(dto);
		} catch (error) {
			return error;
		}
	}

	@Post("/update_profile")
	@UseInterceptors(FileInterceptor("file", { dest: "uploads" }))
	async updateProfile(@Body("cookie") cookie: string, @UploadedFile() file?: Express.Multer.File, @Body("username") username?: string, @Body("email") email?: string): Promise<AuthResponse> {
		try {
			return await this.authService.updateProfile(cookie, file, username, email);
		} catch (error) {
			throw error;
		}
	}
	
	@Post("/logout")
	async logout(@Body("cookie") cookie: string): Promise<AuthResponse> {
		try {
			return await this.authService.logout(cookie);
		} catch (error) {
			throw error;
		}
	}

	@Post("/get_data")
	async getUserData(@Body('cookie') cookie: string): Promise<UserDataResponse> {
		try {
			return await this.authService.getUserData(cookie);
		} catch (error) {
			throw error;
		}
	}

	@Post("/set_status")
	async setUserStatus(@Body('cookie') cookie: string, @Body('status') status: string): Promise<AuthResponse> {
		try {
			return await this.authService.setUserStatus(cookie, status);
		} catch (error) {
			throw error;
		}
	}
}
