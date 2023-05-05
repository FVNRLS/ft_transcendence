/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   friendship.dto.ts                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/04 11:46:23 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/05 14:50:04 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { IsNotEmpty, IsString } from "class-validator";

export class FriendshipDto {
	@IsString()
	@IsNotEmpty()
	cookie: string

	@IsString()
	@IsNotEmpty()
	friendName?: string
}
