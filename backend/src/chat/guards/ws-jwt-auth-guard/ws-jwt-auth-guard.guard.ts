import { CanActivate, ConsoleLogger, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { WsException } from '@nestjs/websockets';
import { SecurityService } from 'src/security/security.service';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(private securityService: SecurityService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();

    return this.validateRequest(client, data);
  }

  async validateRequest(client, data): Promise<boolean> {
    if (client.data.userId)
      return true;
    const cookie = data.cookie;
    try {
      const session = await this.securityService.verifyCookie(cookie);
      client.data.userId = session.userId;
      return true;
    } catch (error) {
      console.log('Invalid credentials');
      throw new WsException('Invalid credentials');
    }
  }
}
