/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   response.dto.ts                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jtsizik <jtsizik@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:57:11 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/21 15:00:48 by jtsizik          ###   ########.fr       */
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

export interface UserDataResponse {
  username: string,
  email: string
}