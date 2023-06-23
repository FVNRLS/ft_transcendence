import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-room-message.dto';
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

  // async create(createMessageDto: CreateMessageDto, client: Socket) {
  //   return await this.prisma.message.create({
  //     data: {
  //       userId: client.data.userId,
  //       roomId: createMessageDto.roomId,
  //       content: createMessageDto.content,
  //     },
  //   });
  // }

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
      return { success: true, message: 'User already blocked.' };
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
  
    return { success: true, message: 'User successfully blocked.', block: newBlock };
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
      return { success: true, message: 'Block relation does not exist.' };
    }
  
    // Delete the block relation
    await this.prisma.block.delete({
      where: {
        id: existingBlock.id,
      },
    });
  
    return { success: true, message: 'User successfully unblocked.' };
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

  // async getBlockedUsers(userId: number) {
  //   const blockedUsers = await this.prisma.block.findMany({
  //     where: { blockerId: userId },
  //     include: { blocked: true },  // This line includes the details of the blocked users
  //   });
  
  //   // We only need the details of the blocked users, so map to get those
  //   const blockedUsersDetails = blockedUsers.map(block => block.blocked);
  
  //   return blockedUsersDetails;
  // }

  async getBlockedUsers(userId: number): Promise<number[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { blockedUsers: true },
    });
  
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
  
    return user.blockedUsers.map(block => block.blockedId);
  }  
}
