/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   game.service.ts                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/27 15:25:45 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/27 19:33:47 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { SecurityService } from "src/security/security.service";
import { GameScoresResponse } from "./dto/scores.response.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class GameService {
	constructor (
		private securityService: SecurityService,
		private prisma: PrismaService,
	) {}
	
	
	async getScores(cookie: string): Promise<GameScoresResponse> {
		try {
			const session = await this.securityService.verifyCookie(cookie);
			const scores = await this.prisma.score.findFirst({ where: { userId: session.userId } })
			const user = await this.prisma.user.findFirst({ where: { id: session.userId } })
			
			let gameScoresResponse: GameScoresResponse;
			gameScoresResponse.username = user.username;
			gameScoresResponse.wins = scores.wins;
			gameScoresResponse.losses = scores.losses;
			gameScoresResponse.totalMatches = scores.totalMatches;
			gameScoresResponse.rating = scores.rating;			
			
      return gameScoresResponse;
		} catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
      }
		}
	}
}