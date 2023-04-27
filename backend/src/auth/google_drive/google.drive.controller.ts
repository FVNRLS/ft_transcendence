/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   google.drive.controller.ts                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:54:42 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/27 17:37:20 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Body, Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthResponse, FileResponse } from "../dto/response.dto";
import { GoogleDriveService } from "./google.drive.service";

@Controller("/storage")
export class GoogleDriveController {
	constructor(
		private googleDriveService: GoogleDriveService)
	{}
	
	@Post("/upload")
	@UseInterceptors(FileInterceptor("file", { dest: "uploads" }))
	async uploadProfilePicture(@Body("cookie") cookie: string, @UploadedFile() file: Express.Multer.File): Promise<AuthResponse> {
		try {
			return this.googleDriveService.uploadProfilePicture(cookie, file);
		} catch (error) {
			return error;
		}
	}

	@Post("/delete")
	async deleteProfilePicture(@Body("cookie") cookie: string): Promise<AuthResponse> {
		try {
			return this.googleDriveService.deleteProfilePicture(cookie);
		} catch (error) {
			return error;
		}
	}

	@Post("/get_profile_picture")
	async getProfilePicture(@Body("cookie") cookie: string): Promise<FileResponse> {
		try {
			return this.googleDriveService.getProfilePicture(cookie);
		} catch (error) {
			return error;
		}
	}
}