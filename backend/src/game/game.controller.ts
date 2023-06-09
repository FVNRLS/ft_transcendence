/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   game.controller.ts                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jtsizik <jtsizik@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/27 15:24:21 by rmazurit          #+#    #+#             */
/*   Updated: 2023/06/16 09:58:15 by jtsizik          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Body, Controller, Post } from "@nestjs/common";
import { GameService } from "./game.service";
import { SecurityService } from "src/security/security.service";
import { GameGateway } from "./game.gateway";
import { GameScoreResponse, GameRatingResponse, GameDto } from "./dto";

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
			// new GameGateway(this.gameService);
		} catch(error) {
			throw error;
		}
	}

	@Post("/update_score")
	async updateScore(@Body() dto: GameDto): Promise<void> {
		try {
			return await this.gameService.updateGameData(dto);
		} catch (error) {
			throw error;
		}
	}

	@Post("/get_personal_scores")
	async getPersonalScores(@Body("cookie") cookie: string): Promise<GameScoreResponse[]> {
		try {
			return await this.gameService.getPersonalScores(cookie);
		} catch (error) {
			throw error;
		}
	}

	@Post("/get_ranking_table")
	async getRatingTable(@Body("cookie") cookie: string): Promise<GameRatingResponse[]> {
		try {
			return await this.gameService.getRatingTable(cookie);
		} catch (error) {
			throw error;
		}
	}

	@Post("/get_user_rating")
	async getPersonalRating(@Body("cookie") cookie: string): Promise<GameRatingResponse> {
		try {
			return await this.gameService.getPersonalRating(cookie);
		} catch (error) {
			throw error;
		}
	}
}