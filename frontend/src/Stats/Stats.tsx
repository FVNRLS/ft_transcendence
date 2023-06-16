import Header from "../Header/Header";
import './Stats.css'
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";

interface GameScore {
	enemyName: String,
	score: String,
	win: String,
	gameTime: String,
}

const Stats = () => {

	const session = Cookies.get('session');

	const navigate = useNavigate();

	const [scoreArr, setScoreArr] = useState<GameScore[]>([]);

	useEffect(() => {
		if (!session)
		navigate('/not-logged');
	}, [navigate, session]);

	useEffect(() => {
		const getScoreArr = async () => {
			try
			{
				const response = await axios.post('http://localhost:5000/game/get_personal_scores', {cookie: session});
				setScoreArr(response.data);
			}
			catch (error) 
			{
				console.log(error);
			}
		}

		if (session && !scoreArr[0])
			getScoreArr();
	})

	return (
		<>
			<Header />
			<div className="bg">
				<div className="stats-cont">
				<div className="table-header">Game Statistics</div>
					{scoreArr.map((score) => (
					<div className="table-row">
						<div className="column">{score.enemyName}</div>
						<div className="column">{score.score}</div>
					</div>
					))}
				</div>
			</div>
		</>
	)
}

export default Stats;