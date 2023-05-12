/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   app.controller.ts                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.de> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/24 13:56:16 by rmazurit          #+#    #+#             */
/*   Updated: 2023/04/26 17:39:55 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
    @Get()
    getHello(): string {
        return "ZAEBIS RABOTAET";
    }
}