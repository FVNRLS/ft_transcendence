/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   game.dto.ts                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:57:26 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/01 16:14:19 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { IsBoolean, IsNumber, IsString } from "class-validator";

export class GameDto {
  @IsNumber()
  userId: number
  
  @IsString()
	enemyName: string

  @IsString()
	score: string

  @IsBoolean()
	win: boolean
}