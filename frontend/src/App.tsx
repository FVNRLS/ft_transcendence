import React, { useState, useEffect } from 'react';
import Homepage from './Homepage/Homepage';
import { Route, Routes } from "react-router-dom";
import Game from './Game/Game';
import Form from './Auth/Form';

function App() {
  return (
    <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/game" element={<Game />} />
        <Route path="/form" element={<Form />} />
    </Routes>
  );
}

export default App;