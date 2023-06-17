import { RoomType, UserRole } from '@prisma/client'; // import enums from prisma client

export class UserOnRoomDto {
  user: {
    id: number;
    username: string;
  };
}

export class MessageDto {
  id: number;
  userId: number;
  roomId: number;
  createdAt: Date;
  content: string;
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
