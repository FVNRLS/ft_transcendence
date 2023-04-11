import { useState, useRef, useEffect } from 'react';
import Header from '../Header/Header';
import io, {Socket} from 'socket.io-client';
import './Game.css';

interface serverState {
	ball: { x: number, y: number },
	ballAngle: number,
	ballSpeed: number,
	leftPaddleY: number,
	rightPaddleY: number,
	scoreLeft: number,
	scoreRight: number,
	ready: boolean
}

const Game = () => {

	const [ready, setReady] = useState(false);
	const [socket, setSocket] = useState<Socket | null>(null);
	
	const [ballPos, setBallPos] = useState({x:(1280 / 2 - 15), y: (720 / 2) - 15});
	const [ballAngle, setBallAngle] = useState(Math.random() * Math.PI * 2);
	const [cursorY, setCursorY] = useState(0);
	const [scoreLeft, setScoreLeft] = useState(0);
	const [scoreRight, setScoreRight] = useState(0);
	const [ended, setEnded] = useState(false);


	const [gameState, setGameState] = useState<serverState>({
		ball: { x:(1280 / 2 - 15), y: (720 / 2) - 15},
		ballAngle: Math.random() * Math.PI * 2,
		ballSpeed: 4,
		leftPaddleY: 720 / 2 - 125,
		rightPaddleY: 720 / 2 - 125,
		scoreLeft: 0,
		scoreRight: 0,
		ready: false
	});
	const [localState, setLocalState] = useState({
		ball: {x: (1280 / 2 - 15), y: (720 / 2) - 15},
		ballAngle: Math.random() * Math.PI * 2,
		ballSpeed: 4,
		cursorY: 0,
		scoreLeft: 0,
		scoreRight: 0,
		ready: false
	});

	const connectToSocket = () => {
		const newSocket = io("http://10.13.5.4:5005");
		setSocket(newSocket);
	};

	const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  	const [screenHeight, setScreenHeight] = useState(window.innerHeight);

	const leftPlayerRef = useRef(null);
	const rightPlayerRef = useRef(null);

  	useEffect(() => {
		const handleResize = () => {
		  setScreenWidth(window.innerWidth);
		  setScreenHeight(window.innerHeight);
		};
	
		window.addEventListener('resize', handleResize);
	
		return () => {
		  window.removeEventListener('resize', handleResize);
		};
	}, []);

	useEffect(() => {
		socket?.emit('move', localState);
		socket?.on('updateState', (state) => setGameState(state));
	
		return () => {
		  socket?.off('updateState');
		};
	  }, [gameState, localState, socket]);

	useEffect(() => {
		setLocalState(state => ({...state,
			ball: ballPos,
			ballAngle: ballAngle,
			cursorY: cursorY,
			scoreLeft: scoreLeft,
			scoreRight: scoreRight}));
	}, [ballPos, ballAngle, scoreLeft, scoreRight, cursorY])
	
	useEffect(() => {
		if (gameState.scoreLeft < 10 && gameState.scoreRight < 10)
		{
			// const gameLoop = setInterval(() => {
				const newBallX = gameState.ball.x + Math.cos(gameState.ballAngle) * gameState.ballSpeed;
				const newBallY = gameState.ball.y + Math.sin(gameState.ballAngle) * gameState.ballSpeed;
	
				setBallPos({ x: newBallX, y: newBallY });
				
				const leftPlayer = leftPlayerRef.current;
				const rightPlayer = rightPlayerRef.current;
		
				if (leftPlayer && rightPlayer)
				{
					const leftPlayerBar = (leftPlayer as HTMLElement).getBoundingClientRect();
					const rightPlayerBar = (rightPlayer as HTMLElement).getBoundingClientRect();
	
					if (
						(
						newBallX <= (50) &&
						newBallY >= (leftPlayerBar.top - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 - 5)) &&
						newBallY <= (leftPlayerBar.bottom - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 + 5)) &&
						newBallX >= (30)
						)
					) {
						// if (newBallX - gameState.ball.x > newBallY - gameState.ball.y &&
						// 	newBallX - gameState.ball.x > gameState.ball.y - newBallY) // check if it hit the top or bottom
						// 	setBallAngle(-gameState.ballAngle);
						// else // if it hit right or left
						setBallAngle(Math.PI - gameState.ballAngle);
					}
		
					if (
						newBallX >= (1280 - 50 - 30) &&
						newBallY >= (rightPlayerBar.top - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 - 5)) &&
						newBallY <= (rightPlayerBar.bottom - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 + 5)) &&
						newBallX <= (1280 - 30 - 30)
					  ) {
						// if (gameState.ball.x - newBallX > gameState.ball.y - newBallY &&
						// 	gameState.ball.x - newBallX > gameState.ball.y - newBallY)
						// 	setBallAngle(-gameState.ballAngle);
						// else
						setBallAngle(Math.PI - gameState.ballAngle);
					  }
				}
		
				if (newBallX < 0 || newBallX > 1280 - 30) {
					if (newBallX < 0) {
						setBallPos({x: (1280 / 2 - 15), y: (720 / 2) - 15});
						setBallAngle(Math.random() * Math.PI * 2);
						setScoreRight(gameState.scoreRight + 1);
					}
					else
					{
						setBallPos({x: (1280 / 2 - 15), y: (720 / 2) - 15});
						setBallAngle(Math.random() * Math.PI * 2);
						setScoreLeft(gameState.scoreLeft + 1);
					}
				}
			
				if (newBallY < 0 || newBallY > 720 - 30) {
					setBallAngle(-gameState.ballAngle);
				}
				// socket?.emit('move', localState);
			// }, 1000/120);
	
			// return () => {clearInterval(gameLoop);};
		}
		else
			setEnded(true);
	}, [gameState, screenHeight,
		screenWidth, ready]);

	const handleMouseMove = (event:any) => {
			if ((event.clientY - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 + 125) > 0) && (event.clientY - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 - 125) <= 720))
				setCursorY(event.clientY - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 + 125));
			// socket?.emit('move', localState);
	};

	const bgStyle = {
		opacity: ready ? '100%' : '60%'
	}

	return (
		<div>
			<Header />
			<div className='container' onMouseMove={handleMouseMove}>
				{!socket && <button onClick={connectToSocket}>CONNECT</button>}
				<div className='game-bg' style={bgStyle}>
					{ended && <div className='end'>Match ended<br />{scoreLeft} | {scoreRight}</div>}
					{!ready && <button className='ready-btn' onClick={() => {setReady(true); setLocalState(state => ({...state, ready: true}));}}>READY</button>}
					{!ended && <div className='score-left'>{gameState.scoreLeft}</div>}
					{!ended && <div className='score-right'>{gameState.scoreRight}</div>}
					{!ended && <div className='markup'/>}
					{!ended && <div className='markup-top'/>}
					{!ended && <div className='left-player' ref={leftPlayerRef} style={{ top: gameState.leftPaddleY }} />}
					{!ended && <div className='right-player' ref={rightPlayerRef} style={{ top: gameState.rightPaddleY }} />}
					{ready && !ended && <div className='ball' style={{ left: gameState.ball.x, top: gameState.ball.y }}/>}
				</div>
			</div>
		</div>
	);
}

export default Game;