/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   game.controller.ts                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/27 15:24:21 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/27 19:08:02 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Body, Controller, Post } from "@nestjs/common";
import { GameService } from "./game.service";
import { SecurityService } from "src/security/security.service";
import { GameGateway } from "./game.gateway";
import { GameScoresResponse } from "./dto/scores.response.dto";
import { GameRankingResponse } from "./dto/ranking.table.response.dto";

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
			new GameGateway(this.gameService);
		} catch(error) {
			throw error;
		}
	}

	@Post("/get_private_scores")
	async getScores(@Body("cookie") cookie: string): Promise<GameScoresResponse> {
		try {
			return await this.gameService.getScores(cookie);			
		} catch (error) {
			throw error;
		}
	}

	// @Post("/get_ranking_table")
	// async getRankingTable(@Body("cookie") cookie: string): Promise<GameRankingResponse> {
	// 	try {
			
	// 	} catch (error) {
	// 		throw error;
	// 	}
	// }
}