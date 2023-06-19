/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   friendship.controller.ts                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jtsizik <jtsizik@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/03 13:10:20 by rmazurit          #+#    #+#             */
/*   Updated: 2023/06/19 15:17:16 by jtsizik          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Controller, Post, Body } from "@nestjs/common";
import { FriendshipDataResponse, FriendshipDto, FriendshipStatusResponse } from "./dto";
import { FriendshipService } from "./friendship.service";
import { UserListDataResponse } from "./dto";


@Controller("/friendship")
export class FriendshipController {
  constructor(
    private friendshipService: FriendshipService
    ) {}

  @Post("/add")
  async addFriend(@Body() dto: FriendshipDto): Promise<FriendshipStatusResponse> {
    try {
      return await this.friendshipService.addFriend(dto);
    } catch (error) {
      throw error;
    }
  }

  @Post("/accept")
  async acceptFriend(@Body() dto: FriendshipDto): Promise<FriendshipStatusResponse> {
    try {
      return await this.friendshipService.acceptFriend(dto);
    } catch (error) {
      throw error;
    }
  }

  @Post("/reject")
  async rejectFriend(@Body() dto: FriendshipDto): Promise<FriendshipStatusResponse> {
    try {
      return await this.friendshipService.rejectFriend(dto);
    } catch (error) {
      throw error;
    }
  }

  @Post("/delete")
  async deleteFriend(@Body() dto: FriendshipDto): Promise<FriendshipStatusResponse> {
    try {
      return await this.friendshipService.deleteFriend(dto);
    } catch (error) {
      throw error;
    }
  }

  @Post("/get_accepted")
  async getAcceptedFriends(@Body("cookie") cookie: string): Promise<UserListDataResponse[]> {
    try {
      return await this.friendshipService.getFriends(cookie);
    } catch (error) {
      throw error;
    }
  }

  @Post("/get_to_accept")
  async getFriendsToAccept(@Body("cookie") cookie: string): Promise<UserListDataResponse[]> {
    try {
      return await this.friendshipService.getFriendsToAccept(cookie);
    } catch (error) {
      throw error;
    }
  }

  @Post("/get_users")
  async getUsers(@Body("cookie") cookie: string): Promise<UserListDataResponse[]> {
    try {
      return await this.friendshipService.getUserList(cookie);
    } catch (error) {
      throw error;
    }
  }

  @Post("/get_users_all")
  async getUsersAll(@Body("cookie") cookie: string): Promise<UserListDataResponse[]> {
    try {
      return await this.friendshipService.getUserListAll(cookie);
    } catch (error) {
      throw error;
    }
  }
}
