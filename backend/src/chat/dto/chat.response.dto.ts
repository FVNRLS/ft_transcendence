import { HttpStatus } from "@nestjs/common";

export interface ChatResponse {
	status: HttpStatus,
	message?: string
}