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
import { KickDto, BanDto, MuteDto, UnbanDto, UnmuteDto } from './dto/room-action.dto'; // You will need to create these DTOs
import { WsHasRoomPermissionGuard } from '../guards/ws-has-room-permission/ws-has-room-permission.guard';

const app_ip = process.env.REACT_APP_IP;

@WebSocketGateway(+process.env.CHAT_PORT, { 
  cors: {
      origin: `http://${app_ip}:3000`, // Replace with the origin you want to allow
      methods: ["GET", "POST"],
      credentials: true
  } 
})
@UseGuards(WsHasRoomPermissionGuard)
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
    let newRoom = await this.createRoomBasedOnType(createRoomDto, userId);

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
  
  async createRoomBasedOnType(createRoomDto: CreateRoomDto, userId: number) {
    return createRoomDto.roomType == RoomType.DIRECT
      ? await this.roomsService.createDirectRoom(createRoomDto, userId)
      : await this.roomsService.createGroupRoom(createRoomDto, userId);
    // return await this.roomsService.createDirectRoom(createRoomDto, userId);
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
          console.log("JOINED ROOM");
          console.log(newRoom);
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

    console.log("USER ROOMS");
    console.log(userRooms);

    return "Success";
  }
  
  @HasRoomPermission('ADMIN')
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
      client.emit('roomUpdated', { id: updatedRoom.id, roomType: updatedRoom.roomType });
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
      client.emit('roomUpdated', { id: updatedRoom.id, roomType: updatedRoom.roomType });
      return { success: true, message: 'Room password has been removed.' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }



  // Import required dependencies at the top
  // import { WsIsUserAdminGuard } from '../guards/ws-is-user-admin-guard/ws-is-user-admin-guard.guard';

  @UseGuards(WsJwtAuthGuard)
  @HasRoomPermission("ADMIN")
  @SubscribeMessage('kickUser')
  async kickUser(
    @MessageBody() kickDto: KickDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      console.log("User Kicked");
      await this.roomsService.kickUser(kickDto.userId, kickDto.roomId, client);
  
      // Emit the 'kickUser' event to everyone in the room
      client.to(`room-${kickDto.roomId}`).emit('kickUser', { userId: kickDto.userId, roomId: kickDto.roomId });
  
      return { success: true, message: 'User kicked successfully' };
    } catch (error) {
      console.log('Error:', error.message);
      return { success: false, error: error.message };
    }
  }
  

  @UseGuards(WsJwtAuthGuard)
  @HasRoomPermission("ADMIN")
  @SubscribeMessage('banUser')
  async banUser(
    @MessageBody() banDto: BanDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.roomsService.banUser(banDto.userId, banDto.roomId);
  
      // Emit the 'kickUser' event to everyone in the room
      client.to(`room-${banDto.roomId}`).emit('kickUser', { userId: banDto.userId, roomId: banDto.roomId });
  
      // Emit the 'banUser' event to everyone in the room
      client.to(`room-${banDto.roomId}`).emit('banUser', { userId: banDto.userId, roomId: banDto.roomId });
  
      return { success: true, message: 'User banned successfully' };
    } catch (error) {
      console.log('Error:', error.message);
      return { success: false, error: error.message };
    }
  }
  

@UseGuards(WsJwtAuthGuard)
@HasRoomPermission("ADMIN")
@SubscribeMessage('unbanUser')
async unbanUser(
  @MessageBody() unbanDto: UnbanDto,
  @ConnectedSocket() client: Socket,
) {
  try {
    await this.roomsService.unbanUser(unbanDto.userId, unbanDto.roomId);

    // Emit the 'unbanUser' event to everyone in the room
    client.to(`room-${unbanDto.roomId}`).emit('unbanUser', { userId: unbanDto.userId, roomId: unbanDto.roomId });

    return { success: true, message: 'User unbanned successfully' };
  } catch (error) {
    console.log('Error:', error.message);
    return { success: false, error: error.message };
  }
}

@UseGuards(WsJwtAuthGuard)
@HasRoomPermission("ADMIN")
@SubscribeMessage('muteUser')
async muteUser(
  @MessageBody() muteDto: MuteDto,
  @ConnectedSocket() client: Socket,
) {
  try {
    const muteExpiresAt = muteDto.muteExpiresAt ? new Date(muteDto.muteExpiresAt) : undefined;
    await this.roomsService.muteUser(muteDto.userId, muteDto.roomId, muteExpiresAt);

    // Emit the 'muteUser' event to everyone in the room
    client.to(`room-${muteDto.roomId}`).emit('muteUser', { userId: muteDto.userId, roomId: muteDto.roomId, muteExpiresAt });

    return { success: true, message: 'User muted successfully' };
  } catch (error) {
    console.log('Error:', error.message);
    return { success: false, error: error.message };
  }
}

@UseGuards(WsJwtAuthGuard)
@HasRoomPermission("ADMIN")
@SubscribeMessage('unmuteUser')
async unmuteUser(
  @MessageBody() unmuteDto: UnmuteDto,
  @ConnectedSocket() client: Socket,
) {
  try {
    await this.roomsService.unmuteUser(unmuteDto.userId, unmuteDto.roomId);

    // Emit the 'unmuteUser' event to everyone in the room
    client.to(`room-${unmuteDto.roomId}`).emit('unmuteUser', { userId: unmuteDto.userId, roomId: unmuteDto.roomId });

    return { success: true, message: 'User unmuted successfully' };
  } catch (error) {
    console.log('Error:', error.message);
    return { success: false, error: error.message };
  }
}
}
