import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from "../Header/Header";
import axios from 'axios';
import type { RootState } from '../Auth/AuthStorage'
import { logout } from '../Auth/AuthSlice'
import { useDispatch } from 'react-redux';
import './Dashboard.css'

const Dashboard = () => {

	const cookie = useSelector((state: RootState) => state.auth.cookie);

	const dispatch = useDispatch();

	const handleLogOut = async () => {
		try {
			const response = await axios.post('http://localhost:5000/auth/logout', 
			{
				cookie: cookie,
			});
			if (response.data.status === 200)
			{
				dispatch(logout());
			}
		} catch (error) {
			console.error(error);
		}
	}

	return (
		<div className="bg">
			<Header />
			<div className="dashboard-cont">
				<section className='user-sec'>
					{cookie && <button className='logout-btn' onClick={handleLogOut}>Log out</button>}
				</section>
				<section>
					<h1>Play game!</h1>
					<Link className="link-btn" to='/game'>Start</Link>
				</section>
				<section>
					<h1>See game statistics...</h1>
					<Link className="link-btn" to='/stats'>Open</Link>
				</section>
				<section>
					<h1>Find Friends</h1>
					<Link className="link-btn" to='/friends'>Search</Link>
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