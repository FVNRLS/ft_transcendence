/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   auth.module.ts                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:56:00 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/26 17:37:50 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { SecurityController } from "./security/security.controller";
import { GoogleDriveController } from "./google_drive/google.drive.controller";
import { AuthService } from "./auth.service";
import { SessionService } from "./session.service";
import { SecurityService } from "./security/security.service";
import { GoogleDriveService } from "./google_drive/google.drive.service";
import { MailService } from "./mail.service";


@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "2h" }, // set token expiration time
    }),
  ],
  providers: [AuthService, SessionService, SecurityService, GoogleDriveService, MailService],
  controllers: [AuthController, SecurityController, GoogleDriveController],
})
export class AuthModule {}
