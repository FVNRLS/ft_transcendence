/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   app.module.ts                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:56:24 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/27 14:54:55 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { GameGateway } from "./game/game.gateway";
import { SecurityModule } from "./security/security.module";

@Module({
    imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, PrismaModule, SecurityModule],
    controllers: [AppController],
    providers: [GameGateway],
})

export class AppModule {}
