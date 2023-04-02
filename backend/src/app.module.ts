import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { APP_GUARD } from '@nestjs/core';


@Module({
    imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
    controllers: [AppController],
    providers: [],
})

export class AppModule {}