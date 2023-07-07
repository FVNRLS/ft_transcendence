import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecurityService } from 'src/security/security.service';
import { CreateDirectRoomDto } from './dto/create-direct-room.dto';
import { DirectRoom } from '@prisma/client';
import { BaseRoomService } from './base-room.service';
import { BlockService } from './block.service';

interface UserForClient {
    id: number;
    username: string;
  }
  
interface DirectRoomUserForClient {
    user: UserForClient;
}
  
interface SafeDirectRoomForClient {
    id?: number; // Include other fields from the DirectRoom model as needed
    users: DirectRoomUserForClient[];
}

@Injectable()
export class DirectRoomsService extends BaseRoomService {
    private readonly logger = new Logger(DirectRoomsService.name);
  
    constructor(
    private readonly prisma: PrismaService,
    private blockService: BlockService,
    ) {
        super(prisma.directRoom);
    }

    // Helper method to find a direct room with given user IDs
    async findDirectRoomWithUsers(clientId: number, user1Id: number): Promise<DirectRoom | null> {
        return this.prisma.directRoom.findFirst({
            where: {
                AND: [
                    {
                        users: {
                            some: {
                                userId: clientId,
                            },
                        },
                    },
                    {
                        users: {
                            some: {
                                userId: user1Id,
                            },
                        },
                    },
                ],
            },
        });
    }

    // Checks if a direct room exists between two users
    private async directRoomExists(clientId: number, user1Id: number): Promise<boolean> {
        const room = await this.findDirectRoomWithUsers(clientId, user1Id);
        return room !== null;
    }


    // Helper method to create a new direct room and add users to it
    private async createDirectRoomInDataBase(clientId: number, userId: number): Promise<SafeDirectRoomForClient> {
        const newDirectRoom = await this.prisma.directRoom.create({
        data: {
            users: {
                create: [
                    {
                        userId: clientId,
                    },
                    {
                        userId: userId,
                    },

                ]
            }
        },
        include: {
            users: {
            select: {
                user: {
                select: {
                    id: true,
                    username: true,
                }
                }
            },
            },
        },
        });
    
        return newDirectRoom; 
    }

    // Helper method to identify a user by their ID
    private getUserFromId(users: DirectRoomUserForClient[], id: number): DirectRoomUserForClient | undefined {
        return users.find(user => user.user.id === id);
    }

    async createDirectRoom(
        createDirectRoomDto: CreateDirectRoomDto,
        userId: number,
        ) {
            const receivingUserId = createDirectRoomDto.receivingUserId;
            const client_id = userId;
    

            // Check if a direct room already exists between the two users
            const doesDirectRoomExist = await this.directRoomExists(client_id, receivingUserId);
    
            if (doesDirectRoomExist) {
                throw new Error("Direct room already exists");
            }
    
            // Create a new direct room and add users to it
            const newDirectRoom = await this.createDirectRoomInDataBase(client_id, receivingUserId);
            
            const clientUser = this.getUserFromId(newDirectRoom.users, client_id);
            const receivingUser = this.getUserFromId(newDirectRoom.users, receivingUserId);

            return {
                ...newDirectRoom,
                clientUser,
                receivingUser,
            };
    }

    async getUserDirectRooms(userId: number): Promise<SafeDirectRoomForClient[]> {
        const blockedUsers = await this.blockService.getBlockedUsers(userId);
    
        const userDirectRooms = await this.prisma.directRoom.findMany({
            where: { 
                users: {
                    some: {
                        userId: userId
                    }
                }
            },
            include: {
                users: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                    },
                },
                // Include last 100 directMessages in each room
                directMessages: {
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
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                        userId: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                            }
                        }
                    },
                },
            },
        });
        
    
        // Format the returned data for Direct rooms
        return userDirectRooms.map(userDirectRoom => {
            // Split the users into clientUser and receivingUser
            const clientUser = this.getUserFromId(userDirectRoom.users, userId);
            const receivingUser = userDirectRoom.users.find(user => user.user.id !== userId);
    
            return {
                ...userDirectRoom,
                clientUser,
                receivingUser,
            };
        });
    }

    async getOtherUserId(roomId: number, userId: number): Promise<number | null> {
        // Find the direct room with its users
        const room = await this.prisma.directRoom.findUnique({
          where: { id: roomId },
          include: { users: { select: { userId: true } } },
        });
      
        if (!room) {
          throw new Error('Room not found');
        }
      
        // The other user is the one whose id is not the current user's id
        const otherUser = room.users.find(userOnRoom => userOnRoom.userId !== userId);
      
        // Return the other user's id, or null if not found
        return otherUser ? otherUser.userId : null;
      }
      
    
}

