/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   response.dto.ts                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.de> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:57:11 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/27 17:37:20 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { HttpStatus } from "@nestjs/common";

export interface AuthResponse {
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