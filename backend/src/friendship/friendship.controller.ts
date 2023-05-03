/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   friendship.controller.ts                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/03 13:10:20 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/03 15:52:57 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Controller, Get, Post, Body } from "@nestjs/common";
import { FriendshipDataResponse, FriendshipDto, FriendshipStatusResponse } from "./dto";
import { FriendshipService } from "./friendship.service";

@Controller("/friendship")
export class FriendshipController {
  constructor(
    private friendshipService: FriendshipService
    ) {}

  @Post("/add")
  async addFriend(@Body("cookie") cookie: string, @Body() dto: FriendshipDto): Promise<FriendshipStatusResponse> {
    try {
      return await this.friendshipService.addFriendship(cookie, dto);
    } catch (error) {
      throw error;
    }
  }

//   @Post("/accept")
//   async acceptFriend(@Body("cookie") cookie: string, @Body() dto: FriendshipDto): Promise<FriendshipStatusResponse> {
//     try {
      
//     } catch (error) {
//       throw error;
//     }
//   }

//   @Post("/reject")
//   async rejectFriend(@Body("cookie") cookie: string, @Body() dto: FriendshipDto): Promise<FriendshipStatusResponse> {
//     try {
      
//     } catch (error) {
//       throw error;
//     }
//   }

//   @Post("/delete")
//   async deleteFriend(@Body("cookie") cookie: string, @Body() dto: FriendshipDto): Promise<FriendshipStatusResponse> {
//     try {
      
//     } catch (error) {
//       throw error;
//     }
//   }

//   @Get("/get_accepted")
//   async getAcceptedFriends(@Body("cookie") cookie: string): Promise<FriendshipDataResponse> {
//     try {
      
//     } catch (error) {
//       throw error;
//     }
//   }

//   @Get("/get_pending")
//   async getPendingFriendships(@Body("cookie") cookie: string): Promise<FriendshipDataResponse> {
//     try {
      
//     } catch (error) {
//       throw error;
//     }
//   }
}
