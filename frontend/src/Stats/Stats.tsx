import Header from "../Header/Header";
import './Stats.css'
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

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
	const [isRating, setIsRating] = useState(false);

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
				{ !isRating && (
				<>
				<div className="stats-cont">
				<div className="table-header">Game Statistics</div>
					{!scoreArr[0] && (
					<div className="table-row">
						<div className="column">No Stats Yet</div>
					</div>
					)}
					{scoreArr.map((score) => (
					<div className="table-row">
						<div className="column">{score.enemyName}</div>
						<div className="column">{score.score}</div>
					</div>
					))}
				</div>
				<FontAwesomeIcon className="icon-right" 
					icon={faArrowRight} color="#f9f9f9" size="2x" onClick={() => {setIsRating(true)}}/>
				</>)}
				{isRating && <FontAwesomeIcon className="icon-left"
					icon={faArrowLeft} color="#f9f9f9" size="2x" onClick={() => {setIsRating(false)}}/>}
			</div>
		</>
	)
}

export default Stats;