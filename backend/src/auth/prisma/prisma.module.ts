/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   prisma.module.ts                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:57:02 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/26 17:39:23 by rmazurit         ###   ########.fr       */
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
