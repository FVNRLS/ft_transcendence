import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { SecurityService } from './security.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '2h' }, // set token expiration time
    }),
  ],
  providers: [AuthService, SessionService, SecurityService],
  controllers: [AuthController],
})
export class AuthModule {}
