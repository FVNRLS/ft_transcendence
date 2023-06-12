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
import { RoomDetailsDto } from './entities/room.entity';

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
    const id = await this.chatUserService.getUserIdByUsername(username);
    return { userId: id };
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('getUsersIdsByUsernames')
  async getUsersIdsByUsernames(
    @MessageBody('usernames') usernames: string[],
  ) {
    return await this.chatUserService.getUsersIdsByUsernames(usernames);
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('createRoom')
  async create(
    @MessageBody() createRoomDto: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    
    const userId = client.data.userId;
    
    // Add the current user to the members array
    this.addCurrentUserToMembers(createRoomDto, userId);
  
    // Create room based on its type
    let newRoom = await this.createRoomBasedOnType(createRoomDto);

    if (!newRoom) {
      return "Error: DM already exists";
    }
  
    // Update the room data
    newRoom = this.updateRoomData(newRoom);
  
    // Notify connected users about the newly created room
    this.notifyConnectedUsers(newRoom);
    
    return newRoom;
  }
  
  addCurrentUserToMembers(createRoomDto: CreateRoomDto, userId: number) {
    const newMember: MemberDto = { id: userId };
    
    if (createRoomDto.members) {
      createRoomDto.members.push(newMember);
    } else {
      createRoomDto.members = [newMember];
    }
    
    if (createRoomDto.roomType == RoomType.DIRECT) {
      createRoomDto.members[1] = newMember;
      if (createRoomDto.members.length > 2) {
        createRoomDto.members.splice(2);
      }
    }
  }
  
  async createRoomBasedOnType(createRoomDto: CreateRoomDto) {
    return createRoomDto.roomType == RoomType.DIRECT
      ? await this.roomsService.createDirectRoom(createRoomDto)
      : await this.roomsService.createGroupRoom(createRoomDto);
  }
  
  updateRoomData(newRoom: any) {
    return {
      ...newRoom,
      users: newRoom.userOnRooms.map(ur => ur.user),
      messages: newRoom.messages,
    };
  }

  notifyConnectedUsers(newRoom: RoomDetailsDto) {
    if(newRoom.userOnRooms) {
      const userIds = newRoom.userOnRooms.map(userOnRoom => userOnRoom.user.id);
      userIds.forEach(userId => {
        const socketId = ChatAuthGateway.userToSocketIdMap[userId];
        if (socketId && this.server.sockets.sockets.get(socketId)) {
          const roomName = `room-${newRoom.id}`;
          this.server.sockets.sockets.get(socketId).join(roomName);
          this.server.to(socketId).emit('joinedRoom', newRoom);
        }
      });
    }
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
    @MessageBody() payload: {roomId: number, password: string}, 
    @ConnectedSocket() client: Socket,
    ) {
    try {
      return await this.roomsService.joinRoom(payload.roomId, client, payload.password);
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

    const userRooms = await this.roomsService.getUserRooms(userId);

    client.emit('getUserRooms', userRooms);

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

  @UseGuards(WsJwtAuthGuard, WsIsUserRoomCreatorGuard)
  @SubscribeMessage('updateRoomPassword')
  async handleUpdateRoomPassword(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: number, newPassword: string }) {
    try {
      console.log("Hello");
      console.log(payload);
      const updatedRoom = await this.roomsService.updateRoomPassword(payload.roomId, payload.newPassword);
      client.emit('roomPasswordUpdated', { roomId: payload.roomId });
      return { success: true, message: 'Room password has been updated.' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @UseGuards(WsJwtAuthGuard, WsIsUserRoomCreatorGuard)
  @SubscribeMessage('removeRoomPassword')
  async handleRemoveRoomPassword(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: number }) {
    try {
      const updatedRoom = await this.roomsService.removeRoomPassword(payload.roomId);
      client.emit('roomPasswordRemoved', { roomId: payload.roomId });
      return { success: true, message: 'Room password has been removed.' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
