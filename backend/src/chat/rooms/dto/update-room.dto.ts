import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomDto } from './create-room.dto';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  @IsNumber()
  roomId: number;

  @IsString()
  roomName: string;

  @IsNumber()
  userId: number;
}
