import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header/Header';
import "./App.css";

function handleClick() {
  axios.post('http://localhost:5000/auth', {
    data: 'some data',
  })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });
}

function App() {
  const [data, setData] = useState(String);

  useEffect(() => {
    axios.get('http://localhost:5000')
      .then(response => setData(response.data))
      .catch(error => console.error(error));
  }, []);

  return (
    <div className='App'>
      <Header />
      <h1 className="App-header">{data}</h1>
      <button className="Auth-btn" onClick={handleClick}>Authenticate</button>
    </div>
  );
}

export default App;