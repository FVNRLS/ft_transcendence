import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Socket } from 'socket.io';


@Injectable()
export abstract class BaseRoomService {
  constructor(
    // protected readonly prisma: PrismaService,
    protected readonly repository: any
  ) {}

  async remove(roomId: number, client: Socket) {
    const room = await this.repository.findUnique({
      where: { id: roomId },
    });
    if (!room) {
      throw new Error(`No room found for id ${roomId}`);
    }
    if (room.userId !== client.data.userId) {
      throw new Error('You are not authorized to delete this room');
    }
    return this.repository.delete({
      where: { id: roomId },
    });
  }
}
