/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   friendship.service.ts                              :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/03 13:10:39 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/03 14:24:56 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FriendshipDto, FriendshipResponse } from './dto';
import { PrismaService } from "../prisma/prisma.service";
import { SecurityService } from 'src/security/security.service';

@Injectable()
export class FriendshipService {
  constructor(
    private prisma: PrismaService,
		private securityService: SecurityService,
    
  ) {}
  
  async addFriendship(cookie: string, dto: FriendshipDto): Promise<FriendshipResponse> {
    try {
      await this.securityService.verifyCookie(cookie);
      
      

      return { status: HttpStatus.CREATED, message: `You have sent a friendship request to the user ${dto.username}!
       Please wait for their confirmation.` };
    } catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
  }

  // async acceptFriend(@Body("cookie") cookie: string, @Body() dto: FriendshipDto): Promise<FriendshipResponse> {
  //   try {
      
  //   } catch (error) {
	// 		if (error instanceof HttpException) {
	// 			throw error;
	// 		} else {
	// 			throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
	// 		}
	// 	}
  // }

  // async rejectFriend(@Body("cookie") cookie: string, @Body() dto: FriendshipDto): Promise<FriendshipResponse> {
  //   try {
      
  //   } catch (error) {
	// 		if (error instanceof HttpException) {
	// 			throw error;
	// 		} else {
	// 			throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
	// 		}
	// 	}
  // }

  // async deleteFriend(@Body("cookie") cookie: string, @Body() dto: FriendshipDto): Promise<FriendshipResponse> {
  //   try {
      
  //   } catch (error) {
	// 		if (error instanceof HttpException) {
	// 			throw error;
	// 		} else {
	// 			throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
	// 		}
	// 	}
  // }

  // async getAcceptedFriends(@Body("cookie") cookie: string): Promise<Friend[]> {
  //   try {
      
  //   } catch (error) {
	// 		if (error instanceof HttpException) {
	// 			throw error;
	// 		} else {
	// 			throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
	// 		}
	// 	}
  // }

  // async getPendingFriendships(@Body("cookie") cookie: string): Promise<Friend[]> {
  //   try {
      
  //   } catch (error) {
	// 		if (error instanceof HttpException) {
	// 			throw error;
	// 		} else {
	// 			throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
	// 		}
	// 	}
  // }
}
