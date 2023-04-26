/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   prisma.service.ts                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:56:54 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/26 17:39:28 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { PrismaClient } from "@prisma/client";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    const url = config.get<string>("DATABASE_URL");
    if (!url) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
  
    super({
      datasources: {
        db: {
          url,
        },
      },
    });
  }
  
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === "production") return;

    // teardown logic
    return Promise.all([this.user.deleteMany()]);
  }
}