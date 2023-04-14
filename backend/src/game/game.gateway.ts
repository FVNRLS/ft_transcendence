import { WebSocketGateway, WebSocketServer} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

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
	bgColor: string,
	invisibility: boolean,
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
		ballSpeed: 3,
		leftPaddleY: 720 / 2 - 125,
		rightPaddleY: 720 / 2 - 125,
		scoreLeft: 0,
		scoreRight: 0,
		bgColor: 'linear-gradient(315deg, rgba(60,132,206,1) 38%, rgba(255,25,25,1) 98%)',
		invisibility: false,
		ready: false
	};

	private roomId = uuidv4;

	handleConnection(client: Socket) {
		client.join(this.roomId);

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
				this.gameState.scoreLeft = state.scoreLeft;
				this.gameState.scoreRight = state.scoreRight;
				this.gameState.ballSpeed = state.ballSpeed;
				this.gameState.bgColor = state.bgColor;
				this.gameState.invisibility = state.invisibility;
			}
			this.server.to(this.roomId).emit('updateState', this.gameState);
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