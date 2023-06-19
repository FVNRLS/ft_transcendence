/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   auth.controller.ts                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jtsizik <jtsizik@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:54:53 by rmazurit          #+#    #+#             */
/*   Updated: 2023/06/19 14:53:22 by jtsizik          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Body, Query, Controller, Get, Res, Post, UploadedFile, UseInterceptors} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthService } from "./auth.service"
import { AuthDto } from "./dto";
import { AuthResponse, UserDataResponse } from "./dto/response.dto";
import { Response } from 'express';

const app_ip = process.env.REACT_APP_IP;

@Controller("/auth")

export class AuthController {
	constructor( private authService: AuthService ) {}

	@Get("/authorize_callback")
	async authorizeCallback(@Query('code') code: string, @Res() res: Response, ): Promise<void> {
    try {
			const token = await this.authService.authorizeCallback(code);
			
			res.redirect(`http://${app_ip}:3000/form?token=${token}`);
    } catch (error) {
    	throw error;
    }
  }

	@Post("/signup")
	@UseInterceptors(FileInterceptor("file", {dest: "backup"}))
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
	@UseInterceptors(FileInterceptor("file", {dest: "backup"}))
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
