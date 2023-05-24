/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   friendship.module.ts                               :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jtsizik <jtsizik@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/03 13:10:29 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/22 12:10:54 by jtsizik          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { SecurityModule } from 'src/security/security.module';
import { FriendshipController } from './friendship.controller';
import { FriendshipService } from './friendship.service';
import { GoogleDriveService } from 'src/auth/google_drive/google.drive.service';
import { SessionService } from 'src/auth/session.service';
import { SecurityService } from 'src/security/security.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "2h" }, // set token expiration time
    }),
    SecurityModule,
  ],
  providers: [FriendshipService, SecurityService, SessionService, GoogleDriveService],
  controllers: [FriendshipController],
})
export class FriendshipModule {}
