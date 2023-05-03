/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   friendship.service.ts                              :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/03 13:10:39 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/03 13:28:06 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Injectable } from '@nestjs/common';
import { FriendshipDto, FriendshipResponse } from './dto';

@Injectable()
export class FriendshipService {
  
  async addFriendship(cookie: string, dto: FriendshipDto): Promise<FriendshipResponse> {
    try {
      
    } catch (error) {
      return error;
    }
  }

}
