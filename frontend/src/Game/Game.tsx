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
	
	const [gameState, setGameState] = useState<serverState>({
		ball: { x:(1280 / 2 - 15), y: (720 / 2) - 15},
		ballAngle: Math.random() * Math.PI * 2,
		ballSpeed: 12,
		leftPaddleY: 720 / 2 - 125,
		rightPaddleY: 720 / 2 - 125,
		scoreLeft: 0,
		scoreRight: 0,
		ready: false
	});
	const [localState, setLocalState] = useState({
		ball: {x: (1280 / 2 - 15), y: (720 / 2) - 15},
		ballAngle: Math.random() * Math.PI * 2,
		ballSpeed: 12,
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

		socket?.on('updateState', (state) => {setGameState(state);});
			const gameLoop = setInterval(() => {
				const newBallX = gameState.ball.x + Math.cos(gameState.ballAngle) * gameState.ballSpeed;
				const newBallY = gameState.ball.y + Math.sin(gameState.ballAngle) * gameState.ballSpeed;
			
				setLocalState(state => ({...state, ball: { x: newBallX, y: newBallY }}));
			
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
						// if (newBallX - ballPosition.x > newBallY - ballPosition.y &&
						// 	newBallX - ballPosition.x > ballPosition.y - newBallY) // check if it hit the top or bottom
						// 	setBallAngle(-ballAngle);
						// else // if it hit right or left
							setLocalState(state => ({...state, ballAngle: (Math.PI - gameState.ballAngle)}));
					}
	
					if (
						newBallX >= (1280 - 50 - 30) &&
						newBallY >= (rightPlayerBar.top - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 - 5)) &&
						newBallY <= (rightPlayerBar.bottom - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 + 5)) &&
						newBallX <= (1280 - 30 - 30)
					  ) {
						// if (ballPosition.x - newBallX > ballPosition.y - newBallY &&
						// 	ballPosition.x - newBallX > ballPosition.y - newBallY)
						// 	setBallAngle(-ballAngle);
						// else
						setLocalState(state => ({...state, ballAngle: (Math.PI - gameState.ballAngle)}));
					  }
				}
	
				if (newBallX < 0 || newBallX > 1280 - 30) {
					if (newBallX < 0)
						setLocalState(state => ({...state, ball: {x: (1280 / 2 - 15), y: (720 / 2) - 15},
							scoreRight: gameState.scoreRight + 1,
							ballAngle: (Math.random() * Math.PI * 2)}));
					else
					{
						setLocalState(state => ({...state, ball: {x: (1280 / 2 - 15), y: (720 / 2) - 15},
							scoreLeft: gameState.scoreLeft + 1,
							ballAngle: (Math.random() * Math.PI * 2)}));
					}
				}
		
				if (newBallY < 0 || newBallY > 720 - 30) {
					setLocalState(state => ({...state, ballAngle: -gameState.ballAngle}));
				}

				socket?.emit('move', localState);
			}, 1000 / 60);
			return () => clearInterval(gameLoop);
	  }, [localState, gameState, screenHeight, screenWidth, ready, socket]);

	const handleMouseMove = (event:any) => {
			if ((event.clientY - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 + 125) > 0) && (event.clientY - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 - 125) <= 720))
				setLocalState(state => ({...state, cursorY: event.clientY - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 + 125)}));
			socket?.emit('move', localState);
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
					{!ready && <button className='ready-btn' onClick={() => {setReady(true); setLocalState(state => ({...state, ready: true}));}}>READY</button>}
					<div className='score-left'>{gameState.scoreLeft}</div>
					<div className='score-right'>{gameState.scoreRight}</div>
					<div className='markup'/>
					<div className='markup-top'/>
					<div className='left-player' ref={leftPlayerRef} style={{ top: gameState.leftPaddleY }} />
					<div className='right-player' ref={rightPlayerRef} style={{ top: gameState.rightPaddleY }} />
					{ready && <div className='ball' style={{ left: localState.ball.x, top: localState.ball.y }}/>}
				</div>
			</div>
		</div>
	);
}

export default Game;