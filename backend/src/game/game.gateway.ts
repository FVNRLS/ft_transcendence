import { WebSocketGateway, WebSocketServer} from '@nestjs/websockets'
import { stat } from 'fs';
import { Server, Socket } from 'socket.io';

interface Player {
	id: string;
	ready: boolean;
}

interface initialState {
	ball: { x: number, y: number },
	ballAngle: number,
	ballSpeed: number,
	cursorY: number,
	scoreLeft: number,
	scoreRight: number,
	ready: boolean
}

@WebSocketGateway(5005, { cors: "*" })
export class GameGateway {
	@WebSocketServer()
	server: Server;

	private player1: Player;
  	private player2: Player;
	
	private gameState = {
		ball: { x:(1280 / 2 - 15), y: (720 / 2) - 15},
		ballAngle: Math.random() * Math.PI * 2,
		ballSpeed: 12,
		leftPaddleY: 720 / 2 - 125,
		rightPaddleY: 720 / 2 - 125,
		scoreLeft: 0,
		scoreRight: 0,
		ready: false
	};

	handleConnection(client: Socket) {
		client.join('test');

		if (!this.player1) {
			this.player1 = { id: client.id, ready: false };
			console.log(`Player 1: ${this.player1.id}`);
		} else if (!this.player2) {
			this.player2 = { id: client.id, ready: false };
			console.log(`Player 2: ${this.player2.id}`);
		}

		client.on('move', (state: initialState) => {
			if (this.player1 && client.id == this.player1.id) {
				this.gameState.leftPaddleY = state.cursorY;
				if (state.ready == true)
					this.player1.ready = true;
			} else if (this.player2 && client.id == this.player2.id) {
				this.gameState.rightPaddleY = state.cursorY;
				if (state.ready == true)
					this.player2.ready = true;
			}

			if (this.player1 && this.player1.ready == true
				&& this.player2 && this.player2.ready == true
				&& this.player1.id == client.id)
			{
				this.gameState.ready = true;
				this.gameState.ball.x = state.ball.x;
				this.gameState.ball.y = state.ball.y;
				this.gameState.ballAngle = state.ballAngle;
				this.gameState.ballSpeed = state.ballSpeed;
				this.gameState.scoreLeft = state.scoreLeft;
				this.gameState.scoreRight = state.scoreRight;
			}
			if (this.gameState.ready)
				this.server.to('test').emit('updateState', this.gameState);
		});
	}

	handleDisconnect(client: Socket) {
		if (this.player1 && this.player1.id === client.id) {
		  this.player1 = null;
		}
		if (this.player2 && this.player2.id === client.id) {
		  this.player2 = null;
		}
	}
}