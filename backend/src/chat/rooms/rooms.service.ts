import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Socket } from 'socket.io';
import { SecurityService } from 'src/security/security.service';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private securityService: SecurityService
    ) {}
  

  async create(createRoomDto: CreateRoomDto, client: Socket) {
    return await this.prisma.room.create({
      data: {
        roomName: createRoomDto.roomName,
        userId: client.data.userId,
      },
    });
  }
  

  async findAll() {
    return await this.prisma.room.findMany();
  }

  async findOne(id: number) {
    const room = await this.prisma.room.findUnique({
      where: { id },
    });
    if (!room) {
      throw new Error(`No room found for id ${id}`);
    }
    return room;
  }

  async update(id: number, updateRoomDto: UpdateRoomDto, client: Socket) {
    const room = await this.prisma.room.findUnique({
      where: { id },
    });
    if (!room) {
      throw new Error(`No room found for id ${id}`);
    }
    if (room.userId !== client.data.userId) {
      throw new Error('You are not authorized to update this room');
    }
    return this.prisma.room.update({
      where: { id },
      data: {
        id: updateRoomDto.id,
        roomName: updateRoomDto.roomName,
        userId: updateRoomDto.userId,
      },
    });
  }

  async remove(id: number, client: Socket) {
    const room = await this.prisma.room.findUnique({
      where: { id },
    });
    if (!room) {
      throw new Error(`No room found for id ${id}`);
    }
    if (room.userId !== client.data.userId) {
      throw new Error('You are not authorized to delete this room');
    }
    return this.prisma.room.delete({
      where: { id },
    });
  }

  async joinRoom(roomId: number, client: Socket) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
  
    if (!room) {
      throw new Error('Room not found');
    }
  
    // Assuming the client has userId stored in it
    const userId = client.data.userId;
  
    // First, check if the user is already in the room
    const userInRoom = await this.prisma.userOnRooms.findFirst({
      where: {
        userId: userId,
        roomId: roomId,
      },
    });
  
    // If the user is not in the room, add them
    if (!userInRoom) {
      await this.prisma.userOnRooms.create({
        data: {
          userId: userId,
          roomId: roomId,
        },
      });
    }
  
    // client.join(`room-${roomId}`);
    // return { message: 'Joined room', roomId: roomId };

    // Check if the user is already in the room in the Socket
    const roomName = `room-${roomId}`;
    if (client.rooms.has(roomName)) {
      return { message: 'User already in room', roomId: roomId };
    } else {
      client.join(roomName);
      return { message: 'Joined room', roomId: roomId };
    }
  }

  async leaveRoom(roomId: number, client: Socket) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
  
    if (!room) {
      throw new Error('Room not found');
    }
  
    const userId = client.data.userId;
  
    const userInRoom = await this.prisma.userOnRooms.findFirst({
      where: {
        userId: userId,
        roomId: roomId,
      },
    });
  
    // If the user is in the room, remove them
    if (userInRoom) {
      await this.prisma.userOnRooms.delete({
        where: {
          id: userInRoom.id,
        },
      });
    }
  
    client.leave(`room-${roomId}`);
    return { message: 'Left room', roomId: roomId };
  }

  async isUserInRoom(userId: number, roomId: number) {

    const userRoom = await this.prisma.userOnRooms.findUnique({
      where: { roomId_userId: { roomId, userId } }
    });
    
    return !!userRoom; // return true if userRoom exists, false otherwise
  }
  
  
  
}
