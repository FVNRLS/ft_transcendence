/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   game.service.ts                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/27 15:25:45 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/01 14:06:34 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { SecurityService } from "src/security/security.service";
import { GameScoreResponse, GameRankingResponse } from "./dto";
import { PrismaService } from "src/prisma/prisma.service";
import { Score } from "@prisma/client";

@Injectable()
export class GameService {
	constructor (
		private securityService: SecurityService,
		private prisma: PrismaService,
	) {}
	
	
	async getPersonalScores(cookie: string): Promise<GameScoreResponse[]> {
		try {
			await this.securityService.verifyCookie(cookie);
		
			let scores: GameScoreResponse[] = [];
			const scoreList = await this.prisma.score.findMany();
			
			for (let i: number = 0; i < scoreList.length; ++i) {
				const score = scoreList[i];
				const scoreResponse = await this.getScore(score);
			
				scores.push(scoreResponse);
			};
			
			return scores;
			} catch (error) {
			throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	private async getScore(score: Score): Promise<GameScoreResponse> {
		try {			
			let scoreResponse: GameScoreResponse;
			scoreResponse.username = score.username;
			scoreResponse.enemyName = score.enemyName;
			scoreResponse.score = score.score;
			scoreResponse.win = score.win;
			scoreResponse.gameTime = score.gameTime.toString();

			return scoreResponse;
		} catch (error) {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}