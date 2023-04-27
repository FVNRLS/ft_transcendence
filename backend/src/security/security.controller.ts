import { Body, Controller, Post } from "@nestjs/common";
import { AuthResponse } from "../auth/dto/response.dto";
import { SecurityService } from "./security.service";

@Controller("/security")
export class SecurityController {
	constructor( private securityService: SecurityService ) {}
	
	@Post("/change_tfa")
	async changeTFA(@Body("cookie") cookie: string): Promise<AuthResponse> {
		try {
			return this.securityService.changeTFA(cookie);
		} catch (error) {
			return error;
		}
	}

	@Post("/set_email")
	async setEmailAddress(@Body("cookie") cookie: string, @Body("email") email: string): Promise<AuthResponse> {
		try {
			return this.securityService.setEmailAddress(cookie, email);
		} catch (error) {
			return error;
		}
	}
}