import { IsInt, IsOptional, IsBoolean } from 'class-validator';

export class KickDto {
  @IsInt()
  roomId: number;

  @IsInt()
  userId: number;
}

export class BanDto {
    @IsInt()
    roomId: number;

    @IsInt()
    userId: number;
}

export class UnbanDto {
    @IsInt()
    roomId: number;

    @IsInt()
    userId: number;
}

export class MuteDto {
    @IsInt()
    roomId: number;

    @IsInt()
    userId: number;

    @IsOptional()
    @IsInt()
    muteExpiresAt?: number; // It's optional and represents when the mute action will expire, it could be in timestamp format.
}

export class UnmuteDto {
    @IsInt()
    roomId: number;
  
    @IsInt()
    userId: number;
  }
  