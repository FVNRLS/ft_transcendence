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

  async createGroupRoom(createRoomDto: CreateRoomDto) {
    const client_id = createRoomDto.members[createRoomDto.members.length - 1].id;
    const room = await this.prisma.room.create({
      data: {
        roomName: createRoomDto.roomName,
        roomType: createRoomDto.roomType,
        password: createRoomDto.password,
        userId: client_id,
      },
    });
    
    const userIds = createRoomDto.members.map(member => member.id);
    if (!userIds) {
      console.log("USERIDS IS NULL");
    } else {
      await this.addUsersToRoom(room.id, userIds);
    }
    
    this.setUserRole(client_id, room.id, UserRole.OWNER);
    
    // Fetch the room with its related data
    const newRoom = await this.prisma.room.findUnique({
      where: { id: room.id },
      include: {
        userOnRooms: {
          select: {
            user: {
              select: {
                id: true,
                username: true,
                // Include other fields as required
              }
            }
          }
        },
        messages: {
          select: {
            id: true,
            userId: true,
            roomId: true,
            createdAt: true,
            content: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 100,
        },
        // Include other room data as required
      },
    });
    
    return newRoom;
  }
  

//   async addUsersToRoom(roomId: number, userIds: number[]) {
//     // Add users to the room in the database
//     if (roomId) {
//       for (let userId of userIds) {
//         if (userId) {
//           await this.prisma.userOnRooms.create({
//               data: {
//                   roomId: roomId,
//                   userId: userId,
//                   role: UserRole.MEMBER, // you can change the role based on your need
//               },
//           });
//       }
//         }
//     }
// }

async addUsersToRoom(roomId: number, userIds: number[]) {
  // Add users to the room in the database
  if (roomId) {
    for (let userId of userIds) {
      if (userId) {
        // Check if the user is already in the room
        const existingEntry = await this.prisma.userOnRooms.findUnique({
          where: {
            roomId_userId: {
              roomId: roomId,
              userId: userId,
            },
          },
        });

        // If the user is not in the room, add them
        if (!existingEntry) {
          await this.prisma.userOnRooms.create({
            data: {
              roomId: roomId,
              userId: userId,
              role: UserRole.MEMBER, // you can change the role based on your need
            },
          });
        }
      }
    }
  }
}


  async createDirectRoom(createRoomDto: CreateRoomDto) {
    console.log("Create Direct Room");

    const user1Id = createRoomDto.members[0].id;
    console.log(user1Id);
    const client_id = createRoomDto.members[createRoomDto.members.length - 1].id;
    console.log(client_id);
    // Check if a direct room already exists between the two users
    const existingRoom = await this.prisma.room.findFirst({
      where: {
        roomType: 'DIRECT',
        AND: [
          {
            userOnRooms: {
              some: {
                userId: user1Id,
              },
            },
          },
          {
            userOnRooms: {
              some: {
                userId: client_id,
              },
            },
          },
        ],
      },
      include: {
        userOnRooms: true,
      },
    });
    
    

    console.log(existingRoom);
    if (existingRoom) {
      console.log("Room already exists");
      return null;
    }
    const room = await this.prisma.room.create({
      data: {
        roomName: createRoomDto.roomName,
        roomType: createRoomDto.roomType,
        password: createRoomDto.password,
        userId: client_id,
      },
    });
    
    const userIds = createRoomDto.members.map(member => member.id);
    if (!userIds) {
      console.log("USERIDS IS NULL");
    } else {
      await this.addUsersToRoom(room.id, userIds);
    }
    
    this.setUserRole(client_id, room.id, UserRole.OWNER);
    
    // Fetch the room with its related data
    const newRoom = await this.prisma.room.findUnique({
      where: { id: room.id },
      include: {
        userOnRooms: {
          select: {
            user: {
              select: {
                id: true,
                username: true,
                // Include other fields as required
              }
            }
          }
        },
        messages: {
          select: {
            id: true,
            userId: true,
            roomId: true,
            createdAt: true,
            content: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 100,
        },
        // Include other room data as required
      },
    });
    
    return newRoom;
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
  
  
  async getRoomMembers(roomId: number, clientId: number = null, excludeClient: boolean = false) {
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
          }
        } 
      },
    });
  
    let roomMembers = userOnRooms.map((userOnRoom) => userOnRoom.user);
    
    if (excludeClient && clientId !== null) {
      roomMembers = roomMembers.filter(member => member.id !== clientId);
    }
  
    return roomMembers;
  }
  

  async setUserRole(userId: number, roomId: number, role: UserRole) {
    console.log(`userId: ${userId}, roomId: ${roomId}, role: ${role}`);
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
