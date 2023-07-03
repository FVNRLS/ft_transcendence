import { IsNumber, IsNotEmpty } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UserDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  roomId: number;

  @IsNotEmpty()
  role: UserRole;
}
