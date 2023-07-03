import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ReadUserDto {
  @IsNumber()
  id: number;

  @IsString()
  username: string;
}

export class ReadDirectRoomUserDto {
  @IsNotEmpty()
  user: ReadUserDto;
}

export class ReadDirectRoomDto {
  @IsNumber()
  id?: number;

  @IsNotEmpty()
  users: ReadDirectRoomUserDto [];
}
