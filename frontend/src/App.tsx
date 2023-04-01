import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CLIENT_ID = 'u-s4t2ud-b6bbfd6ea348daf72fd11cc6fbe63bad9d5e492ecae19cd689883a6b0f3fdabd';
const REDIRECT_URI = 'http%3A%2F%2Flocalhost%3A3000%2F';
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

  return (
    <div>
      {accessToken ? (
        <p>You are logged in!</p>
      ) : (
        <button onClick={handleLogin}>Log in with 42</button>
      )}
    </div>
  );
}

export default App;