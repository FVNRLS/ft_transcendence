/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   friendship.dto.ts                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/04 11:46:23 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/04 11:46:25 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { IsNotEmpty, IsString } from "class-validator";

export class FriendshipDto {
	@IsString()
	@IsNotEmpty()
	username: string
}
