/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   auth.controller.ts                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:54:53 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/26 17:37:42 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Body, Controller, Post, UploadedFile, UseInterceptors} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthService } from "./auth.service"
import { AuthDto } from "./dto";
import { ApiResponse } from "./dto/response.dto";

@Controller("/auth")
export class AuthController {
	constructor(
		private authService: AuthService,
		) {}

	@Post("/signup")
	@UseInterceptors(FileInterceptor("file", { dest: "uploads" }))
	async signup(@Body() dto: AuthDto, @UploadedFile() file?: Express.Multer.File): Promise<ApiResponse> {
		try {
			return this.authService.signup(dto, file);
		} catch(error) {
			throw error;
		}
	}

	@Post("/login")
	signin(@Body() dto: AuthDto): Promise<ApiResponse> {
		try {
			return this.authService.signin(dto);
		} catch(error) {
			throw error;
		}
	}

	@Post("/login_tfa")
	async signinWithTFA(@Body() dto: AuthDto): Promise<ApiResponse> {
		try {
			return await this.authService.signinWithTFA(dto);
		} catch (error) {
			return error;
		}
	}

	@Post("/logout")
	logout(@Body("cookie") cookie: string): Promise<ApiResponse> {
		try {
			return this.authService.logout(cookie);
		} catch (error) {
			throw error;
		}
	}

	@Post("/update_profile")
	@UseInterceptors(FileInterceptor("file", { dest: "uploads" }))
	updateProfile(@Body("cookie") cookie: string, @UploadedFile() file?: Express.Multer.File, @Body() dto?:AuthDto): Promise<ApiResponse> {
		try {
			return this.authService.updateProfile(cookie, file, dto);
		} catch (error) {
			throw error;
		}
	}
}
