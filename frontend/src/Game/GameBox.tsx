import React, { useState, useRef, useEffect } from 'react';
import './Game.css';

const GameBox = () => {

	const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  	const [screenHeight, setScreenHeight] = useState(window.innerHeight);

	const [scoreLeft, setScoreLeft] = useState(0);
	const [scoreRight, setScoreRight] = useState(0);

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

	const [cursorPositionY, setCursorPositionY] = useState(0);
	const [ballPosition, setBallPosition] = useState({ x: (1280 / 2 - 15), y: (720 / 2) - 15});
  	const [ballAngle, setBallAngle] = useState(Math.random() * Math.PI * 2);

	const ballSpeed = 15;

	useEffect(() => {
		const gameLoop = setInterval(() => {
			const newBallX = ballPosition.x + Math.cos(ballAngle) * ballSpeed;
			const newBallY = ballPosition.y + Math.sin(ballAngle) * ballSpeed;
		
			setBallPosition({ x: newBallX, y: newBallY });
		
			const leftPlayer = leftPlayerRef.current;
			const rightPlayer = rightPlayerRef.current;

			if (leftPlayer && rightPlayer)
			{
				const leftPlayerBar = (leftPlayer as HTMLElement).getBoundingClientRect();
				const rightPlayerBar = (rightPlayer as HTMLElement).getBoundingClientRect();

				console.log(leftPlayerBar.bottom);
				if (
					(
					newBallX <= (50) &&
					newBallY >= (leftPlayerBar.top - 236) &&
					newBallY <= (leftPlayerBar.bottom - 205) &&
					newBallX >= (30)
					)
				) {
					// if (newBallX - ballPosition.x > newBallY - ballPosition.y &&
					// 	newBallX - ballPosition.x > ballPosition.y - newBallY) // check if it hit the top or bottom
					// 	setBallAngle(-ballAngle);
					// else // if it hit right or left
						setBallAngle(Math.PI - ballAngle);
				}

				if (
					newBallX >= (1280 - 50 - 30) &&
					newBallY >= (rightPlayerBar.top - 236) &&
					newBallY <= (rightPlayerBar.bottom - 205) &&
					newBallX <= (1280 - 30 - 30)
				  ) {
					// if (ballPosition.x - newBallX > ballPosition.y - newBallY &&
					// 	ballPosition.x - newBallX > ballPosition.y - newBallY)
					// 	setBallAngle(-ballAngle);
					// else
						setBallAngle(Math.PI - ballAngle);
				  }
			}

			if (newBallX < 0 || newBallX > 1280 - 30) {
				if (newBallX < 0)
					setScoreRight(scoreRight + 1);
				else
					setScoreLeft(scoreLeft + 1);
				setBallPosition({ x: (1280 / 2 - 15), y: (720 / 2) - 15});
				setBallAngle(Math.random() * Math.PI * 2);
			}
	
			if (newBallY < 0 || newBallY > 720 - 30) {
				setBallAngle(-ballAngle);
			}
		}, 1000 / 60);
	
		return () => clearInterval(gameLoop);
	  }, [ballPosition, ballAngle, screenHeight, screenWidth]);

	const handleMouseMove = (event:any) => {
		if ((event.clientY - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 + 125) > 0) && (event.clientY - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 - 125) <= 720))
			setCursorPositionY(event.clientY - (screenHeight * 0.1 + (screenHeight * 0.9 - 720) / 2 + 125));
	};

	return (
		<div className='container' onMouseMove={handleMouseMove}>
			<div className='game-bg'>
				<div className='score-left'>{scoreLeft}</div>
				<div className='score-right'>{scoreRight}</div>
				<div className='markup'/>
				<div className='markup-top'/>
				<div className='left-player' ref={leftPlayerRef} style={{ top: cursorPositionY }} />
				<div className='right-player' ref={rightPlayerRef}/>
				<div className='ball' style={{ left: ballPosition.x, top: ballPosition.y }}/>
			</div>
		</div>
	);
}

export default GameBox;