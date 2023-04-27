/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   game.controller.ts                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/27 15:24:21 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/27 16:50:41 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Body, Controller, Post } from "@nestjs/common";
import { GameService } from "./game.service";
import { SecurityService } from "src/security/security.service";
import { GameGateway } from "./game.gateway";

@Controller("/game")
export class GameController {
	constructor(
		private gameService: GameService,
		private securityService: SecurityService
		) {}

	@Post("/connect")
	async runGameServer(@Body("cookie") cookie: string): Promise<void> {
		try {
			await this.securityService.verifyCookie(cookie);
			new GameGateway;
		} catch(error) {
			throw error;
		}
	}
}