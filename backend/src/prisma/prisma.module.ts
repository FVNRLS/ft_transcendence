/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   prisma.module.ts                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.de> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:56:43 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/26 17:40:00 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports:  [PrismaService],
})
export class PrismaModule {}
