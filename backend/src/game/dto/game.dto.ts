/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   game.dto.ts                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jtsizik <jtsizik@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:57:26 by rmazurit          #+#    #+#             */
/*   Updated: 2023/06/16 11:12:01 by jtsizik          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { IsBoolean, IsNumber, IsString } from "class-validator";

export class GameDto {
  @IsString()
  userCookie: string
  
  @IsString()
	enemyCookie: string

  @IsNumber()
	userScore: number

  @IsNumber()
	enemyScore: number

  @IsString()
	win: string
}