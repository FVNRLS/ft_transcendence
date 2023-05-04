/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   chat.dto.ts                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/04 11:45:48 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/04 11:45:51 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { IsNotEmpty, IsString,  } from "class-validator";

export class ChatDto {
	@IsString()
	@IsNotEmpty()
	cookie: string

	@IsString()
	@IsNotEmpty()
	message: string

	@IsString()
	@IsNotEmpty()
	roomName: string
}