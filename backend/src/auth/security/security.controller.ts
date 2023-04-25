import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiResponse } from '../dto/response.dto';
import { SecurityService } from './security.service';

@Controller('/security')
export class SecurityController {
	constructor( private securityService: SecurityService ) {}
	
	@Post('/change_tfa')
	async changeTFA(@Body('cookie') cookie: string): Promise<ApiResponse> {
		try {
			return this.securityService.changeTFA(cookie);
		} catch (error) {
			return error;
		}
	}
}