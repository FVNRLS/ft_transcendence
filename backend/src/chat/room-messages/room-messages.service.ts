import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-room-message.dto';
import { UpdateMessageDto } from './dto/update-room-message.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Socket } from 'socket.io';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMessageDto: CreateMessageDto, client: Socket) {
    return await this.prisma.message.create({
      data: {
        userId: client.data.userId,
        roomId: createMessageDto.roomId,
        content: createMessageDto.content,
      },
    });
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
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
  }
}
