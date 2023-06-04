import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WsException, WebSocketServer } from '@nestjs/websockets';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, MemberDto, RoomType } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WsJwtAuthGuard } from '../guards/ws-jwt-auth-guard/ws-jwt-auth-guard.guard';
import { WsIsUserRoomCreatorGuard } from '../guards/ws-is-user-room-creator/ws-is-user-room-creator.guard';
import { SetUserRoleDto } from './dto/set-user-role.dto';
import { HasRoomPermission } from '../decorators/has-room-permission.decorator';
import { Prisma, UserRole } from '@prisma/client';
import { SecurityService } from 'src/security/security.service';
import { ChatUserService } from './chat_user.service';
import { ChatAuthGateway } from '../auth/chat_auth.gateway';

@WebSocketGateway(+process.env.CHAT_PORT, { 
  cors: {
      origin: "http://localhost:3000", // Replace with the origin you want to allow
      methods: ["GET", "POST"],
      credentials: true
  } 
})
export class RoomsGateway {
  @WebSocketServer() server: any;
  constructor(
    private readonly roomsService: RoomsService,
    private readonly prisma: PrismaService,
    private readonly securityService: SecurityService,
    private readonly chatUserService: ChatUserService
    ) {}


  @SubscribeMessage('getCurrentUser')
  async getCurrentUser(@ConnectedSocket() client: Socket) {
    // emit user data to client
    const user = await this.chatUserService.getCurrentUser(client);
    client.emit('currentUser', user);
    return user;
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('getUserIdByUsername')
  async getUserIdByUsername(
    @MessageBody('username') username: string,
  ) {
    console.log("GetUserIdByName");
    const id = await this.chatUserService.getUserIdByUsername(username);
    return { userId: id };
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('getUsersIdsByUsernames')
  async getUsersIdsByUsernames(
    @MessageBody('usernames') usernames: string[],
  ) {
    // const ids = await Promise.all(usernames.map(async (username: string) => {
    //   const user = await this.prisma.user.findUnique({
    //     where: { username: username },
    //     select: { id: true }
    //   });
    //   return user ? user.id : null;
    // }));
    // return { userIds: ids };
    return await this.chatUserService.getUsersIdsByUsernames(usernames);

  }
  
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('createRoom')
  async create(
    @MessageBody() createRoomDto: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    let newRoom; // Define newRoom here
    const userId = client.data.userId;

    // Create a new member with the userId as id
    const newMember: MemberDto = {
      id: userId,
    };
  
    // Add the new member to the members array
    if (createRoomDto.members) {
      createRoomDto.members.push(newMember);
    } else {
      createRoomDto.members = [newMember];
    }
  
    if (createRoomDto.roomType == RoomType.DIRECT) {
      createRoomDto.members[1] = newMember;
      // Remove all elements except those at index 0 and 1
      if (createRoomDto.members.length > 2) {
        createRoomDto.members.splice(2);
      }
      newRoom = await this.roomsService.createDirectRoom(createRoomDto);
    } else {
      newRoom = await this.roomsService.createGroupRoom(createRoomDto);
      
      // // Room creator automatically joins the room
      // await this.roomsService.joinRoom(newRoom.id, client);

      // // Set the room creator's role to 'owner'
      // await this.roomsService.setUserRole(userId, newRoom.id, UserRole.OWNER); 

      // If members are specified in the DTO, add them to the room
    }

   newRoom = {
      ...newRoom,
      users: newRoom.userOnRooms.map(ur => ur.user),
      messages: newRoom.messages,
    };

    if(createRoomDto.members) {
      const userIds = createRoomDto.members.map(member => member.id);
  
      // If users are currently connected, join them to the room in the Socket.IO server
      userIds.forEach(userId => {
        const socketId = ChatAuthGateway.userToSocketIdMap[userId];
        if (socketId && this.server.sockets.sockets.get(socketId)) {
          // this.server.sockets.sockets[socketId].join(`room-${newRoom.id}`);
          const roomName = `room-${newRoom.id}`;
          this.server.sockets.sockets.get(socketId).join(roomName);
          this.server.to(socketId).emit('joinedRoom', newRoom);
        }
      });
    }
    console.log("New Room");
    console.log(newRoom);
    return newRoom;
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('findOneRoom')
  findOne(@MessageBody('roomId') roomId: number) {
    return this.roomsService.findOne(roomId);
  }
  
  @UseGuards(WsJwtAuthGuard, WsIsUserRoomCreatorGuard)
  @SubscribeMessage('updateRoom')
  update(
    @MessageBody() updateRoomDto: UpdateRoomDto,
    @ConnectedSocket() client: Socket,
    ) {
      return this.roomsService.update(updateRoomDto.roomId, updateRoomDto, client);
    }
    
  @UseGuards(WsJwtAuthGuard, WsIsUserRoomCreatorGuard)
  @SubscribeMessage('removeRoom')
  remove(
    @MessageBody('roomId') roomId: number,
    @ConnectedSocket() client: Socket
    ) {
      return this.roomsService.remove(roomId, client);
    }
      
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('findAllRooms')
  findAll() {
    return this.roomsService.findAll();
  }


  // User-Room Interactions
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('joinRoom')
  async joinRoom(
    @MessageBody('roomId') roomId: number, 
    @ConnectedSocket() client: Socket,
    ) {
    try {
      return await this.roomsService.joinRoom(roomId, client);
    } catch (error) {
      console.log('Error:', error.message);
      return {error: error.message};
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('leaveRoom')
  async leaveRoom(
    @MessageBody('roomId') roomId: number, 
    @ConnectedSocket() client: Socket,
  ) {
    try {
      return await this.roomsService.leaveRoom(roomId, client);
    } catch (error) {
      console.log('Error:', error.message);
      return {error: error.message};
    }
  }

  @SubscribeMessage('getUserRooms')
  async getUserRooms(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId; // Get the userId from the client
  
    const userRooms = await this.prisma.userOnRooms.findMany({
      where: { userId: userId },
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
                    // Include other fields as required
                  }
                }
              }
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
            },
            // Include other room data as required
          }
        },
      },
    });
  
    client.emit('getUserRooms', userRooms.map(userRoom => ({
      ...userRoom.room,
      users: userRoom.room.userOnRooms.map(ur => ur.user),
      messages: userRoom.room.messages,
    })));
  
    return "Success";
  }
  
  @HasRoomPermission('OWNER')
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('setUserRole')
  async setUserRole(
    @MessageBody() setUserRoleDto: SetUserRoleDto,
    // @ConnectedSocket() client: Socket,
  ) {
    try {
      return await this.roomsService.setUserRole(setUserRoleDto.userId, setUserRoleDto.roomId, setUserRoleDto.role);
    } catch (error) {
      console.log('Error:', error.message);
      return {error: error.message};
    }
  }
}
