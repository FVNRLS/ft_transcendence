import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RoomsService } from 'src/chat/rooms/rooms.service';
@Injectable()
export class WsIsUserInRoomGuard implements CanActivate {
  constructor(private readonly roomsService: RoomsService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();

    if (!data.roomId) {
      return false;
    }

    return this.roomsService.isUserInRoom(client.data.userId, data.roomId);
  }
}
