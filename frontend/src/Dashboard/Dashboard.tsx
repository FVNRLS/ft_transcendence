import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserGroup, faUser, faComments, faMagnifyingGlass, faTableTennisPaddleBall } from '@fortawesome/free-solid-svg-icons'
import Header from "../Header/Header";
import axios from 'axios';
import './Dashboard.css'
import Cookies from 'js-cookie';

const Dashboard = () => {

	const cookie = Cookies.get('session');
	const navigate = useNavigate();

	const [username, setUsername] = useState('');

	useEffect(() => {

		const getUsername = async () => {
			try {
				const response = await axios.post('http://localhost:5000/auth/get_data', { cookie });
				setUsername(response.data.username);
			} catch (error) {
				console.log(error);
			}
		}

		if (!cookie)
			navigate('/not-logged');
		else
			getUsername();
	}, [navigate, cookie]);

	return (
		<div className="bg">
			<Header />
			<div className="dashboard-cont">
				{/* <div className='nickname-cont'>
					<h1>{username}</h1>
				</div> */}
				<section className='user-sec'>
					<div className='side-sec' onClick={() => {navigate('/search');}}>
						<FontAwesomeIcon className="icon" icon={faMagnifyingGlass} size="4x" color='#476cd2c9'/>
						<h1>People</h1>
					</div>
					<div className='side-sec' onClick={() => {navigate('/friends');}}>
						<FontAwesomeIcon className="icon" icon={faUserGroup} size="4x" color='#476cd2c9'/>
						<h1>Friends</h1>
					</div>
					<div className='side-sec-play' onClick={() => {navigate('/game');}}>
						<FontAwesomeIcon className="icon" icon={faTableTennisPaddleBall} size="8x" color='#6B40DEC9'/>
						<h1>Play</h1>
					</div>
					<div className='side-sec' onClick={() => {navigate('/profile');}}>
						<FontAwesomeIcon className="icon" icon={faUser} size="4x" color='#476cd2c9'/>
						<h1>Profile</h1>
					</div>
					<div className='side-sec' onClick={() => {navigate('/chat');}}>
						<FontAwesomeIcon className="icon" icon={faComments} size="4x" color='#476cd2c9'/>
						<h1>Chat</h1>
					</div>
				</section>
			</div>
		</div>
	);
};

export default Dashboard;