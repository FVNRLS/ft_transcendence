import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class SendDirectMessageDto {
  @IsNumber()
  receiverId: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}
