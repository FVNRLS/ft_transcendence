import Header from "../Header/Header";
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import './Friends.css'

const Friends = () => {

	const session = Cookies.get('session');

	const navigate = useNavigate();

	useEffect(() => {
		if (!session)
		navigate('/not-logged');
	}, [navigate, session]);


	const [inputVal, setInputVal] = useState('');

	return (
		<>
		<Header />
			<div className="bg">
				<input className='search-input' placeholder='Find friends...' onChange={(event) => setInputVal(event.target.value)}/>
				{inputVal && 
					<div className="results-cont">
						<div className="spinner"/>
					</div>
				}
			</div>
		</>
	);
}

export default Friends;