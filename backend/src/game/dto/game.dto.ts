/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   game.dto.ts                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:57:26 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/27 15:41:31 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class GameDto {
  @IsString()
  cookie?: string;
}