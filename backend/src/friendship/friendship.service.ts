/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   friendship.service.ts                              :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/03 13:10:39 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/10 11:14:48 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FriendshipDto, FriendshipStatusResponse, FriendshipDataResponse } from './dto';
import { PrismaService } from "../prisma/prisma.service";
import { SecurityService } from 'src/security/security.service';
import { Friend, Session, User } from '@prisma/client';

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
      const user: User = await this.prisma.user.findUnique({ where: { id: session.userId } });

      const friend: User = await this.validateFriendshipRequest(dto, user);

      await this.prisma.friend.create({ 
        data: {
          userId: user.id,
          friendId: friend.id,
          friendName: friend.username,
          status: "pending",
        }
       });

      return { status: HttpStatus.CREATED, message: `You have sent a friendship request to the user ${dto.friendName}! Please wait for the confirmation.` };
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

  private async validateFriendshipRequest(dto: FriendshipDto, user: User): Promise<User> {
    try {
      if (dto.friendName === user.username) {
        throw new HttpException("Cmooooon... Are you trying to friend yourself? That's like giving yourself a high five... awkward and kinda sad.", HttpStatus.BAD_REQUEST);
      }
      
      const friend = await this.prisma.user.findUnique({ where: {username: dto.friendName} });
      if (!friend) {
				throw new HttpException(`The person ${dto.friendName} doesn't exist`, HttpStatus.BAD_REQUEST);
      }
      
      const friendInDatabase = await this.prisma.friend.findFirst({
        where: {
          OR: [
            { userId: friend.id, friendName: user.username },
            { userId: user.id, friendName: friend.username },
          ],
        },
      });
      
      if (friendInDatabase) {
        if (friendInDatabase.status === "pending") {
          if (friendInDatabase.friendName === user.username) {
            throw new HttpException(`The person ${dto.friendName} has already requested a friendship with you - accept him as a friend!`, HttpStatus.BAD_REQUEST);
          } else if (friendInDatabase.friendName === friend.username) {
            throw new HttpException(`You have already requested a friendship with ${dto.friendName}. Please wait for the confirmation.`, HttpStatus.BAD_REQUEST);
          }
        }
        if (friendInDatabase.status === "accepted") {
				  throw new HttpException(`You are already in friendship with ${dto.friendName}`, HttpStatus.BAD_REQUEST);
        }
        return friend;
      }
    } catch (error) {
      throw error;
    }
  }
}
