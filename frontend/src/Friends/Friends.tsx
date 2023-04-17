import Header from "../Header/Header";
import { useState } from 'react';
import './Friends.css'

const Friends = () => {

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