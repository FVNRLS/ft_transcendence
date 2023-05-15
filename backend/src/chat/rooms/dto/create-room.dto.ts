// rooms/dto/create-room.dto.ts
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  roomName: string;

  @IsString()
  @IsNotEmpty()
  cookie: string;
}
