import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { DirectMessagesService } from './direct-messages.service';
import { CreateDirectMessageDto } from './dto/create-direct-message.dto';
import { UpdateDirectMessageDto } from './dto/update-direct-message.dto';
import { Socket } from 'socket.io';
import { WsJwtAuthGuard } from '../guards/ws-jwt-auth-guard/ws-jwt-auth-guard.guard';
import { UseGuards } from '@nestjs/common';


@WebSocketGateway()
export class DirectMessagesGateway {
  @WebSocketServer() server: any;
  constructor(private readonly directMessagesService: DirectMessagesService) {}

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('sendMessageToUser')
  async create(@MessageBody() createDirectMessageDto: CreateDirectMessageDto, @ConnectedSocket() client: Socket) {
    const newDirectMessage = await this.directMessagesService.create(client.data.userId, createDirectMessageDto);
    this.server.to(createDirectMessageDto.receiverId).emit('newDirectMessage', newDirectMessage);
    return newDirectMessage;
  }
  
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('getUserMessages')
  findAll(@MessageBody() { receiverId }, client: Socket) {
    return this.directMessagesService.getUserMessages(client.data.userId, receiverId);
  }
  
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('removeDirectMessage')
  remove(@MessageBody() id: number, client: Socket) {
    return this.directMessagesService.remove(id, client.data.userId);
  }
  

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('findOneDirectMessage')
  findOne(@MessageBody() id: number) {
    return this.directMessagesService.findOne(id);
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('updateDirectMessage')
  update(@MessageBody() updateDirectMessageDto: UpdateDirectMessageDto) {
    return this.directMessagesService.update(updateDirectMessageDto.id, updateDirectMessageDto);
  }

}
