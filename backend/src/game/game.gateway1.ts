import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as nanoid from 'nanoid';

@WebSocketGateway()
export class PingPongGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  gameStateMap: Map<string, GameState> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client ${client.id} connected`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client ${client.id} disconnected`);
    const gameState = this.gameStateMap.get(client.room);
    if (gameState) {
      this.gameStateMap.delete(client.room);
      this.server.to(client.room).emit('gameState', gameState); // send last game state to the remaining player
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, playerName: string) {
    const rooms = this.server.sockets.adapter.rooms;
    let joinedRoom = false;
    let roomID: string;
    // check all rooms for one with less than 2 players
    for (let id of rooms.keys()) {
      const room = rooms.get(id);
      if (room.size < 2) {
        roomID = id;
        joinedRoom = true;
        break;
      }
    }
    // if all rooms have 2 players, create a new room
    if (!joinedRoom) {
      roomID = nanoid.nanoid();
    }
    client.join(roomID);
    console.log(`Player ${playerName} joined room ${roomID}`);
    const gameState = this.gameStateMap.get(roomID) || new GameState();
    gameState.addPlayer(playerName);
    this.gameStateMap.set(roomID, gameState);
    this.server.to(roomID).emit('gameState', gameState); // send initial game state to all players in the room
  }

  @SubscribeMessage('playerInput')
  handlePlayerInput(client: Socket, input: PlayerInput) {
    const gameState = this.gameStateMap.get(client.room);
    if (gameState) {
      gameState.updatePlayerInput(client.id, input);
      this.server.to(client.room).emit('gameState', gameState); // broadcast updated game state to all players in the room
    }
  }
}

class GameState {
  player1: Player;
  player2: Player;
  ballPosition: BallPosition;
  // other game data

  constructor() {
    this.ballPosition = new BallPosition();
  }

  addPlayer(playerName: string) {
    if (!this.player1) {
      this.player1 = new Player(playerName, 'left');
    } else {
      this.player2 = new Player(playerName, 'right');
    }
  }

  updatePlayerInput(playerID: string, input: PlayerInput) {
    const player = this.getPlayerByID(playerID);
    if (player) {
      player.updateInput(input);
      // update game state based on player input
    }
  }

  private getPlayerByID(playerID: string): Player | undefined {
    if (this.player1 && this.player1.id === playerID) {
      return this.player1;
    } else if (this.player2 && this.player2.id === playerID) {
      return this.player2;
    } else {
      return undefined;
    }
  }
}

class Player {
	id: string;
	name: string;
	side: 'left' | 'right';
	paddlePosition: number;
	input: PlayerInput;

	constructor(name: string, side: 'left' | 'right') {
	this.id = nanoid.nanoid();
	this.name = name;
	this.side = side;
	this.paddlePosition = 0;
	this.input = new PlayerInput();
	}

	updateInput(input: PlayerInput) {
	this.input = input;
	}
	}

	class BallPosition {
		x: number;
		y: number;

		constructor() {
			this.x = 0;
			this.y = 0;
		}
	}

	class PlayerInput {
	up: boolean;
	down: boolean;

	constructor() {
	this.up = false;
	this.down = false;
	}
}