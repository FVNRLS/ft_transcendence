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
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: limit,
    });
  }

  // async blockUser(blockerId: number, blockedId: number) {
  //   // Check if this block relation already exists
  //   const existingBlock = await this.prisma.block.findFirst({
  //     where: {
  //       blockerId: blockerId,
  //       blockedId: blockedId,
  //     },
  //   });

  //   if (existingBlock) {
  //     return { message: 'User already blocked.' };
  //   }

  //   // Create the block relation
  //   const newBlock = await this.prisma.block.create({
  //     data: {
  //       blockerId: blockerId,
  //       blockedId: blockedId,
  //     },
  //   });

  //   return { message: 'User successfully blocked.', block: newBlock };
  // }

  async blockUser(blockerId: number, blockedId: number) {
    // Check if this block relation already exists
    const existingBlock = await this.prisma.block.findFirst({
          where: {
            blockerId: blockerId,
            blockedId: blockedId,
          },
    });
  
    if (existingBlock) {
      return { message: 'User already blocked.' };
    }
  
    // Check if blockedId is defined
    if (blockedId === undefined) {
      throw new Error('BlockedId is undefined');
    }
  
    // Create the block relation
    const newBlock = await this.prisma.block.create({
      data: {
        blockerId: blockerId,
        blockedId: blockedId,
      },
    });
  
    return { message: 'User successfully blocked.', block: newBlock };
  }
  
  

  async unblockUser(blockerId: number, blockedId: number) {
    // Check if this block relation exists
    const existingBlock = await this.prisma.block.findFirst({
      where: {
        blockerId: blockerId,
        blockedId: blockedId,
      },
    });

    if (!existingBlock) {
      return { message: 'Block relation does not exist.' };
    }

    // Delete the block relation
    await this.prisma.block.delete({
      where: {
        id: existingBlock.id,
      },
    });

    return { message: 'User successfully unblocked.' };
  }

  async isBlocked(blockerId: number, blockedId: number): Promise<boolean> {
    const block = await this.prisma.block.findFirst({
      where: {
        blockerId: blockerId,
        blockedId: blockedId,
      },
    });
  
    return block !== null;
  }
  
}
