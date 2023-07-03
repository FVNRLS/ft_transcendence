import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-room-message.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Socket } from 'socket.io';
import { Prisma } from '@prisma/client';
import { DirectRoomsService } from './direct-rooms.service';
import { BlockService } from './block.service';



@Injectable()
export class DirectMessagesService {
  private readonly userSelection: Prisma.UserSelect = {
    id: true,
    username: true,
  };



  constructor(
    private readonly prisma: PrismaService,
    private readonly directRoomsService: DirectRoomsService,
    private blockService: BlockService,
    ) {}

  async create(createMessageDto: CreateMessageDto, client: Socket) {

    // Get the id of the other user in the direct room
    const otherUserId = await this.directRoomsService.getOtherUserId(createMessageDto.roomId, client.data.userId);

    // Check if the client user is blocked by the other user
    const isBlocked = await this.blockService.isBlocked(otherUserId, client.data.userId);
  
    if (isBlocked) {
      // Throw an exception or return an error. Here, I'm using a generic Error for simplicity
      throw new Error('Cannot send message. You are blocked by the other user.');
    }
  
    const directMessage = await this.prisma.directMessage.create({
      data: {
        userId: client.data.userId,
        directRoomId: createMessageDto.roomId,
        content: createMessageDto.content,
      },
    });
  
    const newMessage = await this.prisma.directMessage.findUnique({
      where: {
        id: directMessage.id,
      },
      select: {
        id: true,
        directRoomId: true,
        user: { select: { 
          id: true,
          username: true,
        }},
        createdAt: true,
        content: true,
      }
    });
  
    return newMessage;
  }
  
  
  async findAll() {
    return await this.prisma.directMessage.findMany();
  }

  async findOne(id: number) {
    return await this.prisma.directMessage.findUnique({ where: { id } });
  }

  async update(id: number, updateMessageDto: UpdateMessageDto) {
    return await this.prisma.directMessage.update({
      where: { id },
      data: updateMessageDto,
    });
  }

  async remove(id: number) {
    return await this.prisma.directMessage.delete({ where: { id } });
  }

  async getRoomMessages(directRoomId: number, limit: number = 100, offset: number = 0) {
    return await this.prisma.directMessage.findMany({
      where: { directRoomId },
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: limit,
    });
  }
}

