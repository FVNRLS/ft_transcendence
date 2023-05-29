import React, { useEffect, useRef, useState } from 'react';
import './Chat.css';
import { useNavigate } from 'react-router-dom';
import Header from '../Header/Header';
import Pic from './download.jpeg';
import Cookies from 'js-cookie';
import io from 'socket.io-client';
import { Socket } from 'socket.io-client';
import axios from 'axios';

interface User {
	id: number;
	username: string;
}

interface Room {
  id: number;
  roomName: string;
  roomType: 'PUBLIC' | 'PRIVATE' | 'PASSWORD' | 'DIRECT';
  password?: string;
  userId: number;
  users: User[];
}

const Chat = () => {
  const session = Cookies.get('session');
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Room[]>([]);
  const [directMessages, setDirectMessages] = useState<Room[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [username, setUsername] = useState("");

  const socketRef = useRef<Socket | null>(null);

  const createChat = () => {
    setIsSidebarOpen(true);
  };

  const createNewChat = (type: 'GROUP' | 'DIRECT', username: string | null) => {
    let chatDetails: { roomType: 'GROUP' | 'DIRECT', roomName: string, members: { id: number }[] } = {
      roomType: type,
      roomName: 'New Chat',
      members: []
    };
  
    if (type === 'DIRECT' && username) {
      socketRef.current?.emit('getUserIdByUsername', { username: username }, (response: { userId: number | null }) => {
        if (response.userId) {
          chatDetails.members.push({id: response.userId});
          socketRef.current?.emit('createRoom', chatDetails);
          setUsername("");
          setIsSidebarOpen(false);
        } else {
          // Handle the case when the user does not exist
          console.log('User does not exist');
        }
      });
    } else {
      // socketRef.current?.emit('createRoom', chatDetails);
      setUsername("");
      setIsSidebarOpen(false);
    }
  };
  
  

  useEffect(() => {
    if (!session)
      navigate('/not-logged');

    socketRef.current = io('http://localhost:7979', {
		withCredentials: true
	  });

    socketRef.current?.on('connect', () => {
      socketRef.current?.on('user_verified', () => {
        socketRef.current?.emit('getCurrentUser');
        socketRef.current?.emit('getUserRooms');
      });
    });

    socketRef.current?.on('currentUser', (user: User) => {
      setLoggedInUser(user);
    });

    socketRef.current?.on('getUserRooms', (rooms: Room[]) => {
      const directRooms = rooms.filter((room: Room) => room.roomType === 'DIRECT');
      setDirectMessages(directRooms);

      const nonDirectRooms = rooms.filter((room: Room) => room.roomType !== 'DIRECT');
      setChannels(nonDirectRooms);
    });

    socketRef.current?.on('disconnect', () => {
      console.log('Socket.IO connection closed');
    });

    socketRef.current?.on('error', (error: any) => {
      console.error('Socket.IO error', error);
    });

    return () => {
      socketRef.current?.off('getUserRooms');
      socketRef.current?.disconnect();
    };

  }, [navigate, session]);

  return (
    <>
      <Header />
      <div className='bg'>
        <div className="chat-container">
          <div className="sidebar">
            <div className="profile">
              <img src={Pic} alt="Profile" />
            </div>
            <div className="channels">
              <h3>Channels</h3>
              <button onClick={createChat}>Create new chat</button>
              <ul style={{overflowY: 'auto', maxHeight: '200px'}}>
                {channels.map((channel, index) => (
                  <li key={index}><button>{channel.roomName}</button></li>
                ))}
              </ul>
            </div>
            {isSidebarOpen && (
              <div className="new-chat-sidebar">
                <h3>Create a New Chat</h3>
                <button onClick={() => createNewChat('GROUP', "Test1")}>Create Group Chat</button>
                <button onClick={() => setIsSidebarOpen(false)}>Close</button>
                <div className="new-direct-message">
                  <h3>Create Direct Message</h3>
                  <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                  <button onClick={() => createNewChat('DIRECT', username)}>Create Direct Message</button>
                </div>
              </div>
            )}
            <div className="direct-messages">
              <h3>Direct Messages</h3>
				<ul style={{overflowY: 'auto', maxHeight: '200px'}}>
					{directMessages.map((dm, index) => {
					let otherUser = dm.users.find(user => user.id !== loggedInUser?.id);
          let otherUsername = otherUser ? otherUser.username : 'Unknown user';

					return (
						<li key={index}><button>{otherUsername}</button></li>
					);
					})}
				</ul>
            </div>
          </div>
          <div className="chat">
            <div className="messages">
              <div className="message">
                <img src={Pic} alt="Profile" />
                <div className="message-content">
                  <p>Message text goes here.</p>
                  <span className="message-time">12:34 PM</span>
                </div>
              </div>
              <div className="message">
                <img src={Pic} alt="Profile" />
                <div className="message-content">
                  <p>Another message text goes here.</p>
                  <span className="message-time">12:35 PM</span>
                </div>
              </div>
            </div>
            <div className="message-input">
              <input type="text" placeholder="Type a message..." />
              <button>Send</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Chat;
