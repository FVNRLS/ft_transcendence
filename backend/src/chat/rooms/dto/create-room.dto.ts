// rooms/dto/create-room.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional } from 'class-validator';

export enum RoomType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  PASSWORD = 'PASSWORD',
  DIRECT = 'DIRECT'
}

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  roomName: string;

  @IsEnum(RoomType)
  roomType: RoomType;

  @IsString()
  @IsOptional()
  password?: string;

  @IsNumber()
  userId: number;
}
