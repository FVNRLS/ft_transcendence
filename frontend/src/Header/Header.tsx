import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import "./Header.css";
import axios from 'axios';

function Header() {
	const scoreLeft = 0;
	const scoreRight = 0;

	const [btnColor, setBtnColor] = useState('rgba(128, 128, 128, 0.5)');
	const TFAcookie = Cookies.get('TFA');

	useEffect(() => {
		if (TFAcookie)
			setBtnColor('#476cd2');
		else
			setBtnColor('rgba(128, 128, 128, 0.5)');
			
	}, [TFAcookie])

	const handleSwitch = async () => {
		try
		{
			await axios.post("http://localhost:5000/security/change_tfa", {cookie: Cookies.get('session')});
		} catch (error) {
			console.log(error);
		}
		if (TFAcookie)
		{
			setBtnColor('rgba(128, 128, 128, 0.5)');
			Cookies.remove('TFA');
		}
		else
		{
			setBtnColor('#476cd2');
			Cookies.set('TFA', 'true', {expires: 1 / 24 * 3});
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