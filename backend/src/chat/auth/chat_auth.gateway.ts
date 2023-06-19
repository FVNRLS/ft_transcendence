import { ConsoleLogger } from '@nestjs/common';
import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecurityService } from 'src/security/security.service';

const app_ip = process.env.REACT_APP_IP;

@WebSocketGateway(+process.env.CHAT_PORT, { 
  cors: {
      origin: `http://${app_ip}:3000`, // Replace with the origin you want to allow
      methods: ["GET", "POST"],
      credentials: true
  } 
})
export class ChatAuthGateway {
   // Define userToSocketIdMap as a static property of the class
   static userToSocketIdMap: { [key: string]: string } = {};

  constructor(
    private readonly prisma: PrismaService,
    private readonly securityService: SecurityService
    ) {}
    
  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      // console.log("HandleConnect");
      const cookie = client.handshake.headers.cookie; // Adjust this line based on how cookie is sent in handshake

      // Split the cookie string into individual cookies
      const allCookies = cookie.split('; ');

      // Use the find() function to locate the session cookie
      const sessionCookieWithLabel = allCookies.find(cookie => cookie.startsWith('session='));

      // If a session cookie was found, remove the 'session=' label from the start
      const sessionCookie = sessionCookieWithLabel ? sessionCookieWithLabel.replace('session=', '') : allCookies[0];


      // // Add this line to strip "session=" from the start of the cookie
      // const sessionCookie = cookie.replace('session=', '');


      const session = await this.securityService.verifyCookie(sessionCookie);
      
      const userId = session.userId;
      client.data = { userId }; // Attach the userId to client data

      ChatAuthGateway.userToSocketIdMap[userId] = client.id; // Add entry to map
      
      // You may want to rejoin rooms here or whatever you want to do on a successful connection
      const userRooms = await this.prisma.userOnRooms.findMany({
        where: { userId: session.userId },
      });
    
      userRooms.forEach((userRoom) => {
        client.join(`room-${userRoom.roomId}`);
      });
    
      client.emit('connection_success', { message: 'Reconnected and rooms rejoined' });
      // After userId has been assigned
      client.emit('user_verified', { message: 'User has been verified' });


    } catch (error) {
      console.log('Invalid credentials');
      client.disconnect(); // disconnect the client if authentication fails
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = Object.keys(ChatAuthGateway.userToSocketIdMap).find(key => ChatAuthGateway.userToSocketIdMap[key] === client.id);
    if (userId) {
      delete ChatAuthGateway.userToSocketIdMap[userId];
    }
  }

}