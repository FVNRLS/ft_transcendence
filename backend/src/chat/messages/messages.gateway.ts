import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from 'src/ws-jwt-auth-guard/ws-jwt-auth-guard.guard';
import { Socket } from 'socket.io';
import { GetRoomMessagesDto } from './dto/get-room-messages.dto';
import { WsRoomGuard } from 'src/ws-room/ws-room.guard';
import { WsEditMessageGuard } from 'src/ws-edit-message/ws-edit-message.guard';
import { WsViewMessageGuard } from 'src/ws-view-message/ws-view-message.guard';
import { WsPermissionGuard } from 'src/ws-permission/ws-permission.guard';


@WebSocketGateway(+process.env.CHAT_PORT, { cors: "*" })
export class MessagesGateway {
  @WebSocketServer() server: any;
  constructor(
    private readonly messagesService: MessagesService
    ) {}

  @UseGuards(WsJwtAuthGuard, WsRoomGuard)
  @SubscribeMessage('createMessage')
  async create(
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

  @UseGuards(WsJwtAuthGuard, WsViewMessageGuard)
  @SubscribeMessage('findOneMessage')
  findOne(@MessageBody() id: number) {
    return this.messagesService.findOne(id);
  }


  @UseGuards(WsJwtAuthGuard, WsEditMessageGuard)
  @SubscribeMessage('updateMessage')
  update(@MessageBody() updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(updateMessageDto.id, updateMessageDto);
  }

  @UseGuards(WsJwtAuthGuard, WsEditMessageGuard)
  @SubscribeMessage('removeMessage')
  remove(@MessageBody() id: number) {
    return this.messagesService.remove(id);
  }

  @UseGuards(WsJwtAuthGuard, WsRoomGuard)
  @SubscribeMessage('getRoomMessages')
  getRoomMessages(@MessageBody() { roomId, limit = 100, offset = 0 }: GetRoomMessagesDto) {
    return this.messagesService.getRoomMessages(roomId, limit, offset);
  }
  
  
}
