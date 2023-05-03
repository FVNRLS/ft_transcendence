/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   friendship.controller.ts                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/03 13:10:20 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/03 13:27:31 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Controller, Get, Post, Body } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Friend } from "@prisma/client";
import { FriendshipDto, FriendshipResponse } from "./dto";

@Controller("/friends")
export class FriendshipController {
  constructor(private prisma: PrismaService) {
    
  }

  @Post("/add")
  async addFriendship(@Body("cookie") cookie: string, @Body() dto: FriendshipDto): Promise<FriendshipResponse> {
    try {
      
    } catch (error) {
      return error;
    }
  }

  @Post("/accept")
  async acceptFriend(@Body("cookie") cookie: string, @Body() dto: FriendshipDto): Promise<FriendshipResponse> {
    try {
      
    } catch (error) {
      return error;
      }
  }

  @Post("/reject")
  async rejectFriend(@Body("cookie") cookie: string, @Body() dto: FriendshipDto): Promise<FriendshipResponse> {
    try {
      
    } catch (error) {
      return error;
    }
  }

  @Post("/delete")
  async deleteFriend(@Body("cookie") cookie: string, @Body() dto: FriendshipDto): Promise<FriendshipResponse> {
    try {
      
    } catch (error) {
      return error;
    }
  }

  @Get("/get_accepted")
  async getAcceptedFriends(@Body("cookie") cookie: string): Promise<Friend[]> {
    try {
      
    } catch (error) {
      return error;
    }
  }

  @Get("/get_pending")
  async getPendingFriendships(@Body("cookie") cookie: string): Promise<Friend[]> {
    try {
      
    } catch (error) {
      return error;
    }
  }
}
