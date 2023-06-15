import { Injectable } from "@nestjs/common";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { InitialState, Player } from "./dto/init.params";

@Injectable()
@WebSocketGateway(5005, { cors: "*" })
export class GameGateway {

  @WebSocketServer()
  server: Server;

  private rooms: { [roomId: string]: Room } = {};

  async handleConnection(client: Socket) {
    let joinedRoomId: string | null = null;
	const roomId = uuidv4();

    // Find a room with an available slot
    for (const roomId in this.rooms) {
      const room = this.rooms[roomId];
	//   console.log(room.players, roomId);
      if (room.players.length < 2) {
        joinedRoomId = roomId;
        break;
      }
    }

    // If no available room, create a new one
    if (!joinedRoomId) {
      const room: Room = {
        roomId,
        players: [],
        gameState: {
          ball: { x: 1280 / 2 - 15, y: 720 / 2 - 15 },
          ballAngle: Math.random() * Math.PI * 2,
          ballSpeed: 3,
          paddles: [0, 0],
          scores: [0, 0],
          bgColor: "linear-gradient(315deg, rgba(60,132,206,1) 38%, rgba(255,25,25,1) 98%)",
          invisibility: false,
          ready: false,
        },
      };
      this.rooms[roomId] = room;
      joinedRoomId = roomId;
    }

    const room = this.rooms[joinedRoomId];

    const player: Player = { id: client.id, ready: false };
    room.players.push(player);
	const playerIndex = room.players.findIndex((p) => p.id === client.id);
    room.gameState.paddles[playerIndex] = (720 / 2 - 125);
    room.gameState.scores[playerIndex] = 0;

    client.join(room.roomId);

    client.on("move", (state: InitialState) => {
      const playerIndex = room.players.findIndex((p) => p.id === client.id);
      if (playerIndex === -1) return;

      room.gameState.paddles[playerIndex] = state.cursorY;
      if (state.ready) room.players[playerIndex].ready = true;

      const allReady = room.players.every((p) => p.ready);
	//   console.log(room.players.length);
      if (allReady && room.players.length === 2 && playerIndex === 0) {
        room.gameState.ready = true;
        room.gameState.ball = state.ball;
		room.gameState.scores = state.scores;
        room.gameState.ballAngle = state.ballAngle;
        room.gameState.ballSpeed = state.ballSpeed;
        room.gameState.bgColor = state.bgColor;
        room.gameState.invisibility = state.invisibility;
      }

      this.server.to(room.roomId).emit("updateState", room.gameState);
    });
  }

  async handleDisconnect(client: Socket) {
    for (const roomId in this.rooms) {
      const room = this.rooms[roomId];
      const playerIndex = room.players.findIndex((p) => p.id === client.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        // room.gameState.paddles.splice(playerIndex, 1);
        // room.gameState.scores.splice(playerIndex, 1);

        if (room.players.length === 0) {
          delete this.rooms[roomId];
        } else {
          this.server.to(room.roomId).emit("playerDisconnected", { playerIndex });
        }
        break;
      }
    }
  }
}

interface Room {
  roomId: string;
  players: Player[];
  gameState: GameState;
}

interface GameState {
  ball: { x: number; y: number };
  ballAngle: number;
  ballSpeed: number;
  paddles: number[];
  scores: number[];
  bgColor: string;
  invisibility: boolean;
  ready: boolean;
}
