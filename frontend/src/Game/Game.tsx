import React, { useState } from 'react';
import GameBox from './GameBox';
import Header from '../Header/Header';
import './Game.css';

const Game = () => {
	const [ready, setReady] = useState(false);

	const handleReadyBtn = () => {
		setReady(true);
	};

	return (
		<div >
		<Header />
		{!ready ? (
			<div className='not-ready-bg'>
				<button onClick={handleReadyBtn} className='ready-btn'>READY</button>
			</div>
		  ) : (<GameBox />)}
		</div>
	);
}

export default Game;