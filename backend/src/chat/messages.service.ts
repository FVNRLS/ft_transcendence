import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-room-message.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Socket } from 'socket.io';
import { Prisma } from '@prisma/client';



@Injectable()
export class MessagesService {
  private readonly userSelection: Prisma.UserSelect = {
    id: true,
    username: true,
  };

  private readonly messageSelection: Prisma.MessageSelect = {
    id: true,
    roomId: true,
    user: { select: this.userSelection },
    createdAt: true,
    content: true,
  };


  private readonly roomSelection: Prisma.RoomSelect = {
    id: true,
    roomName: true,
    roomType: true,
    userOnRooms: { select: { user: { select: this.userSelection } } },
    messages: {
      select: this.messageSelection,
      orderBy: {
        createdAt: 'asc',
      },
      take: 100,
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(createMessageDto: CreateMessageDto, client: Socket) {
    // Check if the user is muted in the room
    const isMuted = await this.prisma.mutedUser.findFirst({
      where: {
        userId: client.data.userId,
        roomId: createMessageDto.roomId,
      },
    });
  
    // If the user is muted, return a message indicating they can't send a message
    if (isMuted) {
      throw new BadRequestException('You are muted in this room and cannot send messages.');
    }
  
    const message = await this.prisma.message.create({
      data: {
        userId: client.data.userId,
        roomId: createMessageDto.roomId,
        content: createMessageDto.content,
      },
    });
  
    const newMessage = await this.prisma.message.findUnique({
      where: {
        id: message.id,
      },
      select: this.messageSelection
    });
  
    return newMessage;
  }
  
  
  async findAll() {
    return await this.prisma.message.findMany();
  }

  async findOne(id: number) {
    return await this.prisma.message.findUnique({ where: { id } });
  }

  async update(id: number, updateMessageDto: UpdateMessageDto) {
    return await this.prisma.message.update({
      where: { id },
      data: updateMessageDto,
    });
  }

  async remove(id: number) {
    return await this.prisma.message.delete({ where: { id } });
  }

  async getRoomMessages(roomId: number, limit: number = 100, offset: number = 0) {
    return await this.prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: limit,
    });
  }
}