import React, { useEffect, useRef } from 'react';
import './Chat.css';
import { useNavigate } from 'react-router-dom';
import Header from '../Header/Header';
import Pic from './download.jpeg';
import Cookies from 'js-cookie';
import io from 'socket.io-client';
import { Socket } from 'socket.io-client';
import { wait } from '@testing-library/user-event/dist/utils';

// Define Room interface here
interface Room {
  id: number;
  roomName: string;
  roomType: 'PUBLIC' | 'PRIVATE' | 'PASSWORD' | 'DIRECT';
  password?: string;
  userId: number;
}

const Chat = () =>
{
  const session = Cookies.get('session');
  const navigate = useNavigate();

  // Define socketRef as a ref to a Socket instance or null
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!session)
      navigate('/not-logged');

    socketRef.current = io('http://localhost:7979', {
		withCredentials: true
	  });

	// wait(100000);

	socketRef.current?.on('connect', () => {
	console.log('Socket.IO connection opened');

	// Emit 'getUserRooms' event
	socketRef.current?.on('user_verified', () => {
		socketRef.current?.emit('getUserRooms');
	  });
	});

	// Add a listener for the 'getUserRooms' event
	socketRef.current?.on('getUserRooms', (rooms: Room[]) => {
		const directRooms = rooms.filter((room: Room) => room.roomType === 'DIRECT');
		console.log("Direct rooms:", directRooms);
	  
		const nonDirectRooms = rooms.filter((room: Room) => room.roomType !== 'DIRECT');
		console.log("Non-direct rooms:", nonDirectRooms);
	  });

    socketRef.current?.on('disconnect', () => {
      console.log('Socket.IO connection closed');
    });

    // Provide a type for the error parameter
    socketRef.current?.on('error', (error: any) => {
      console.error('Socket.IO error', error);
    });

    return () => {
    // Check that socketRef.current is not null before calling methods on it
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
				<ul>
					<li><button>General</button></li>
					<li><button>Random</button></li>
					<li><button>Tech</button></li>
				</ul>
				</div>
				<div className="direct-messages">
				<h3>Direct Messages</h3>
				<ul>
					<li><button>User1</button></li>
					<li><button>User2</button></li>
					<li><button>User3</button></li>
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