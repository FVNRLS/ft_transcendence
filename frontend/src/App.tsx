import React, { useState, useEffect } from 'react';
import Homepage from './Homepage/Homepage';
import { Route, Routes } from "react-router-dom";
import Game from './Game/Game';

function App() {
  return (
    <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/game" element={<Game />} />
    </Routes>
  );
}

export default App;