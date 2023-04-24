import { Body, Controller, HttpStatus, Post, UploadedFile, UseInterceptors, Req, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthDto } from '../dto';
import { ApiResponse } from '../dto/response.dto';
import { GoogleDriveService } from './google.drive.service';

@Controller('/storage')
export class GoogleDriveController {
	constructor(
		private googleDriveService: GoogleDriveService)
	{}
	
	@Post('/upload')
	@UseInterceptors(FileInterceptor('file', { dest: 'uploads' }))
	async uploadProfilePicture(@Body('cookie') cookie: string, @UploadedFile() file: Express.Multer.File): Promise<ApiResponse> {
		try {
			return this.googleDriveService.uploadProfilePicture(cookie, file);
		} catch (error) {
			return error;
		}
	}

	@Post('/delete')
	// @UseInterceptors(FileInterceptor('file', { dest: 'uploads' }))
	async deleteProfilePicture(@Body('cookie') cookie: string): Promise<ApiResponse> {
		try {
			return this.googleDriveService.deleteProfilePicture(cookie);
		} catch (error) {
			return error;
		}
	}

	@Post('/get_google_drive_access_token')
	async getGoogleDriveAcessToken(@Body() dto: AuthDto): Promise<ApiResponse> {
		try {
			return this.googleDriveService.getGoogleDriveAcessToken(dto);
		} catch (error) {
			return error;
		}
	}

	@Post('/get_profile_picture')
	async getProfilePicture(@Body() dto: AuthDto): Promise<{ fieldname: string; originalname: string; encoding: string; mimetype: string; buffer: any; size: number; }> {
		try {
			return this.googleDriveService.getProfilePicture(dto);
		} catch (error) {
			return error;
		}
	}
}