/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   friendship.response.dto.ts                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jtsizik <jtsizik@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/03 13:10:11 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/24 16:11:13 by jtsizik          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { HttpStatus } from "@nestjs/common";
import { FileResponse } from "src/auth/dto/response.dto";

export interface FriendshipStatusResponse {
  status: HttpStatus;
  message?: string;
}

export interface FriendshipDataResponse {
  friendName: string;
  // isOnline?: boolean;
}

export interface UserListDataResponse {
  username: string;
  picture: FileResponse;
}