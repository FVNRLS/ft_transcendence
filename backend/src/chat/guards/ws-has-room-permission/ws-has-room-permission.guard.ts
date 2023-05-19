import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { RoomsService } from 'src/chat/rooms/rooms.service';

@Injectable()
export class WsHasRoomPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly roomsService: RoomsService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const role = this.reflector.get<string>('role', context.getHandler());
    if (!role) {
      return true;
    }

    const client = context.switchToWs().getClient();
    const roomId = context.switchToWs().getData().roomId;
    const userId = client.data.userId;
    
    const userRoom = await this.roomsService.getUserRoom(userId, roomId);

    if (!userRoom || userRoom.role !== role) {
      throw new WsException(`You don't have ${role} permissions in this room`);
    }
    
    return true;
    
  }
}
