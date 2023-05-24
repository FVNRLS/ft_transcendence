import { Module } from '@nestjs/common';
import { MessagesService } from './room-messages.service';
import { MessagesGateway } from './room-messages.gateway';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { SecurityModule } from 'src/security/security.module';
import { SecurityService } from 'src/security/security.service';
import { RoomsService } from '../rooms/rooms.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "2h" }, // set token expiration time
    }),
    SecurityModule,
  ],
  providers: [MessagesGateway, MessagesService, SecurityService, RoomsService]
})
export class MessagesModule {}
