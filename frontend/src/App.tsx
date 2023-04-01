import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'

const CLIENT_ID = 'u-s4t2ud-b6bbfd6ea348daf72fd11cc6fbe63bad9d5e492ecae19cd689883a6b0f3fdabd';
const REDIRECT_URI = 'http://localhost:3000';
const SECRET = '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'

function App() {
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      axios.post('https://api.intra.42.fr/oauth/token', {
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: SECRET,
        code: code,
        redirect_uri: REDIRECT_URI
      })
      .then(response => {
        setAccessToken(response.data.access_token);
      })
      .catch(error => {
        console.error(error);
      });
    }
  }, []);

  const handleLogin = () => {
    const clientId = CLIENT_ID;
    const redirectUri = REDIRECT_URI;
    const authUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;

    window.location.href = authUrl;
  }

  if (accessToken)
  {
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    axios.get('http://localhost:5000/auth') // provide valid auth path
      .then(response => {
        // Handle the response
        console.log(response.data);
      })
      .catch(error => {
        // Handle the error
        console.error(error);
      });
  }
  return (
    <div className='App'>
      {accessToken ? (
        <h1 className='App-header'>Token: {accessToken}</h1>
      ) : (
        <button className='Auth-btn' onClick={handleLogin}>Log in with 42</button>
      )}
    </div>
  );
}

export default App;