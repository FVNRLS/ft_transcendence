import { IsNotEmpty } from 'class-validator';

export class CreateDirectRoomDto {
  @IsNotEmpty()
  receivingUserId: number;
}
