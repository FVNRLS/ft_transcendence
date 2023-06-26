import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RoomsService } from 'src/chat/rooms.service';

@Injectable()
export class WsIsUserRoomCreatorGuard implements CanActivate {
  constructor(private readonly roomsService: RoomsService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();

    if (!data.roomId) {
      return false;
    }

    return this.validateRequest(client, data);
  }

  async validateRequest(client: any, data: any): Promise<boolean> {
    const room = await this.roomsService.findOne(data.roomId);
    if (!room) {
      return false;
    }
    return client.data.userId === room.userId;
  }
}
