import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsArray, ArrayNotEmpty, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export enum RoomType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  PASSWORD = 'PASSWORD',
  DIRECT = 'DIRECT'
}

class MemberDto {
  @IsInt()
  id: number;
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

  @IsArray()
  @ArrayNotEmpty()
  @Type(() => MemberDto)
  members?: MemberDto[];
}
