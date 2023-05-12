/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   init.params.ts                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rmazurit <rmazurit@student.42heilbronn.de> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/11 18:14:48 by rmazurit          #+#    #+#             */
/*   Updated: 2023/05/11 18:15:19 by rmazurit         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */



export interface Player {
	id: string;
	ready: boolean;
}

export interface InitialState {
	ball: { x: number, y: number },
	ballAngle: number,
	ballSpeed: number,
	cursorY: number,
	scoreLeft: number,
	scoreRight: number,
	bgColor: string,
	invisibility: boolean,
	ready: boolean
}