/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   chat.controller.ts                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/04 11:45:11 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/04 11:45:13 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Body, Controller, Post } from "@nestjs/common";
import { ChatDto } from "./dto";
import { ChatService } from "./chat.service";

@Controller("/chat")
export class ChatController {

	constructor(
		private chatService: ChatService
	) {}

	@Post()
	async sendMessage(@Body() dto: ChatDto) {
			try {
				return await this.chatService.sendMessage(dto);
			} catch (error) {
				throw error;
			}
	}
	}