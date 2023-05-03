/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   friendship.response.dto.ts                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/03 13:10:11 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/03 15:16:43 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { HttpStatus } from "@nestjs/common";
import { Friend } from "@prisma/client";

export interface FriendshipStatusResponse {
  status: HttpStatus;
  message?: string;
}

export interface FriendshipDataResponse {
  friends: Friend[];
  isOnline: boolean;
}
