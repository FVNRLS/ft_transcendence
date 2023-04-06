import React from 'react';
import { Link } from 'react-router-dom';
import "./Header.css";

function Header() {
	const scoreLeft = 0;
	const scoreRight = 0;
	return (
		<header className='header'>
			<ul className='header-list'>
				<li className='list-item'>
					<Link className="dashboard-btn" to='/dashboard'>Dashboard</Link>
				</li>
				<li className='list-item' >Last Match: {scoreLeft} | {scoreRight}</li>
				<li className='list-item' >No messages</li>
				<li className='list-item'>
					<Link className="link-btn" to='/profile'>Edit Profile</Link>
				</li>
			</ul>
		</header>
	);
}

export default Header;