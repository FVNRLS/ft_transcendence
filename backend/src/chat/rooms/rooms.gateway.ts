import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WsException } from '@nestjs/websockets';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, RoomType } from './dto/create-room.dto';
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

@WebSocketGateway(+process.env.CHAT_PORT, { 
  cors: {
      origin: "http://localhost:3000", // Replace with the origin you want to allow
      methods: ["GET", "POST"],
      credentials: true
  } 
})
export class RoomsGateway {
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
  @SubscribeMessage('createRoom')
  async create(
    @MessageBody() createRoomDto: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    let newRoom; // Define newRoom here
    const userId = client.data.userId;
  
    if (createRoomDto.roomType == RoomType.DIRECT) {
      newRoom = await this.roomsService.createDirectRoom(createRoomDto.members[0].id, client.data.userId);
    } else {
      newRoom = await this.roomsService.create(createRoomDto, client.data.userId);
      
      // Room creator automatically joins the room
      await this.roomsService.joinRoom(newRoom.id, client);
      
      // Set the room creator's role to 'owner'
      await this.roomsService.setUserRole(userId, newRoom.id, UserRole.OWNER); 
    }
  
    return newRoom;
  }
  

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('createDirectRoom')
  async createDirectRoom(
    @MessageBody() user1Id: number,
    @ConnectedSocket() client: Socket,
  ) {
    // Create the direct room with the client and user1Id
    const room = await this.roomsService.createDirectRoom(user1Id, client.data.userId);

    return room;
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

  // // @UseGuards(WsJwtAuthGuard)Roo
  // @SubscribeMessage('getUserRooms')
  // async getUserRooms(@ConnectedSocket() client: Socket) {
  //   const userId = client.data.userId; // Get the userId from the client

  //   const userRooms = await this.prisma.userOnRooms.findMany({
  //     where: { userId: userId },
  //     include: { room: true }, // Include the room data
  //   });
  //   client.emit('getUserRooms', userRooms.map(userRoom => userRoom.room));
  //   return "Sucess";
  // }

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
          // Include other room data as required
        }
      },
    },
  });

  client.emit('getUserRooms', userRooms.map(userRoom => ({
    ...userRoom.room,
    users: userRoom.room.userOnRooms.map(ur => ur.user),
  })));

  return "Success";
}


  // // @UseGuards(WsJwtAuthGuard)
  // @SubscribeMessage('getRoomMembers')
  // async getRoomMembers(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody('roomId') roomId: number,
  //   @MessageBody('excludeClient') excludeClient: boolean = false
  // ) {
  //   // Assuming the client id is stored in client.data.userId
  //   const clientId = client.data.userId;
  //   const roomMembers = await this.roomsService.getRoomMembers(roomId, clientId, excludeClient);
  //   return roomMembers;
  // }



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
