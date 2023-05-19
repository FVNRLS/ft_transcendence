import { useEffect } from 'react';
import './Homepage.css'
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const CLIENT_ID = process.env.REACT_APP_ID;
const REDIRECT_URI = 'http://localhost:5000/auth/authorize_callback';

function Homepage() {
  const session = Cookies.get('session');

  const navigate = useNavigate();

  useEffect(() => {
    if (session)
      navigate('/dashboard');
  }, [navigate, session])

  const handleLogin = () => {
    const clientId = CLIENT_ID;
    const redirectUri = REDIRECT_URI;
    const authUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;

    window.location.href = authUrl;
  }

  const homePageStyle = {paddingTop: session ? '10vh' : '0', height: session ? '90vh' : '100vh'};

  return (
      <div className='bg' style={homePageStyle}>
          <h1 className='App-header'>42 Estonian Hedgehogs' Ping Pong</h1>
          <button className='Auth-btn' onClick={handleLogin}>Authorize</button>
      </div>
  );
}

export default Homepage;