import { IsNumber } from 'class-validator';

export class GetRoomMessagesDto {
  @IsNumber()
  roomId: number;

  @IsNumber()
  limit: number;

  @IsNumber()
  offset: number;
}
