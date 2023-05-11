/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   game.response.dto.ts                               :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.de> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/27 17:35:45 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/01 17:09:21 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

export interface GameScoreResponse {
	enemyName: String,
	score: String,
	win: Boolean,
	gameTime: String,
}

export interface GameRatingResponse {
	username:	String,
	totalMatches: Number,
	wins: Number,
	losses: Number,
	rank: Number,
}