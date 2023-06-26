import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsGateway } from './chat.gateway';
import { SecurityService } from 'src/security/security.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { SecurityModule } from 'src/security/security.module';
import { ChatUserService } from './chat_user.service';
import { MessagesService } from './messages.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "2h" }, // set token expiration time
    }),
    SecurityModule,
  ],
  providers: [RoomsGateway, RoomsService, SecurityService, ChatUserService, MessagesService]
})
export class RoomsModule {}
