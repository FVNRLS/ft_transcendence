import Dashboard from '../Dashboard/Dashboard';
import Header from '../Header/Header';
import { useSelector } from 'react-redux';
import type {RootState} from '../Auth/AuthStorage'
import './Homepage.css'

const CLIENT_ID = process.env.REACT_APP_ID;
const REDIRECT_URI = 'http://localhost:3000/form';

function Homepage() {

  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

  const handleLogin = () => {
    const clientId = CLIENT_ID;
    const redirectUri = REDIRECT_URI;
    const authUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;

    window.location.href = authUrl;
  }

  return (
    <div>
    {isLoggedIn ? (<Dashboard />) :
    (
      <div className='bg'>
        <Header />
          <h1 className='App-header'>42 Estonian Hedgehogs' Ping Pong</h1>
          <button className='Auth-btn' onClick={handleLogin}>Authorize</button>
      </div>
    )}
    </div>
  );
}

export default Homepage;