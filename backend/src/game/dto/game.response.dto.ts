/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   game.response.dto.ts                               :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/27 17:35:45 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/01 14:58:35 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

export interface GameScoreResponse {
	username: String,
	enemyName: String,
	score: String,
	win: Boolean,
	gameTime: String,

}

export interface GameRatingResponse {
	totalMatches: Number,
	wins: Number,
	losses: Number,
	rank: Number,
}