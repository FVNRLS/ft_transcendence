/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   friendship.response.dto.ts                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.de> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/03 13:10:11 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/11 12:47:40 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { HttpStatus } from "@nestjs/common";

export interface FriendshipStatusResponse {
  status: HttpStatus;
  message?: string;
}

export interface FriendshipDataResponse {
  friendName: string;
  // isOnline?: boolean;
}
