import { SetMetadata } from '@nestjs/common';

export const HasRoomPermission = (role: string) => SetMetadata('role', role);
