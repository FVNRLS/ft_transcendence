/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   friendship.service.ts                              :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/03 13:10:39 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/05 14:52:05 by rmazurit         ###   ########.fr       */
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
  async addFriend(dto: FriendshipDto): Promise<FriendshipStatusResponse> {
    try {
      const session: Session = await this.securityService.verifyCookie(dto.cookie);
      const user: User = await this.prisma.user.findUnique({ where: {id: session.userId} });

      if (dto.friendName === user.username) {
        throw new HttpException("Cmooooon... Are you trying to friend yourself? That's like giving yourself a high five... awkward and kinda sad.", HttpStatus.BAD_REQUEST);
      }
      
      const friend = await this.prisma.user.findUnique({ where: {username: dto.friendName} });
      if (!friend) {
				throw new HttpException(`The person ${dto.friendName} doesn't exist`, HttpStatus.NO_CONTENT);
      }
      
      const friendInDatabase = await this.prisma.friend.findFirst({ where: {userId: friend.id } });
      const reverseFriendshipRequestExists = await this.prisma.friend.findFirst({ where: {userId: friendInDatabase.userId, status: "pending"} });
      if (reverseFriendshipRequestExists) {
				throw new HttpException(`The person ${dto.friendName} hast already requested a friendship with you - accept him as a friend!`, HttpStatus.BAD_REQUEST);
      }
      
      await this.prisma.friend.create({ 
        data: {
          userId: user.id,
          friendId: friend.id,
          friendName: friend.username,
          status: "pending",
        }
       });

      return { status: HttpStatus.CREATED, message: `You have sent a friendship request to the user ${dto.friendName}! Please wait for their confirmation.` };
    } catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
  }

  async acceptFriend(dto: FriendshipDto): Promise<FriendshipStatusResponse> {
    try {
      const session = await this.securityService.verifyCookie(dto.cookie);
      const friendshipEntry = await this.prisma.friend.findFirst({ where: {userId: session.userId, friendName: dto.friendName } })
      
      await this.prisma.friend.update({ where: { id: friendshipEntry.id }, data: { status: "accepted" } });
      
      return { status: HttpStatus.OK, message: "Done!" };
    } catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
  }

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

  // async getFriendshipsToAccept(@Body("cookie") cookie: string): Promise<Friend[]> {
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
