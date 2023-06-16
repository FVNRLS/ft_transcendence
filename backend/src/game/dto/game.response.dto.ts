/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   game.response.dto.ts                               :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jtsizik <jtsizik@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/27 17:35:45 by rmazurit          #+#    #+#             */
/*   Updated: 2023/06/16 11:26:20 by jtsizik          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

export interface GameScoreResponse {
	enemyName: String,
	score: String,
	win: String,
	gameTime: String,
}

export interface GameRatingResponse {
	username:	String,
	totalMatches: Number,
	wins: Number,
	losses: Number,
	rank: Number,
}