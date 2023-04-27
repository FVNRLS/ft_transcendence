/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   auth.controller.ts                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:54:53 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/27 18:03:54 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Body, Controller, Post, UploadedFile, UseInterceptors} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthService } from "./auth.service"
import { AuthDto } from "./dto";
import { AuthResponse } from "./dto/response.dto";

@Controller("/auth")
export class AuthController {
	constructor(
		private authService: AuthService,
		) {}

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
	async updateProfile(@Body("cookie") cookie: string, @UploadedFile() file?: Express.Multer.File, @Body() dto?:AuthDto, @Body("email") email?: string): Promise<AuthResponse> {
		try {
			return await this.authService.updateProfile(cookie, file, dto, email);
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
}
