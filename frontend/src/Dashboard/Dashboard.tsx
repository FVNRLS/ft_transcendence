import { Link } from 'react-router-dom';
import { useContext } from 'react';
import Header from "../Header/Header";
import { AuthContext } from '../Auth/AuthContext';
import './Dashboard.css'

const Dashboard = (props:any) => {

	const {isLoggedIn} = useContext(AuthContext);
	console.log(isLoggedIn);

	return (
		<div className="bg">
			<Header />
			<div className="dashboard-cont">
				<section>
					<section>
						<h1>Play game!</h1>
						<Link className="link-btn" to='/game'>Start</Link>
					</section>
					<section>
						<h1>See game statistics...</h1>
						<Link className="link-btn" to='/game'>Open</Link>
					</section>
				</section>
				<div className="line"/>
				<section>
					<section>
						<h1>Find Friends</h1>
						<Link className="link-btn" to='/chat'>Search</Link>
					</section>
					<section>
						<h1>Chat with someone!</h1>
						<Link className="link-btn" to='/chat'>Open</Link>
					</section>
				</section>
			</div>
		</div>
	);
};

export default Dashboard;