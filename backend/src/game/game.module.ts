/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   game.module.ts                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/27 15:22:08 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/27 15:37:45 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Module } from "@nestjs/common";
import { GameController } from "./game.controller";
import { SecurityController } from "src/security/security.controller";
import { GameService } from "./game.service";
import { SecurityService } from "src/security/security.service";
import { SessionService } from "src/auth/session.service";
import { GameGateway } from "./game.gateway";


@Module({
  providers: [GameService, SecurityService, SessionService, GameGateway],
  controllers: [GameController, SecurityController],
})
export class GameModule {}
