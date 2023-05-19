import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import "./Header.css";

function Header() {
	const scoreLeft = 0;
	const scoreRight = 0;

	const [isOn, setIsOn] = useState(false);
	const [btnColor, setBtnColor] = useState('rgba(128, 128, 128, 0.5)');

	const handleSwitch = () => {
		if (isOn)
		{
			setBtnColor('rgba(128, 128, 128, 0.5)');
			setIsOn(false);
		}
		else
		{
			setBtnColor('#476cd2');
			setIsOn(true);
		}
	}

	const btnStyle = { color: btnColor, borderColor: btnColor};
	return (
		<header className='header'>
			<ul className='header-list'>
				<li className='list-item'>
					<Link className="dashboard-btn" to='/dashboard'>Dashboard</Link>
				</li>
				<li className='list-item' >Last Match: {scoreLeft} | {scoreRight}</li>
				<li className='list-item' >No messages</li>
				<li className='list-item' >
					<button style={btnStyle} className='tfa-btn' onClick={handleSwitch}>TFA</button>
				</li>
				<li className='list-item'>
					<Link className="link-btn" to='/profile'>Edit Profile</Link>
				</li>
			</ul>
		</header>
	);
}

export default Header;