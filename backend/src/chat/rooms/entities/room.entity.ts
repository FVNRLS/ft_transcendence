import { RoomType, UserRole } from '@prisma/client'; // import enums from prisma client

export class UserOnRoomDto {
  user: {
    id: number;
    username: string;
  };
}

export class UserDto {
  id: number;
  username: string;
  // include other properties as required
}


export class MessageDto {
  userId?: number;
  id?: number;
  createdAt?: Date; 
  user?: UserDto;
  roomId?: number;
  content?: string;
}

export class RoomDetailsDto {
  id: number;
  roomName: string;
  roomType: RoomType;
  password?: string;
  userId: number;
  userOnRooms: UserOnRoomDto[];
  messages: MessageDto[];
  clientUser?: any; // added
  receivingUser?: any; // added
}
