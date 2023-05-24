import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { MessagesService } from './room-messages.service';
import { CreateMessageDto } from './dto/create-room-message.dto';
import { UpdateMessageDto } from './dto/update-room-message.dto';
import { UseGuards } from '@nestjs/common';
import { Socket } from 'socket.io';
import { GetRoomMessagesDto } from './dto/get-room-messages.dto';
import { WsIsUserAuthorOfMessageGuard } from 'src/chat/guards/ws-is-user-author-of-message/ws-is-user-author-of-message.guard';
import { WsJwtAuthGuard } from '../guards/ws-jwt-auth-guard/ws-jwt-auth-guard.guard';
import { WsIsUserInRoomGuard } from '../guards/ws-is-user-in-room/ws-is-user-in-room.guard';
import { WsPermissionGuard } from '../guards/ws-permission/ws-permission.guard';
import { WsIsUserMemberOfRoomForMessageGuard } from '../guards/ws-is-user-member-of-room-for-message/ws-is-user-member-of-room-for-message.guard';
import { RoomsService } from '../rooms/rooms.service';
import { SendDirectMessageDto } from './dto/send-direct-message.dto';
import { AuthGateway } from '../auth/auth.gateway';


@WebSocketGateway(+process.env.CHAT_PORT, { cors: "*" })
export class MessagesGateway {
  @WebSocketServer() server: any;
  constructor(
    private readonly messagesService: MessagesService,
    private readonly roomsService: RoomsService
    ) {}

  @UseGuards(WsJwtAuthGuard, WsIsUserInRoomGuard)
  @SubscribeMessage('sendMessageToRoom')
  async sendMessageToRoom(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket
    ) {
      const newMessage = await this.messagesService.create(createMessageDto, client);
      this.server.to(`room-${createMessageDto.roomId}`).emit('newMessage', newMessage); // broadcast the new message to all clients in the room
      // this.server.emit('newMessage', newMessage);
      return newMessage;
  }


  // @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('sendDirectMessage')
  async sendDirectMessage(
    @MessageBody() sendDirectMessageDto: SendDirectMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const senderId = client.data.userId; // sender
      const receiverId = sendDirectMessageDto.receiverId; // receiver
  
      // Check if the sender has been blocked by the receiver or vice versa
      const receiverBlockedSender = await this.messagesService.isBlocked(receiverId, senderId);
      const senderBlockedReceiver = await this.messagesService.isBlocked(senderId, receiverId);
  
      if (receiverBlockedSender) {
        return { message: 'You have been blocked by the receiver.' };
      }
  
      if (senderBlockedReceiver) {
        return { message: 'You have blocked this user.' };
      }
  
      // Create a direct room or use the existing one
      const room = await this.roomsService.createDirectRoom(senderId, receiverId);

      // Make the client join the room
      client.join(`room-${room.id}`);

      // Make the receiver join the room
      const receiverClientId = AuthGateway.userToSocketIdMap[receiverId];
      if (receiverClientId) {
        this.server.sockets.sockets.get(receiverClientId)?.join(`room-${room.id}`);
      }
  
      // Create a new message in the direct room
      const newMessageDto: CreateMessageDto = {
        roomId: room.id,
        content: sendDirectMessageDto.content,
        // sender information should be associated with message in your messagesService.create() method
      };
  
      const newMessage = await this.messagesService.create(newMessageDto, client);
  
      console.log(`room-${room.id}`);
      console.log(newMessage);

      // Broadcast the new message to all clients in the room
      this.server.to(`room-${room.id}`).emit('newMessage', newMessage);
  
      return newMessage;
    } catch (error) {
      console.log('Error:', error.message);
      return { error: error.message };
    }
  }
  
  
  

  @UseGuards(WsJwtAuthGuard, WsPermissionGuard)
  @SubscribeMessage('findAllMessages')
  findAll() {
    return this.messagesService.findAll();
  }

  @UseGuards(WsJwtAuthGuard, WsIsUserMemberOfRoomForMessageGuard)
  @SubscribeMessage('findOneMessage')
  findOne(@MessageBody() id: number) {
    return this.messagesService.findOne(id);
  }


  @UseGuards(WsJwtAuthGuard, WsIsUserAuthorOfMessageGuard)
  @SubscribeMessage('updateMessage')
  update(@MessageBody() updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(updateMessageDto.id, updateMessageDto);
  }

  @UseGuards(WsJwtAuthGuard, WsIsUserAuthorOfMessageGuard)
  @SubscribeMessage('removeMessage')
  remove(@MessageBody() id: number) {
    return this.messagesService.remove(id);
  }

  @UseGuards(WsJwtAuthGuard, WsIsUserInRoomGuard)
  @SubscribeMessage('getRoomMessages')
  getRoomMessages(@MessageBody() { roomId, limit = 100, offset = 0 }: GetRoomMessagesDto) {
    return this.messagesService.getRoomMessages(roomId, limit, offset);
  }

  @SubscribeMessage('blockUser')
  async blockUser(@ConnectedSocket() client: Socket, @MessageBody() blockDto: { blockedId: number }) {
    try {
      const blockerId = client.data.userId; // Assuming the blocker's id is stored in the socket data
      
      const result = await this.messagesService.blockUser(blockerId, blockDto.blockedId);

      return result;
    } catch (error) {
      console.log('Error:', error.message);
      return { error: error.message };
    }
  }

  @SubscribeMessage('unblockUser')
  async unblockUser(@ConnectedSocket() client: Socket, @MessageBody() blockDto: { blockedId: number }) {
    try {
      const blockerId = client.data.userId; // Assuming the blocker's id is stored in the socket data
      
      const result = await this.messagesService.unblockUser(blockerId, blockDto.blockedId);

      return result;
    } catch (error) {
      console.log('Error:', error.message);
      return { error: error.message };
    }
  }
}
