import { Module } from '@nestjs/common';
import { SecurityService } from 'src/security/security.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { SecurityModule } from 'src/security/security.module';
import { ChatAuthGateway } from './chat_auth.gateway';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "2h" }, // set token expiration time
    }),
    SecurityModule,
  ],
  providers: [ChatAuthGateway, SecurityService]
})
export class ChatAuthModule {}
