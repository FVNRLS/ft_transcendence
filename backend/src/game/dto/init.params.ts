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