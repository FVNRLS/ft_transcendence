import { IsNotEmpty, IsString } from "class-validator";

export class FriendshipDto {
	@IsString()
	@IsNotEmpty()
	username: string
}
