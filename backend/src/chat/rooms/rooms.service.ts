import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Socket } from 'socket.io';
import { SecurityService } from 'src/security/security.service';
import { Prisma, RoomType, User, UserRole } from '@prisma/client';
import * as argon2 from "argon2";
import { NotFoundException, BadRequestException } from '@nestjs/common';




@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private securityService: SecurityService
    ) {}

  async createGroupRoom(createRoomDto: CreateRoomDto) {
    const client_id = createRoomDto.members[createRoomDto.members.length - 1].id;
    let salt = null;
    let hashedPassword = null;

    if (createRoomDto.roomType == RoomType.PASSWORD && !createRoomDto.password)
    {
      return null;
    }

    if (createRoomDto.password)
    {
      const hashedResults = await this.securityService.hashPassword(createRoomDto.password);
      salt = hashedResults.salt;
      hashedPassword = hashedResults.hashedPassword;
    }
    const room = await this.prisma.room.create({
      data: {
        roomName:       createRoomDto.roomName,
        roomType:       createRoomDto.roomType,
        hashedPassword: hashedPassword,
        salt:           salt,
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

    // Get the users from the created room
    const users = newRoom.userOnRooms.map(ur => ur.user);
    let clientUser: any | undefined;
    let receivingUser: any | undefined;
    
    // Split the users into clientUser and receivingUser
    if (users.length === 2) {
      [clientUser, receivingUser] = users[0].id === client_id ? users : users.reverse();
    }

    return {
      id: newRoom.id,
      roomName: newRoom.roomName,
      roomType: newRoom.roomType,
      userId: client_id, // userId was missing from your return object
      userOnRooms: newRoom.userOnRooms, // userOnRooms was missing from your return object
      messages: newRoom.messages,
      clientUser,
      receivingUser,
    };
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
    let salt = null;
    let hashedPassword = null;

    if (updateRoomDto.password)
    {
      const hashedResults = await this.securityService.hashPassword(updateRoomDto.password);
      salt = hashedResults.salt;
      hashedPassword = hashedResults.hashedPassword;
    }
    return this.prisma.room.update({
      where: { id: roomId },
      data: {
        id:             updateRoomDto.roomId,
        roomName:       updateRoomDto.roomName,
        roomType:       updateRoomDto.roomType,
        hashedPassword: hashedPassword,
        salt:           salt,
        userId:         updateRoomDto.userId,
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

  async joinRoom(roomId: number, client: Socket, password?: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
  
    if (!room) {
      throw new Error('Room not found');
    }
  
    // If the room has a password and the room type is 'PASSWORD', check that the entered password is correct
    if (room.hashedPassword && room.salt && room.roomType === RoomType.PASSWORD) {
      if (!password) {
        throw new Error('This room requires a password to join.');
      }
  
      // const hashedPassword = await this.securityService.hashPassword(password, room.salt);
			const passwordValid = await argon2.verify(room.hashedPassword, password);

  
      if (!passwordValid) {
        throw new Error('Incorrect password.');
      }
    }
  
    const userId = client.data.userId;
    const userInRoom = await this.prisma.userOnRooms.findFirst({
      where: {
        userId: userId,
        roomId: roomId,
      },
    });
  
    if (!userInRoom) {
      await this.prisma.userOnRooms.create({
        data: {
          userId: userId,
          roomId: roomId,
        },
      });
    }
   return { success: true, message: "Sucessfully joined room." };

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
      where: {
        roomId_userId: {
          roomId: roomId,
          userId: userId,
        },
      },
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

  async updateRoomPassword(roomId: number, newPassword: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });
    if (!room || !newPassword) {
      throw new Error(`No room found for id ${roomId}`);
    }
    let salt = null;
    let hashedPassword = null;
    let roomType = RoomType.PASSWORD; // default to public


    const hashedResults = await this.securityService.hashPassword(newPassword);
    salt = hashedResults.salt;
    hashedPassword = hashedResults.hashedPassword;

  
    return this.prisma.room.update({
      where: { id: roomId },
      data: {
        hashedPassword,
        salt,
        roomType
      },
    });
  }

  async removeRoomPassword(roomId: number) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });
    if (!room) {
      throw new Error(`No room found for id ${roomId}`);
    }

    return this.prisma.room.update({
      where: { id: roomId },
      data: {
        hashedPassword: null,
        salt: null,
        roomType: 'PUBLIC',
      },
    });
}
  
  async getBlockedUsers(userId: number) {
    return this.prisma.block.findMany({
      where: { blockerId: userId },
    });
  }

  async getUserDirectRooms(userId: number, blockedUsers) {
    const userRooms = await this.prisma.userOnRooms.findMany({
      where: { userId: userId, room: { roomType: 'DIRECT' } },
      include: {
        room: {
          select: {
            id: true,
            roomName: true,
            roomType: true,
            // Include users in each room
            userOnRooms: {
              select: {
                user: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
              },
            },
            // Include last 100 messages in each room
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
              where: {
                NOT: blockedUsers.map(blockedUser => {
                  return {
                    userId: blockedUser.blockedId,
                    createdAt: {
                      gte: blockedUser.createdAt,
                    },
                  };
                }),
              },
            },
          },
        },
      },
    });

    // Format the returned data for Direct rooms
    return userRooms.map(userRoom => {
      const users = userRoom.room.userOnRooms.map(ur => ur.user);
      let clientUser: any | undefined;
      let receivingUser: any | undefined;
      
      // Split the users into clientUser and receivingUser
      if (users.length === 2) {
        [clientUser, receivingUser] = users[0].id === userId ? users : users.reverse();
      }

      return {
        id: userRoom.room.id,
        roomName: userRoom.room.roomName,
        roomType: userRoom.room.roomType,
        messages: userRoom.room.messages,
        clientUser,
        receivingUser,
      };
    });
  }

  async getUserGroupRooms(userId: number, blockedUsers) {
    const userRooms = await this.prisma.userOnRooms.findMany({
      where: { userId: userId, room: { roomType: { not: 'DIRECT' } } },
      include: {
        room: {
          select: {
            id: true,
            roomName: true,
            roomType: true,
            hashedPassword: true,
            // Include users in each room
            userOnRooms: {
              select: {
                user: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
                role: true,  // Include user role
              },
            },
            // Include last 100 messages in each room
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
              where: {
                NOT: blockedUsers.map(blockedUser => {
                  return {
                    userId: blockedUser.blockedId,
                    createdAt: {
                      gte: blockedUser.createdAt,
                    },
                  };
                }),
              },
            },
          },
        },
      },
    });

    // Format the returned data for Group rooms
    return userRooms.map(userRoom => ({
      id: userRoom.room.id,
      roomName: userRoom.room.roomName,
      roomType: userRoom.room.roomType,
      hasPassword: userRoom.room.hashedPassword !== null,
      users: userRoom.room.userOnRooms.map(ur => ({...ur.user, role: ur.role})), // Return user with role
      messages: userRoom.room.messages,
    }));
  }


  async getUserRooms(userId: number) {
    // Fetch blocked users by the logged-in user
    const blockedUsers = await this.getBlockedUsers(userId);

    // Fetch Direct Rooms
    const directRooms = await this.getUserDirectRooms(userId, blockedUsers);

    // Fetch Group Rooms
    const groupRooms = await this.getUserGroupRooms(userId, blockedUsers);

    // Combine and return the results
    return [...directRooms, ...groupRooms];
  }

  async kickUser(userId: number, roomId: number, client: Socket) {
    const userOnRoom = await this.prisma.userOnRooms.findFirst({
      where: {
        roomId,
        userId,
      },
    });
  
    if (!userOnRoom) throw new NotFoundException('User or room not found');
  
    // Here you can add logic to use the `client` object, if needed.
  
    // Remove user from the room
    await this.prisma.userOnRooms.delete({
      where: { id: userOnRoom.id },
    });
  }
  
  async banUser(userId: number, roomId: number, client: Socket) {
    const userOnRoom = await this.prisma.userOnRooms.findFirst({
      where: {
        roomId,
        userId,
      },
    });
  
    if (!userOnRoom) throw new NotFoundException('User or room not found');
  
    // Here you can add logic to use the `client` object, if needed.
  
    // Update the user's ban status
    await this.prisma.userOnRooms.update({
      where: { id: userOnRoom.id },
      data: { isBanned: true },
    });
  }

  async unbanUser(userId: number, roomId: number) {
    const userOnRoom = await this.prisma.userOnRooms.findFirst({
      where: {
        roomId,
        userId,
      },
    });
  
    if (!userOnRoom) throw new NotFoundException('User or room not found');
  
    // Update the user's ban status
    await this.prisma.userOnRooms.update({
      where: { id: userOnRoom.id },
      data: { isBanned: false },
    });
  }
  
  
  async muteUser(userId: number, roomId: number, muteExpiresAt: number, client: Socket) {
    const userOnRoom = await this.prisma.userOnRooms.findFirst({
      where: {
        roomId,
        userId,
      },
    });
  
    if (!userOnRoom) throw new NotFoundException('User or room not found');
  
    // Here you can add logic to use the `client` object, if needed.
  
    // Update the user's mute status
    await this.prisma.userOnRooms.update({
      where: { id: userOnRoom.id },
      data: { 
        isMuted: true,
        muteExpiresAt: muteExpiresAt ? new Date(muteExpiresAt) : null,
      },
    });
  }

  async unmuteUser(userId: number, roomId: number) {
    const userOnRoom = await this.prisma.userOnRooms.findFirst({
      where: {
        roomId,
        userId,
      },
    });
  
    if (!userOnRoom) throw new NotFoundException('User or room not found');
  
    // Update the user's mute status
    await this.prisma.userOnRooms.update({
      where: { id: userOnRoom.id },
      data: { 
        isMuted: false,
        muteExpiresAt: null,
      },
    });
  }
  
  

   
}
