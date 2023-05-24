import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecurityService } from 'src/security/security.service';


@WebSocketGateway(+process.env.CHAT_PORT, { cors: "*" })
export class AuthGateway {
   // Define userToSocketIdMap as a static property of the class
   static userToSocketIdMap: { [key: string]: string } = {};

  constructor(
    private readonly prisma: PrismaService,
    private readonly securityService: SecurityService
    ) {}
    
  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const cookie = client.handshake.headers.cookie; // Adjust this line based on how cookie is sent in handshake
      const session = await this.securityService.verifyCookie(cookie);
      const userId = session.userId;
      client.data = { userId }; // Attach the userId to client data

      AuthGateway.userToSocketIdMap[userId] = client.id; // Add entry to map
      
      // You may want to rejoin rooms here or whatever you want to do on a successful connection
      const userRooms = await this.prisma.userOnRooms.findMany({
        where: { userId: session.userId },
      });
    
      userRooms.forEach((userRoom) => {
        client.join(`room-${userRoom.roomId}`);
      });
    
      client.emit('connection_success', { message: 'Reconnected and rooms rejoined' });

    } catch (error) {
      console.log('Invalid credentials');
      client.disconnect(); // disconnect the client if authentication fails
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = Object.keys(AuthGateway.userToSocketIdMap).find(key => AuthGateway.userToSocketIdMap[key] === client.id);
    if (userId) {
      delete AuthGateway.userToSocketIdMap[userId];
    }
  }

}