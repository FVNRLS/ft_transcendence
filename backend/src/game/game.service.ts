/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   game.service.ts                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/27 15:25:45 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/01 15:54:54 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { SecurityService } from "src/security/security.service";
import { GameScoreResponse, GameRatingResponse, GameDto } from "./dto";
import { PrismaService } from "src/prisma/prisma.service";
import { Rating, Score } from "@prisma/client";

@Injectable()
export class GameService {
	constructor (
		private securityService: SecurityService,
		private prisma: PrismaService,
	) {}
	
	async getPersonalScores(cookie: string): Promise<GameScoreResponse[]> {
		try {
			await this.securityService.verifyCookie(cookie);
		
			let scoreTable: GameScoreResponse[] = [];
			const scoreList: Score[] = await this.prisma.score.findMany();
			
			for (let i: number = 0; i < scoreList.length; ++i) {
				const score = scoreList[i];
				const scoreResponse = await this.getScore(score);
				scoreTable.push(scoreResponse);
			};
			
			return scoreTable;
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
	}

	async getRatingTable(cookie: string): Promise<GameRatingResponse[]> {
		try {
			await this.securityService.verifyCookie(cookie);

			let ratingTable: GameRatingResponse[] = [];
			const ratingList: Rating[] = await this.prisma.rating.findMany();
			ratingList.sort((a: Rating, b: Rating): number => a.rank - b.rank);
			
			let length: number;
			if (ratingList.length < 20) {
				length = ratingList.length;
			} else {
				length = 20;
			}
			
			for (let i: number = 0; i < length; ++i) {
				const rating = ratingList[i];
				const ratingResponse = await this.getRating(rating);
				ratingTable.push(ratingResponse);
			};

			return ratingTable;		
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
	
	}

	//here no route/endpoint required - the public function is only to apply after the match end
	async updateGameData(dto: GameDto): Promise<void>{
		try {
			await this.prisma.score.create({
				data: {
					userId: dto.userId,
					enemyName: dto.enemyName,
					score: dto.score,
					win: dto.win,
				},
			});

			

		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
	}

	private async getScore(score: Score): Promise<GameScoreResponse> {
		try {			
			let scoreResponse: GameScoreResponse;
			scoreResponse.enemyName = score.enemyName;
			scoreResponse.score = score.score;
			scoreResponse.win = score.win;
			scoreResponse.gameTime = score.gameTime.toString();

			return scoreResponse;
		} catch (error) {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	private async getRating(rating: Rating): Promise<GameRatingResponse> {
		try {			
			let ratingResponse: GameRatingResponse;
			ratingResponse.totalMatches = rating.totalMatches;
			ratingResponse.wins = rating.wins;
			ratingResponse.losses = rating.losses;
			ratingResponse.rank = rating.rank;

			return ratingResponse;
		} catch (error) {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}