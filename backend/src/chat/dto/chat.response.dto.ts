/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   chat.response.dto.ts                               :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/04 11:45:33 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/04 11:45:35 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { HttpStatus } from "@nestjs/common";

export interface ChatResponse {
	status: HttpStatus,
	message?: string
}