import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Socket } from 'socket.io';
import { SecurityService } from 'src/security/security.service';
import { Prisma, UserRole } from '@prisma/client';


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
          roomType: createRoomDto.roomType,
          password: createRoomDto.password,
          userId: client.data.userId,
        },
      });
    }
  

  async findAll() {
    return await this.prisma.room.findMany();
  }

  async findOne(roomId: number) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });
    if (!room) {
      throw new Error(`No room found for id ${roomId}`);
    }
    return room;
  }

  async update(roomId: number, updateRoomDto: UpdateRoomDto, client: Socket) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });
    if (!room) {
      throw new Error(`No room found for id ${roomId}`);
    }
    if (room.userId !== client.data.userId) {
      throw new Error('You are not authorized to update this room');
    }
    return this.prisma.room.update({
      where: { id: roomId },
      data: {
        id: updateRoomDto.roomId,
        roomName: updateRoomDto.roomName,
        roomType: updateRoomDto.roomType,
        password: updateRoomDto.password,
        userId: updateRoomDto.userId,
      },
    });
  }

  async remove(roomId: number, client: Socket) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });
    if (!room) {
      throw new Error(`No room found for id ${roomId}`);
    }
    if (room.userId !== client.data.userId) {
      throw new Error('You are not authorized to delete this room');
    }
    return this.prisma.room.delete({
      where: { id: roomId },
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

  async getUserRoom(userId: number, roomId: number) {
    return await this.prisma.userOnRooms.findUnique({
      where: { roomId_userId: { roomId, userId } }
    });
  }
  
  
  async getRoomMembers(roomId: number) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
  
    if (!room) {
      throw new Error('Room not found');
    }
  
    const userOnRooms = await this.prisma.userOnRooms.findMany({
      where: { roomId },
      include: { 
        user: {
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            username: true,
            email: true,
            profilePicture: true,
            // other fields you want to include
          }
        } 
      },
    });
  
    const roomMembers = userOnRooms.map((userOnRoom) => userOnRoom.user);
  
    return roomMembers;
  }

  async setUserRole(userId: number, roomId: number, role: UserRole) {
    const userRoom = await this.prisma.userOnRooms.findUnique({
      where: { roomId_userId: { roomId, userId } }
    });

    if (!userRoom) {
      throw new Error('User is not in this room');
    }

    return this.prisma.userOnRooms.update({
      where: { roomId_userId: { roomId, userId } },
      data: {
        role,
      },
    });
  }
   
}
