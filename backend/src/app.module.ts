import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { GoogleDriveModule } from './google_drive/google.drive.module';

@Module({
    imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, PrismaModule, GoogleDriveModule],
    controllers: [AppController],
    providers: [],
})

export class AppModule {}
