import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { MessagesService } from 'src/chat/messages.service';

@Injectable()
export class WsIsUserAuthorOfMessageGuard implements CanActivate {
  constructor(private readonly messagesService: MessagesService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();

    return this.validateRequest(client, data);
  }

  async validateRequest(client: any, data: any): Promise<boolean> {
    const message = await this.messagesService.findOne(data.id);
    if (!message) {
      return false;
    }
    return client.data.userId === message.userId;
  }
}
