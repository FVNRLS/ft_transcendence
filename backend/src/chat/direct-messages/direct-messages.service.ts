import { Injectable } from '@nestjs/common';
import { CreateDirectMessageDto } from './dto/create-direct-message.dto';
import { UpdateDirectMessageDto } from './dto/update-direct-message.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DirectMessagesService {
  constructor(private readonly prisma: PrismaService) {}


  async create(senderId: number, createDirectMessageDto: CreateDirectMessageDto) {
    // Assuming you're using Prisma, but you can replace this with your own implementation
    return await this.prisma.directMessage.create({
      data: {
        senderId: senderId,
        receiverId: createDirectMessageDto.receiverId,
        content: createDirectMessageDto.content,
      },
    });
  }

  async getUserMessages(senderId: number, receiverId: number) {
    // Return all direct messages where the sender and receiver match the input parameters
    return this.prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: senderId, receiverId: receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async remove(id: number, userId: number) {
    const message = await this.prisma.directMessage.findUnique({ where: { id } });
    if (!message) throw new Error('Message not found');
    if (message.senderId !== userId) throw new Error('Not authorized');
    return this.prisma.directMessage.delete({ where: { id } });
  }


  findOne(id: number) {
    return `This action returns a #${id} directMessage`;
  }

  update(id: number, updateDirectMessageDto: UpdateDirectMessageDto) {
    return `This action updates a #${id} directMessage`;
  }

}
