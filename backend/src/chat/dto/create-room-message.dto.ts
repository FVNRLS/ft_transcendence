import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateMessageDto {
  @IsNumber()
  roomId: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}
