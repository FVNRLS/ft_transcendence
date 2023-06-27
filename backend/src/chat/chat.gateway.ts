import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WsException, WebSocketServer } from '@nestjs/websockets';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, MemberDto, RoomType } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth-guard/ws-jwt-auth-guard.guard';
import { WsIsUserRoomCreatorGuard } from './guards/ws-is-user-room-creator/ws-is-user-room-creator.guard';
import { SetUserRoleDto } from './dto/set-user-role.dto';
import { HasRoomPermission } from './decorators/has-room-permission.decorator';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { ChatUserService } from './chat_user.service';
import { RoomDetailsDto } from './entities/room.entity';
import { KickDto, BanDto, MuteDto, UnbanDto, UnmuteDto } from './dto/room-action.dto'; // You will need to create these DTOs
import { WsHasRoomPermissionGuard } from './guards/ws-has-room-permission/ws-has-room-permission.guard';
import { SecurityService } from 'src/security/security.service';
import { MessagesService } from './messages.service';
import { WsIsUserInRoomGuard } from './guards/ws-is-user-in-room/ws-is-user-in-room.guard';
import { CreateMessageDto } from './dto/create-room-message.dto';
import { WsPermissionGuard } from './guards/ws-permission/ws-permission.guard';
import { WsIsUserMemberOfRoomForMessageGuard } from './guards/ws-is-user-member-of-room-for-message/ws-is-user-member-of-room-for-message.guard';
import { WsIsUserAuthorOfMessageGuard } from './guards/ws-is-user-author-of-message/ws-is-user-author-of-message.guard';
import { UpdateMessageDto } from './dto/update-room-message.dto';
import { GetRoomMessagesDto } from './dto/get-room-messages.dto';

const app_ip = process.env.REACT_APP_IP;

@WebSocketGateway(+process.env.CHAT_PORT, { 
  cors: {
      origin: `http://${app_ip}:3000`, // Replace with the origin you want to allow
      methods: ["GET", "POST"],
      credentials: true
  } 
})
@UseGuards(WsHasRoomPermissionGuard)
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  static userToSocketIdMap: { [key: string]: string } = {};

  @WebSocketServer() server: any;
  constructor(
    private readonly messagesService: MessagesService,
    private readonly roomsService: RoomsService,
    private readonly prisma: PrismaService,
    private readonly securityService: SecurityService,
    private readonly chatUserService: ChatUserService
    ) {}

    async handleConnection(@ConnectedSocket() client: Socket) {
      try {
        const cookie = client.handshake.headers.cookie;
        if (!cookie) {
          throw new Error('Cookie not provided');
        }
  
        const allCookies = cookie.split('; ');
        const sessionCookieWithLabel = allCookies.find(cookie => cookie.startsWith('session='));
        const sessionCookie = sessionCookieWithLabel ? sessionCookieWithLabel.replace('session=', '') : allCookies[0];
  
        const session = await this.securityService.verifyCookie(sessionCookie);
        
        const userId = session.userId;
        client.data = { userId };
        RoomsGateway.userToSocketIdMap[userId] = client.id;
  
        const userRooms = await this.prisma.userOnRooms.findMany({
          where: { userId: session.userId },
        });
  
        userRooms.forEach((userRoom) => {
          client.join(`room-${userRoom.roomId}`);
        });
  
        client.emit('connection_success', { message: 'Reconnected and rooms rejoined' });
        client.emit('user_verified', { message: 'User has been verified' });

        
        // Call those methods after successful verification
        await this.delay2(100); // Delay of 1 second
        await this.getCurrentUser(client);
        await this.delay2(120); // Delay of 1 second
        await this.getUserRooms(client);
        await this.delay2(130); // Delay of 1 second
        await this.getBlockedUsers(client);
  
      } catch (error) {
        console.error('Error during client connection:', error.message);
        client.disconnect();
      }
    }
  
    async handleDisconnect(@ConnectedSocket() client: Socket) {
      try {
        const userId = Object.keys(RoomsGateway.userToSocketIdMap).find(key => RoomsGateway.userToSocketIdMap[key] === client.id);
        if (userId) {
          delete RoomsGateway.userToSocketIdMap[userId];
        }
      } catch (error) {
        console.error('Error during client disconnection:', error.message);
      }
    }

  async delay2(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

    


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
        const socketId = RoomsGateway.userToSocketIdMap[userId];
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


  //Mute, Ban, Kick

  @UseGuards(WsJwtAuthGuard)
  @HasRoomPermission("ADMIN")
  @SubscribeMessage('kickUser')
  async kickUser(
    @MessageBody() kickDto: KickDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.roomsService.kickUser(kickDto.userId, kickDto.roomId, client);
  
      // Emit the 'kickUser' event to everyone in the room
      this.server.to(`room-${kickDto.roomId}`).emit('kickUser', { userId: kickDto.userId, roomId: kickDto.roomId });
  
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
      const bannedUser = await this.roomsService.banUser(banDto.userId, banDto.roomId);
  
      // Emit the 'kickUser' event to everyone in the room
      this.server.to(`room-${banDto.roomId}`).emit('kickUser', { userId: banDto.userId, roomId: banDto.roomId });
  
      // Emit the 'banUser' event to everyone in the room
      this.server.to(`room-${banDto.roomId}`).emit('banUser', { userId: banDto.userId, roomId: banDto.roomId, bannedAt: bannedUser.bannedAt});
  
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
      this.server.to(`room-${unbanDto.roomId}`).emit('unbanUser', { userId: unbanDto.userId, roomId: unbanDto.roomId });
  
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
      this.server.to(`room-${muteDto.roomId}`).emit('muteUser', { userId: muteDto.userId, roomId: muteDto.roomId, muteExpiresAt });
  
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
      this.server.to(`room-${unmuteDto.roomId}`).emit('unmuteUser', { userId: unmuteDto.userId, roomId: unmuteDto.roomId });
  
      return { success: true, message: 'User unmuted successfully' };
    } catch (error) {
      console.log('Error:', error.message);
      return { success: false, error: error.message };
    }
  }

