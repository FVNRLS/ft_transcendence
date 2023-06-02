import Homepage from './Homepage/Homepage';
import { Route, Routes } from "react-router-dom";
import Game from './Game/Game';
import Form from './Auth/Form';
import Dashboard from './Dashboard/Dashboard';
import Chat from './Chat/Chat';
import Profile from './Profile/Profile';
import NotFound from './404/NotFound';
import Stats from './Stats/Stats';
import SearchFriends from './Friends/SearchFriends';
import NotLogged from './Auth/NotLogged';
import Friends from './Friends/Friends';
import { useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

function App() {

  const session = Cookies.get('session');

  // Register the event listeners
  useEffect(() => {
    const setOnline = async () => {
      if (session)
      {
        try {
          await axios.post("http://localhost:5000/auth/set_status", {cookie: session, status: 'online'});
        } catch (error) {
          console.log(error);
        }
      }
    };
  
    const setOffline = async () => {
      if (session)
      {
        try {
          await axios.post("http://localhost:5000/auth/set_status", {cookie: session, status: 'offline'});
        } catch (error) {
          console.log(error);
        }
      }
    };

    const handleOnline = () => {
      setOnline();
    };
  
    const handleOffline = () => {
      setOffline();
    };

    if (navigator.onLine)
      handleOnline();
  
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeunload", handleOffline);
  
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeunload", handleOffline);
    };
  }, [session]);

  return (
    <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/game" element={<Game />} />
        <Route path="/form" element={<Form />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/search" element={<SearchFriends />} />
        <Route path="/not-logged" element={<NotLogged />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;