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

function App() {

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