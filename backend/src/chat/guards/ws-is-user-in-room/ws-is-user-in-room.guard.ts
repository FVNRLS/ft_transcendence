import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RoomsService } from 'src/chat/rooms/rooms.service';

@Injectable()
export class WsIsUserInRoomGuard implements CanActivate {
  constructor(private readonly roomsService: RoomsService) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();

    if (!data.roomId) {
      return false;
    }

    const userRoom = await this.roomsService.getUserRoom(client.data.userId, data.roomId);

    return !!userRoom; // returns true if userRoom is not null, otherwise returns false
  }
}
