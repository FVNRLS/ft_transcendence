import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WsException } from '@nestjs/websockets';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
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

let userToSocketIdMap: { [key: string]: string } = {};

@WebSocketGateway(+process.env.CHAT_PORT, { cors: "*" })
export class RoomsGateway {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly prisma: PrismaService,
    private readonly securityService: SecurityService
    ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const cookie = client.handshake.headers.cookie; // Adjust this line based on how cookie is sent in handshake
      const session = await this.securityService.verifyCookie(cookie);
      const userId = session.userId;
      client.data = { userId }; // Attach the userId to client data

      userToSocketIdMap[userId] = client.id; // Add entry to map
      
      // You may want to rejoin rooms here or whatever you want to do on a successful connection
      const userRooms = await this.prisma.userOnRooms.findMany({
        where: { userId: session.userId },
      });
    
      userRooms.forEach((userRoom) => {
        client.join(`room-${userRoom.roomId}`);
      });
    
      client.emit('connection_success', { message: 'Reconnected and rooms rejoined' });

    } catch (error) {
      console.log('Invalid credentials');
      client.disconnect(); // disconnect the client if authentication fails
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = Object.keys(userToSocketIdMap).find(key => userToSocketIdMap[key] === client.id);
    if (userId) {
      delete userToSocketIdMap[userId];
    }
  }
  

  // @UseGuards(WsJwtAuthGuard)
  // @SubscribeMessage('rejoinRooms')
  // async handleConnection(@ConnectedSocket() client: Socket) {
  //   const userId = client.data.userId;
  //   const userRooms = await this.prisma.userOnRooms.findMany({
  //     where: { userId },
  //   });
  
  //   userRooms.forEach((userRoom) => {
  //     client.join(`room-${userRoom.roomId}`);
  //   });
  
  //   return { message: 'Reconnected and rooms rejoined' };
  // }

  // Chat Room Management
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('createRoom')
  async create(
    @MessageBody() createRoomDto: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const newRoom = await this.roomsService.create(createRoomDto, client);

    // Get the userId from the client or wherever you store it
    const userId = client.data.userId;
  
    // Room creator automatically joins the room
    await this.roomsService.joinRoom(newRoom.id, client);

    // Set the room creator's role to 'owner'
    await this.roomsService.setUserRole(userId, newRoom.id, UserRole.OWNER); 
  
    return newRoom;
  }

  // @UseGuards(WsJwtAuthGuard)
  // @SubscribeMessage('createDirectRoom')
  // async createDirectRoom(
  //   @MessageBody() members: { user1Id: number, user2Id: number },
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   try {
  //     const newRoom = await this.roomsService.createDirectRoom(members.user1Id, members.user2Id);
  
  //     // Both users automatically join the room
  //     await this.roomsService.joinRoom(newRoom.id, client);
    
  //     return newRoom;
  //   } catch (error) {
  //     console.log('Error:', error.message);
  //     return {error: error.message};
  //   }
  // }
  

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

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('getUserRooms')
  async getUserRooms(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId; // Get the userId from the client

    const userRooms = await this.prisma.userOnRooms.findMany({
      where: { userId },
      include: { room: true }, // Include the room data
    });

    return userRooms.map(userRoom => userRoom.room); // Return the rooms
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('getRoomMembers')
  async getRoomMembers(@MessageBody('roomId') roomId: number) {
    const roomMembers = await this.roomsService.getRoomMembers(roomId);
    return roomMembers;
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