//Block/Unblock

@SubscribeMessage('blockUser')
async blockUser(@ConnectedSocket() client: Socket, @MessageBody() blockDto: { blockedId: number }) {
  try {
    const blockerId = client.data.userId; // Assuming the blocker's id is stored in the socket data
    
    const result = await this.messagesService.blockUser(blockerId, blockDto.blockedId);

    return { success: result.success, message: result.message };
  } catch (error) {
    console.log('Error:', error.message);
    return { success: false, error: error.message };
  }
}

@SubscribeMessage('unblockUser')
async unblockUser(@ConnectedSocket() client: Socket, @MessageBody() blockDto: { blockedId: number }) {
  try {
    const blockerId = client.data.userId; // Assuming the blocker's id is stored in the socket data
    
    const result = await this.messagesService.unblockUser(blockerId, blockDto.blockedId);

    return { success: result.success, message: result.message };
  } catch (error) {
    console.log('Error:', error.message);
    return { success: false, error: error.message };
  }
}

// @UseGuards(WsJwtAuthGuard)
@SubscribeMessage('getBlockedUsers')
async getBlockedUsers(@ConnectedSocket() client: Socket) {
  const userId = client.data.userId;
  const blockedUserIds = await this.messagesService.getBlockedUsers(userId);

  client.emit('getBlockedUsers', blockedUserIds);
}

//Messaging

@UseGuards(WsJwtAuthGuard, WsIsUserInRoomGuard)
@SubscribeMessage('sendMessageToRoom')
async sendMessageToRoom(
  @MessageBody() createMessageDto: CreateMessageDto,
  @ConnectedSocket() client: Socket
) {
  try {
    const newMessage = await this.messagesService.create(createMessageDto, client);
  
    // Get the list of users who have blocked the author
    const blockedUsers = await this.prisma.block.findMany({
      where: { blockedId: client.data.userId },
    });
  
    // Get the list of user ids from the block relation
    const blockedUserIds = blockedUsers.map(block => block.blockerId);
  
    // Get the list of users in the room who haven't blocked the author
    const recipients = await this.prisma.userOnRooms.findMany({
      where: { 
        roomId: createMessageDto.roomId,
        NOT: { userId: { in: blockedUserIds } },
      },
    });
  
    // Emit the new message to each recipient
    for (const recipient of recipients) {
      const recipientSocketId = RoomsGateway.userToSocketIdMap[recipient.userId];
      if (recipientSocketId && this.server.sockets.sockets.get(recipientSocketId)) {
        this.server.to(recipientSocketId).emit('newMessage', newMessage);
      }
    }
  
    return newMessage;
  } catch (error) {
    console.log('Error:', error.message);
    return {error: error.message};
  }
}
  @UseGuards(WsJwtAuthGuard, WsPermissionGuard)
  @SubscribeMessage('findAllMessages')
  findAllMessages() {
    return this.messagesService.findAll();
  }

  @UseGuards(WsJwtAuthGuard, WsIsUserMemberOfRoomForMessageGuard)
  @SubscribeMessage('findOneMessage')
  findOneMessage(@MessageBody() id: number) {
    return this.messagesService.findOne(id);
  }


  @UseGuards(WsJwtAuthGuard, WsIsUserAuthorOfMessageGuard)
  @SubscribeMessage('updateMessage')
  updateMessage(@MessageBody() updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(updateMessageDto.id, updateMessageDto);
  }

  @UseGuards(WsJwtAuthGuard, WsIsUserAuthorOfMessageGuard)
  @SubscribeMessage('removeMessage')
  removeMessage(@MessageBody() id: number) {
    return this.messagesService.remove(id);
  }


  @UseGuards(WsJwtAuthGuard, WsIsUserInRoomGuard)
  @SubscribeMessage('getRoomMessages')
  getRoomMessages(@MessageBody() { roomId, limit = 100, offset = 0 }: GetRoomMessagesDto) {
    return this.messagesService.getRoomMessages(roomId, limit, offset);
  }

}