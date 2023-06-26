import { IsNumber, IsNotEmpty } from 'class-validator';
import { UserRole } from '@prisma/client';

export class SetUserRoleDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  roomId: number;

  @IsNotEmpty()
  role: UserRole;
}
