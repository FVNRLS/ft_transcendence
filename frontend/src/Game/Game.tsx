import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRocket, faSprayCan, faEye, faRotateRight } from '@fortawesome/free-solid-svg-icons'
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
	invisibility: boolean,
	bgColor: string,
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
	const [ballSpeed, setBallSpeed] = useState(3);

	const [bgColor, setBgColor] = useState('linear-gradient(315deg, rgba(60,132,206,1) 38%, rgba(255,25,25,1) 98%)');
	const [invisibility, setInvisibility] = useState(false);


	const [gameState, setGameState] = useState<serverState>({
		ball: { x:(1280 / 2 - 15), y: (720 / 2) - 15},
		ballAngle: Math.random() * Math.PI * 2,
		ballSpeed: 3,
		leftPaddleY: 720 / 2 - 125,
		rightPaddleY: 720 / 2 - 125,
		scoreLeft: 0,
		scoreRight: 0,
		invisibility: false,
		bgColor: bgColor,
		ready: false
	});
	const [localState, setLocalState] = useState({
		ball: {x: (1280 / 2 - 15), y: (720 / 2) - 15},
		ballAngle: Math.random() * Math.PI * 2,
		ballSpeed: 3,
		cursorY: 0,
		scoreLeft: 0,
		scoreRight: 0,
		ready: false,
		invisibility: false,
		bgColor: bgColor
	});

	const connectToSocket = () => {
		const newSocket = io("http://10.13.5.5:5005");
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
			scoreRight: scoreRight,
			bgColor: bgColor,
			invisibility: invisibility,
			ballSpeed: ballSpeed}));

	}, [ballPos, ballAngle, scoreLeft, scoreRight, cursorY, ballSpeed, bgColor, invisibility])
	
	useEffect(() => {
		if (gameState.scoreLeft < 10 && gameState.scoreRight < 10)
		{
				const newBallX = gameState.ball.x + Math.cos(gameState.ballAngle) * gameState.ballSpeed;
				const newBallY = gameState.ball.y + Math.sin(gameState.ballAngle) * -gameState.ballSpeed;
	
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
						newBallY >= (leftPlayerBar.top - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 + 5)) &&
						newBallY <= (leftPlayerBar.bottom - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2)) &&
						newBallX > (0)
						)
					) {
						const distX = newBallX + 15 - 40;
						const distY = newBallY + 15 - (leftPlayerBar.top - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 - 125));
						const dist = Math.sqrt(distX ** 2 + distY ** 2);
						const angleDiff = dist * (Math.PI / 4);
						setBallAngle(Math.PI / 4 + angleDiff); // DOESN'T WORK PROPERLY
					}
		
					if (
						newBallX >= (1280 - 50 - 30) &&
						newBallY >= (rightPlayerBar.top - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 + 5)) &&
						newBallY <= (rightPlayerBar.bottom - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2)) &&
						newBallX < (1280 - 30)
					  ) {
						const distX = newBallX + 15 - 1280 - 40;
						const distY = newBallY + 15 - (rightPlayerBar.top - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 - 125));
						const dist = Math.sqrt(distX ** 2 + distY ** 2);
						const angleDiff = dist * (Math.PI / 4);
						setBallAngle(Math.PI / 4 + angleDiff); // DOESN'T WORK PROPERLY
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

	const handleSpeed = () => {
		if (gameState.ballSpeed === 3)
			setBallSpeed(9);
		else
			setBallSpeed(3);
	};

	const respawnBall = () => {
		setBallPos({x: (1280 / 2 - 15), y: (720 / 2) - 15});
		setBallAngle(Math.random() * Math.PI * 2);
	}

	const changeBg = () => {
		if (bgColor === 'linear-gradient(315deg, rgba(60,132,206,1) 38%, rgba(255,25,25,1) 98%)')
			setBgColor('linear-gradient(120deg, #f6d365 0%, #fda085 100%)');
		else if (bgColor === 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)')
			setBgColor('linear-gradient(to right, #1d4350, #a43931)');
		else
			setBgColor('linear-gradient(315deg, rgba(60,132,206,1) 38%, rgba(255,25,25,1) 98%)');
	}

	const bgStyle = {
		opacity: ready ? '100%' : '60%'
	}

	const setInvis = () => {
		if (gameState.invisibility === true)
			setInvisibility(false);
		else
			setInvisibility(true);
	}
	
	const ballClasses = gameState.invisibility ? 'ball invis' : 'ball';

	return (
		<div>
			<Header />
			<div className='container' onMouseMove={handleMouseMove}>
				{!socket && <button className='connect-btn' onClick={connectToSocket}>Connect</button>}
				{!ready && socket && <button className='connect-btn' onClick={() => {setReady(true); setLocalState(state => ({...state, ready: true}));}}>READY</button>}
				<div className='game-bg' style={{opacity: bgStyle.opacity, background: gameState.bgColor}}>
					{ended && <div className='end'>Match ended<br />{scoreLeft} | {scoreRight}</div>}
					{!ended && <div className='score-left'>{gameState.scoreLeft}</div>}
					{!ended && <div className='score-right'>{gameState.scoreRight}</div>}
					{!ended && <div className='markup'/>}
					{!ended && <div className='markup-top'/>}
					{!ended && <div className='left-player' ref={leftPlayerRef} style={{ top: gameState.leftPaddleY }} />}
					{!ended && <div className='right-player' ref={rightPlayerRef} style={{ top: gameState.rightPaddleY }} />}
					{ready && !ended && <div className={ballClasses} style={{ left: gameState.ball.x, top: gameState.ball.y }}/>}
				</div>
				<div className='powerup-cont'>
					<FontAwesomeIcon className="pup" onClick={handleSpeed} icon={faRocket} size="4x" color='white'/>
					<FontAwesomeIcon className="pup" onClick={changeBg} icon={faSprayCan} size="4x" color='white'/>
					<FontAwesomeIcon className="pup" onClick={setInvis} icon={faEye} size="4x" color='white'/>
					<FontAwesomeIcon className="pup" onClick={respawnBall} icon={faRotateRight} size="4x" color='white'/>
				</div>
			</div>
		</div>
	);
}

export default Game;