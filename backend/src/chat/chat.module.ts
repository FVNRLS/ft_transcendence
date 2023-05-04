import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecurityController } from 'src/security/security.controller';
import { SecurityModule } from 'src/security/security.module';
import { SecurityService } from 'src/security/security.service';
import { ChatController } from './chat.controller';

@Module({
	imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "2h" }, // set token expiration time
    }),
    SecurityModule,
  ],
  providers: [SecurityService, PrismaService],
  controllers: [ChatController, SecurityController],
})
export class ChatModule {}
