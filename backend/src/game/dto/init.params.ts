/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   init.params.ts                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jtsizik <jtsizik@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/05/11 18:14:48 by rmazurit          #+#    #+#             */
/*   Updated: 2023/06/15 16:22:13 by jtsizik          ###   ########.fr       */
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
	scores: number[],
	bgColor: string,
	invisibility: boolean,
	ready: boolean
}