/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   game.response.dto.ts                               :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/27 17:35:45 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/01 13:43:00 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { HttpStatus } from "@nestjs/common";

export interface GameScoreResponse {
	username: String,
	enemyName: String,
	score: String,
	win: Boolean,
	gameTime: String,

}

export interface GameRankingResponse {
	totalMatches: Number,
	wins: Number,
	losses: Number,
	rank: Number,
}