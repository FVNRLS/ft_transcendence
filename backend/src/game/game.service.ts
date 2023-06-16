/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   game.service.ts                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jtsizik <jtsizik@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/27 15:25:45 by rmazurit          #+#    #+#             */
/*   Updated: 2023/06/16 14:20:57 by jtsizik          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { SecurityService } from "src/security/security.service";
import { GameScoreResponse, GameRatingResponse, GameDto } from "./dto";
import { PrismaService } from "src/prisma/prisma.service";
import { Rating, Score, Session } from "@prisma/client";

@Injectable()
export class GameService {
	constructor (
		private securityService: SecurityService,
		private prisma: PrismaService,
	) {}
	
	//TODO: delete route in controllers!
	//here no route/endpoint required - the public function is only to apply after the match end in GameGateway
	async updateGameData(dto: GameDto): Promise<void> {
		try {

			const userSession: Session = await this.securityService.verifyCookie(dto.userCookie);
			const enemySession: Session = await this.securityService.verifyCookie(dto.enemyCookie);

			const score = `${dto.userScore}:${dto.enemyScore}`;

			const user = await this.prisma.user.findFirst({where: {id: userSession.userId}});
			const enemy = await this.prisma.user.findFirst({where: {id: enemySession.userId}});

			await this.prisma.score.create({
				data: {
					userId: user.id,
					enemyName: enemy.username,
					score: score,
					win: dto.win,
				},
			});

			const currentRating = await this.prisma.rating.update({
				where: { userId: user.id },
				data: {
					totalMatches: { increment: 1 },
					wins: dto.win === 'true' ? {
						increment: 1,
					} : undefined,
					losses: dto.win === 'true' ? undefined : {
						increment: 1,
					},
				},
			});

			await this.updateRatingTable(currentRating);		
		} catch (error) {
			console.log(error);
			if (error instanceof HttpException) {
				throw error;
			} else {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
	}
	
	async getPersonalScores(cookie: string): Promise<GameScoreResponse[]> {
		try {
			const user = await this.securityService.verifyCookie(cookie);
		
			let scoreTable: GameScoreResponse[] = [];
			const scoreList: Score[] = await this.prisma.score.findMany();
			
			if (scoreList.length === 0) {
				throw new HttpException("Oh no! It looks like you didn't play our ping pong game yet!", HttpStatus.NO_CONTENT);
			}
			
			for (let i: number = 0; i < scoreList.length; i++) {
				const score = scoreList[i];
				if (score.userId == user.id) {
					const scoreResponse = await this.getScore(score);
					scoreTable.push(scoreResponse);
				}
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
			const ratingList: Rating[] = await this.prisma.rating.findMany({ 
				where: { rank: { lte: 20 } },
				orderBy: { rank: 'asc' }
			});
			
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

	async getPersonalRating(cookie: string): Promise<GameRatingResponse> {
		try {
			const session: Session = await this.securityService.verifyCookie(cookie);
			
			const rating: Rating = await this.prisma.rating.findFirst( {where: { id: session.userId } } );
			const ratingResponse = this.getRating(rating);
	
			return ratingResponse;
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}		
	}

	private async getRating(rating: Rating): Promise<GameRatingResponse> {
		try {			
			const ratingResponse: GameRatingResponse = {
				username: rating.username,
				totalMatches: rating.totalMatches,
				wins: rating.wins,
				losses: rating.losses,
				rank: rating.rank,
			};

			return ratingResponse;
		} catch (error) {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	private async getScore(score: Score): Promise<GameScoreResponse> {
		try {			
			const scoreResponse: GameScoreResponse = {
				enemyName: score.enemyName,
				score: score.score,
				win: score.win,
				gameTime: score.gameTime.toUTCString(),
			}

			return scoreResponse;
		} catch (error) {			
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	private async updateRatingTable(currentRating: Rating): Promise<void> {
		try {
			const winPercentage = currentRating.wins / currentRating.totalMatches;
			const rating = Math.round((winPercentage * 10000) + (currentRating.totalMatches * 10));
		
			await this.prisma.rating.update({ where: { id: currentRating.id }, data: { rank: rating } });
		
			// Find all ratings that are higher than the current user's new rank and sort them by rank in descending order
			const higherRatings = await this.prisma.rating.findMany({ where: { rank: { gt: rating } }, orderBy: { rank: 'desc' } });
		
			// Shift the rankings of all higher-rated users down by 1
			for (const higherRating of higherRatings) {
				await this.prisma.rating.update({ where: { id: higherRating.id }, data: { rank: higherRating.rank + 1 } });
			}
		
			// Update the rankings of any users who have the same rank as the current user
			const sameRankRatings = await this.prisma.rating.findMany({ where: { rank: rating, id: { not: currentRating.id } } });
		
			for (const sameRankRating of sameRankRatings) {
				// If the user has the same rank as the current user, but has played fewer games, they should be ranked higher
				if (sameRankRating.totalMatches < currentRating.totalMatches) {
					await this.prisma.rating.update({
						where: { id: sameRankRating.id },
						data: { rank: sameRankRating.rank - 1 },
					});
				}
				// Otherwise, they should be ranked lower
				else if (sameRankRating.totalMatches > currentRating.totalMatches) {
					await this.prisma.rating.update({
						where: { id: sameRankRating.id },
						data: { rank: sameRankRating.rank + 1 },
					});
				}
			}
		} catch (error) {
			throw error;
		}
	}
	
}