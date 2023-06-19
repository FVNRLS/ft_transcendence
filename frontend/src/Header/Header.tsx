import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import "./Header.css";
import axios from 'axios';

function Header() {
	const cookie = Cookies.get('session');
	const app_ip = process.env.REACT_APP_IP;
	const navigate = useNavigate();

	const [btnColor, setBtnColor] = useState('rgba(128, 128, 128, 0.5)');
	const [lastScore, setLastScore] = useState('');
	const [gotScore, setGotScore] = useState(false);
	const TFAcookie = Cookies.get('TFA');

	useEffect(() => {
		
		const getLastScore = async () => {
			try
			{
				const response = await axios.post(`http://${app_ip}:5000/game/get_personal_scores`, {cookie});
				const array = response.data;
				setLastScore(array[0].score);
				setGotScore(true);
			}
			catch (error)
			{
				console.log(error);
			}
		}

		if (cookie && !gotScore)
			getLastScore();
	})

	useEffect(() => {
		if (TFAcookie)
			setBtnColor('#476cd2');
		else
			setBtnColor('rgba(128, 128, 128, 0.5)');
			
	}, [TFAcookie])

	const handleSwitch = async () => {
		try
		{
			await axios.post(`http://${app_ip}:5000/security/change_tfa`, {cookie});
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

	const handleLogOut = async () => {
		try {
			await axios.post(`http://${app_ip}:5000/auth/set_status`, {cookie, status: 'offline'});
			const response = await axios.post(`http://${app_ip}:5000/auth/logout`, {cookie});
			if (response.data.status === 200)
			{
				Cookies.remove('session');
				navigate('/');
			}
		} catch (error) {
			console.error(error);
		}
	}
	
	return (
		<header className='header'>
			<ul className='header-list'>
				<li className='list-item'>
					<Link className="dashboard-btn" to='/dashboard'>Dashboard</Link>
				</li>
				<li className='list-item stats' onClick={() => {navigate('/stats')}} >Last Match: {lastScore}</li>
				<li className='list-item stats' onClick={() => {navigate('/chat')}} >No messages</li>
				<li className='list-item' >
					<button style={btnStyle} className='tfa-btn' onClick={handleSwitch}>TFA</button>
				</li>
				<li className='list-item'>
					<button className='logout-btn' onClick={handleLogOut}>Log out</button>
				</li>
			</ul>
		</header>
	);
}

export default Header;