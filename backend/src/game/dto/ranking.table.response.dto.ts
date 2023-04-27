/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ranking.table.response.dto.ts                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/27 17:49:24 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/27 17:49:55 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { HttpStatus } from "@nestjs/common";

export interface GameRankingResponse {
  status: HttpStatus;
  message?: string;
	username?: string,
	wins?: Number,
	losses?: Number,
	totalMatches?: Number,
	rating?: Number,
}