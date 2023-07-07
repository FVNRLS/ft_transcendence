import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateMessageDto {

  @IsNumber()
  roomId: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}
