import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRocket, faSprayCan, faEye, faRotateRight } from '@fortawesome/free-solid-svg-icons'
import Header from '../Header/Header';
import io, {Socket} from 'socket.io-client';
import './Game.css';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

interface serverState {
	ball: { x: number, y: number },
	ballAngle: number,
	ballSpeed: number,
	paddles: number[];
	scores: number[];
	invisibility: boolean,
	bgColor: string,
	ready: boolean
}

const Game = () => {

	const session = Cookies.get('session');
	const app_ip = process.env.REACT_APP_IP;

	const navigate = useNavigate();

	useEffect(() => {
		if (!session)
		navigate('/not-logged');
	}, [navigate, session]);


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
		paddles: [720 / 2 - 125, 720 / 2 - 125],
		scores: [0, 0],
		invisibility: false,
		bgColor: bgColor,
		ready: false
	});
	const [localState, setLocalState] = useState({
		ball: {x: (1280 / 2 - 15), y: (720 / 2) - 15},
		ballAngle: Math.random() * Math.PI * 2,
		ballSpeed: 3,
		cursorY: 0,
		scores: [0, 0],
		ready: false,
		invisibility: false,
		bgColor: bgColor
	});

	const connectToSocket = () => {
		const newSocket = io(`http://${app_ip}:5005`, { transports: ['websocket'],
		extraHeaders: {
		  'Cookie': `session=${session}`
		}});
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
			scores: [scoreLeft, scoreRight],
			bgColor: bgColor,
			invisibility: invisibility,
			ballSpeed: ballSpeed}));

	}, [ballPos, ballAngle, scoreLeft, scoreRight, cursorY, ballSpeed, bgColor, invisibility])
	
  useEffect(() => {
		if (gameState.scores[0] < 10 && gameState.scores[1] < 10)
		{
			setEnded(false);
			const newBallX = gameState.ball.x + Math.cos(gameState.ballAngle) * gameState.ballSpeed;
			const newBallY = gameState.ball.y + -Math.sin(gameState.ballAngle) * gameState.ballSpeed;

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
					const relY = leftPlayerBar.top + 125 - gameState.ball.y;
					const normalizedY = relY / 125;
					const bounceAngle = normalizedY * (5 * Math.PI / 12);
					setBallAngle(bounceAngle);
				}
	
				if (
					newBallX >= (1280 - 50 - 30) &&
					newBallY >= (rightPlayerBar.top - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 + 5)) &&
					newBallY <= (rightPlayerBar.bottom - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2)) &&
					newBallX < (1280 - 30)
				  ) {
					const relY = rightPlayerBar.top + 125 - gameState.ball.y;
					const normalizedY = relY / 125;
					const bounceAngle = normalizedY * (5 * Math.PI / 12);
					setBallAngle(bounceAngle);
				}
			}
	
			if (newBallY < 0 || newBallY > 720 - 30) {
				setBallAngle(-gameState.ballAngle);
			}
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

	<canvas id="myCanvas" width="200" height="100" style="border:1px solid #000000;">
	</canvas>
	
	return (
		<div>
			<Header />

			<div className='container' onMouseMove={handleMouseMove}>
				{!socket && <button className='connect-btn' onClick={connectToSocket}>Connect</button>}
				{!ready && socket && <button className='connect-btn' onClick={() => {setReady(true); setLocalState(state => ({...state, ready: true}));}}>READY</button>}
				<div className='game-bg' style={{opacity: bgStyle.opacity, background: gameState.bgColor}}>
					{ended && <div className='end'>Match ended<br />{gameState.scores[0]} | {gameState.scores[1]}</div>}
					{!ended && <div className='score-left'>{gameState.scores[0]}</div>}
					{!ended && <div className='score-right'>{gameState.scores[1]}</div>}
					{!ended && <div className='markup'/>}
					{!ended && <div className='markup-top'/>}
					{!ended && <div className='left-player' ref={leftPlayerRef} style={{ top: gameState.paddles[0] }} />}
					{!ended && <div className='right-player' ref={rightPlayerRef} style={{ top: gameState.paddles[1] }} />}
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
