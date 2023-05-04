import { Body, Controller, Post } from "@nestjs/common";
import { ChatDto } from "./dto";
import { ChatService } from "./chat.service";

@Controller("/chat")
export class ChatController {

	constructor(
		private chatService: ChatService
	) {}

	@Post()
	async sendMessage(@Body() dto: ChatDto) {
			try {
				return await this.chatService.sendMessage(dto);
			} catch (error) {
				throw error;
			}
	}
	}