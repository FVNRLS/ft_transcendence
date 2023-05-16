import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateDirectMessageDto {
  @IsNotEmpty()
  @IsNumber()
  receiverId: number;

  @IsNotEmpty()
  @IsString()
  content: string;
}
