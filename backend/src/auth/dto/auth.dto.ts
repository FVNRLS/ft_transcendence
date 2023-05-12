/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   auth.dto.ts                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.de> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:57:26 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/26 17:38:57 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AuthDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  token_42?: string;

  @IsOptional()
  @IsString()
  googleAccessToken?: string;

  @IsOptional()
  @IsString()
  TFACode?: string;
}