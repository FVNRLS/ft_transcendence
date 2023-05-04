/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   chat.service.ts                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/04 11:45:03 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/04 11:45:05 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { SecurityService } from "src/security/security.service";
import { ChatDto, ChatResponse } from "./dto";

@Injectable()
export class ChatService {
	constructor(
		private prisma: PrismaService,
		private securityService: SecurityService
		) {}

		async sendMessage(dto: ChatDto): Promise<ChatResponse> {
			try {
				await this.securityService.verifyCookie(dto.cookie);



				return { status: HttpStatus.OK, message: "Message sent!" };
			} catch (error) {
				if (error instanceof HttpException) {
					throw error;
				} else {
					throw new HttpException("Ooops...Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
				}
			}
		}
	}