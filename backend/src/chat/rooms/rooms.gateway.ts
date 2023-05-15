import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WsException } from '@nestjs/websockets';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from 'src/ws-jwt-auth-guard/ws-jwt-auth-guard.guard';
import { PrismaService } from 'src/prisma/prisma.service';

@WebSocketGateway(+process.env.CHAT_PORT, { cors: "*" })
export class RoomsGateway {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly prisma: PrismaService
    ) {}

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('rejoinRooms')
  async handleConnection(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    const userRooms = await this.prisma.userOnRooms.findMany({
      where: { userId },
    });
  
    userRooms.forEach((userRoom) => {
      client.join(`room-${userRoom.roomId}`);
    });
  
    return { message: 'Reconnected and rooms rejoined' };
  }


  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('createRoom')
  create(
    @MessageBody() createRoomDto: CreateRoomDto,
    @ConnectedSocket() client: Socket,
    ) {
    return this.roomsService.create(createRoomDto, client);
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('findAllRooms')
  findAll() {
    return this.roomsService.findAll();
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('findOneRoom')
  findOne(@MessageBody() id: number) {
    return this.roomsService.findOne(id);
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('updateRoom')
  update(
    @MessageBody() updateRoomDto: UpdateRoomDto,
    @ConnectedSocket() client: Socket,
    ) {
    return this.roomsService.update(updateRoomDto.id, updateRoomDto, client);
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('removeRoom')
  remove(
    @MessageBody('id') id: number,
    @ConnectedSocket() client: Socket
    ) {
    return this.roomsService.remove(id, client);
  }

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
    @MessageBody() roomId: number, 
    @ConnectedSocket() client: Socket,
  ) {
    try {
      return await this.roomsService.leaveRoom(roomId, client);
    } catch (error) {
      console.log('Error:', error.message);
      return {error: error.message};
    }
  }
  
}
