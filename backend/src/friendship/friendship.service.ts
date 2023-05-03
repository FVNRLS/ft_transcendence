/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   friendship.service.ts                              :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/03 13:10:39 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/03 18:18:15 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FriendshipDto, FriendshipStatusResponse, FriendshipDataResponse } from './dto';
import { PrismaService } from "../prisma/prisma.service";
import { SecurityService } from 'src/security/security.service';
import { Session, User } from '@prisma/client';

@Injectable()
export class FriendshipService {
  constructor(
    private prisma: PrismaService,
		private securityService: SecurityService,
  ) {}
  
  //CONTROLLER FUNCTIONS
  async addFriendship(cookie: string, dto: FriendshipDto): Promise<FriendshipStatusResponse> {
    try {
      const session: Session = await this.securityService.verifyCookie(cookie);
      const user: User = await this.prisma.user.findUnique({ where: {id: session.userId} });

      if (dto.username === user.username) {
        throw new HttpException("Cmooooon... Are you trying to friend yourself? That's like giving yourself a high five... awkward and kinda sad.", HttpStatus.BAD_REQUEST);
      }
      
      const friend = await this.prisma.user.findUnique({ where: {username: dto.username} });
      if (!friend) {
				throw new HttpException(`The person ${dto.username} doesn't exist`, HttpStatus.NO_CONTENT);
      }
      
      await this.prisma.friend.create({ 
        data: {
          userId: user.id,
          friendId: friend.id,
          friendName: friend.username,
          status: "pending",
        }
       });

      return { status: HttpStatus.CREATED, message: `You have sent a friendship request to the user ${dto.username}! Please wait for their confirmation.` };
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
