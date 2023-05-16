import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WsIsUserMemberOfRoomForMessageGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const data = context.switchToWs().getData();

    const message = await this.prisma.message.findUnique({
      where: { id: data.messageId },
    });

    if (!message) {
      throw new Error(`No message found for id ${data.messageId}`);
    }

    const userRoom = await this.prisma.userOnRooms.findUnique({
      where: { roomId_userId: { roomId: message.roomId, userId: client.data.userId } },
    });

    if (!userRoom) {
      throw new Error(`User not a member of the room for message id ${data.messageId}`);
    }

    return true;
  }
}
