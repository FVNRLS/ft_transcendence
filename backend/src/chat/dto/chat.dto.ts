import { IsNotEmpty, IsString,  } from "class-validator";

export class ChatDto {
	@IsString()
	@IsNotEmpty()
	cookie: string

	@IsString()
	@IsNotEmpty()
	message: string

	@IsString()
	@IsNotEmpty()
	roomName: string
}