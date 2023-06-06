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
import { ChatAuthGateway } from '../auth/chat_auth.gateway';


@WebSocketGateway(+process.env.CHAT_PORT, { 
  cors: {
      origin: "http://localhost:3000", // Replace with the origin you want to allow
      methods: ["GET", "POST"],
      credentials: true
  } 
})
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
