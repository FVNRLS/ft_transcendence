/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   response.dto.ts                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:57:11 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/25 19:03:00 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { HttpStatus } from "@nestjs/common";

export interface ApiResponse {
  status: HttpStatus;
  message?: string;
  cookie?: string;
  googleDriveToken?: string
}

export interface FileResponse {
  fieldname: string,
  originalname: string,
  encoding: string,
  mimetype: string,
  buffer: Buffer,
  size: number,
}