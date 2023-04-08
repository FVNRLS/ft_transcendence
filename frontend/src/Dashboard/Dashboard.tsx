import { Link } from 'react-router-dom';
import Header from "../Header/Header";
import './Dashboard.css'

const Dashboard = () => {

	const username = 'Sample Name';

	return (
		<div className="bg">
			<Header />
			<div className="dashboard-cont">
				<section className='user-sec'>
					<h1>{username}</h1>
				</section>
				<section>
					<h1>Play game!</h1>
					<Link className="link-btn" to='/game'>Start</Link>
				</section>
				<section>
					<h1>See game statistics...</h1>
					<Link className="link-btn" to='/game'>Open</Link>
				</section>
				<section>
					<h1>Find Friends</h1>
					<Link className="link-btn" to='/chat'>Search</Link>
				</section>
				<section>
					<h1>Chat with someone!</h1>
					<Link className="link-btn" to='/chat'>Open</Link>
				</section>
			</div>
		</div>
	);
};

export default Dashboard;