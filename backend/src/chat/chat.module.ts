/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   chat.module.ts                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/04 11:45:19 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/04 11:45:21 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecurityController } from 'src/security/security.controller';
import { SecurityModule } from 'src/security/security.module';
import { SecurityService } from 'src/security/security.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
	imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "2h" }, // set token expiration time
    }),
    SecurityModule,
  ],
  providers: [SecurityService, PrismaService, ChatService],
  controllers: [ChatController, SecurityController],
})
export class ChatModule {}
