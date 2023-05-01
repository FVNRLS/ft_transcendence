/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   game.controller.ts                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/27 15:24:21 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/01 18:55:33 by rmazurit         ###   ########.fr       */
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
			new GameGateway(this.gameService);
		} catch(error) {
			throw error;
		}
	}

	@Post("/get_private_scores")
	async getPersonalScores(@Body("cookie") cookie: string): Promise<GameScoreResponse[]> {
		try {
			return await this.gameService.getPersonalScores(cookie);
		} catch (error) {
			throw error;
		}
	}

	@Post("/get_ranking_table")
	async getRankingTable(@Body("cookie") cookie: string): Promise<GameRatingResponse[]> {
		try {
			return await this.getRankingTable(cookie);
		} catch (error) {
			throw error;
		}
	}

	@Post("/get_user_rating")
	async getPersonalRating(@Body("cookie") cookie: string): Promise<GameRatingResponse> {
		try {
			return await this.getPersonalRating(cookie);
		} catch (error) {
			throw error;
		}
	}

	//TODO: ONLY FOR TESTING PURPOSES! DELETE AFTERWARDS!
	@Post("/update_score")
	async updateScore(dto: GameDto): Promise<void> {
		try {
			return await this.gameService.updateGameData(dto);
		} catch (error) {
			throw error;
		}
	}
}