import React from 'react';
import "./Header.css";

function Header() {
	const name = 'test';
	return (
		<header className='header'>
			<ul className='header-list'>
				<li className='list-item'>{name}</li>
				<li className='list-item'>test2</li>
				<li className='list-item'>test3</li>
				<li className='list-item'>test4</li>
				<li className='list-item'>test5</li>
				<li className='list-item'>test6</li>
			</ul>
		</header>
	);
}

export default Header;