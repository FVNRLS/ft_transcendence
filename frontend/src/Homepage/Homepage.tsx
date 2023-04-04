import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import Dashboard from '../Dashboard/Dashboard';
import './Homepage.css'

const CLIENT_ID = process.env.APP_ID || 'u-s4t2ud-b6bbfd6ea348daf72fd11cc6fbe63bad9d5e492ecae19cd689883a6b0f3fdabd';
const REDIRECT_URI = 'http://localhost:3000/form';

function Homepage() {

  const {isLoggedIn} = useContext(AuthContext);

  const handleLogin = () => {
    const clientId = CLIENT_ID;
    const redirectUri = REDIRECT_URI;
    const authUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;

    window.location.href = authUrl;
  }

  console.log(isLoggedIn);
  return (
    <div>
    {isLoggedIn ? (<Dashboard />) :
    (
      <div className='bg'>
          <h1 className='App-header'>42 Estonian Hedgehogs' Ping Pong</h1>
          <button className='Auth-btn' onClick={handleLogin}>Authorize</button>
      </div>
    )}
    </div>
  );
}

export default Homepage;