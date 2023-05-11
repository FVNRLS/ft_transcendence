/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   game.module.ts                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.de> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/27 15:22:08 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/11 18:15:36 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Module } from "@nestjs/common";
import { SecurityModule } from "src/security/security.module";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "src/prisma/prisma.module";
import { GameController } from "./game.controller";
import { SecurityController } from "src/security/security.controller";
import { GameService } from "./game.service";
import { GameGateway } from "./game.gateway";
import { SecurityService } from "src/security/security.service";
import { SessionService } from "src/auth/session.service";
import { PrismaService } from "src/prisma/prisma.service";


@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "2h" }, // set token expiration time
    }),
    SecurityModule,
  ],
  providers: [GameService, GameGateway, SecurityService, PrismaService, SessionService],
  controllers: [GameController, SecurityController],
})
export class GameModule {}
