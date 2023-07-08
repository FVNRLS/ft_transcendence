import Header from "../Header/Header";
import './Stats.css'
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

interface GameScore {
  enemyName: string;
  score: string;
  win: string;
  gameTime: string;
}

interface RankResp {
  username: string;
  totalMatches: number;
  wins: number;
  losses: number;
  xp: number;
  rank: number;
}

const getColor = (score: string): string => {
  const [leftNum, rightNum] = score.split(':');

  if (leftNum > rightNum) {
    return 'green';
  } else if (leftNum < rightNum) {
    return 'red';
  }
};

const Stats = () => {
  const session = Cookies.get('session');
  const app_ip = process.env.REACT_APP_IP;
  const navigate = useNavigate();

  const [scoreArr, setScoreArr] = useState<GameScore[]>([]);
  const [isRating, setIsRating] = useState(false);
  const [rankArr, setRankArr] = useState<RankResp[]>([]);

  useEffect(() => {
    if (!session)
      navigate('/not-logged');
  }, [navigate, session]);

  useEffect(() => {
    const getScoreArr = async () => {
      try {
        const response = await axios.post(`http://${app_ip}:5000/game/get_personal_scores`, { cookie: session });
        setScoreArr(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    const getRankArr = async () => {
      try {
        const response = await axios.post(`http://${app_ip}:5000/game/get_ranking_table`, { cookie: session });
        setRankArr(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    if (session && !scoreArr[0]) {
      getScoreArr();
    }

    if (session && !rankArr[0]) {
      getRankArr();
    }
  }, [rankArr, scoreArr, session]);

  return (
    <>
      <Header />
      <div className="bg">
        {!isRating && (
          <>
            <div className="stats-cont">
              <div className="table-header">Game Statistics</div>
              {scoreArr[0]?.score === '' ? (
                <div className="table-row">
                  <div className="column">No Stats Yet</div>
                </div>
              ) : (
                scoreArr.map((score, index) => (
                  <div className="table-row" key={index}>
                    <div className="column" style={{ color: getColor(score.score) }}>{score.enemyName}</div>
                    <div className="column" style={{ color: getColor(score.score) }}>{score.score}</div>
                  </div>
                ))
              )}
            </div>
            <FontAwesomeIcon
              className="icon-right"
              icon={faArrowRight}
              color="#f9f9f9"
              size="2x"
              onClick={() => setIsRating(true)}
            />
          </>
        )}
        {isRating && (
          <>
            <div className="stats-cont">
              <div style={{ backgroundColor: '#0fc384b5' }} className="table-header">Ranking</div>
              {rankArr.map((user, index) => (
                <div className="table-row row-rank" key={index}>
                  <div className="column" style={{ fontSize: '18px' }}>{user.username}</div>
                  <div className="column">{`${user.xp} XP`}</div>
                  <div className="column">{`${user.rank}`}</div>
                </div>
              ))}
            </div>
            <FontAwesomeIcon
              className="icon-left"
              icon={faArrowLeft}
              color="#f9f9f9"
              size="2x"
              onClick={() => setIsRating(false)}
            />
          </>
        )}
      </div>
    </>
  );
};

export default Stats;
