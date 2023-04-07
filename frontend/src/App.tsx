import React, { useState, useEffect } from 'react';
import Homepage from './Homepage/Homepage';
import { Route, Routes } from "react-router-dom";
import Game from './Game/Game';
import Form from './Auth/Form';
import Dashboard from './Dashboard/Dashboard';
import Chat from './Chat/Chat';
import Profile from './Profile/Profile';

function App() {
  return (
    <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/game" element={<Game />} />
        <Route path="/form" element={<Form />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;