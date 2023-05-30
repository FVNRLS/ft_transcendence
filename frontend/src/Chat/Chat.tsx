// import React, { useEffect, useRef, useState } from 'react';
// import './Chat.css';
// import { useNavigate } from 'react-router-dom';
// import Header from '../Header/Header';
// import Pic from './download.jpeg';
// import Cookies from 'js-cookie';
// import io from 'socket.io-client';
// import { Socket } from 'socket.io-client';
// import axios from 'axios';

// interface User {
// 	id: number;
// 	username: string;
// }

// interface Room {
//   id: number;
//   roomName: string;
//   roomType: 'PUBLIC' | 'PRIVATE' | 'PASSWORD' | 'DIRECT';
//   password?: string;
//   userId: number;
//   users: User[];
// }

// const Chat = () => {
//   const session = Cookies.get('session');
//   const navigate = useNavigate();
//   const [channels, setChannels] = useState<Room[]>([]);
//   const [directMessages, setDirectMessages] = useState<Room[]>([]);
//   const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [username, setUsername] = useState("");

//   const socketRef = useRef<Socket | null>(null);

//   const createChat = () => {
//     setIsSidebarOpen(true);
//   };

//   const closeChatCreation = () => {
//     setIsSidebarOpen(false);
//     setUsername("");
//   };

//   const [roomType, setRoomType] = useState<'PUBLIC' | 'PRIVATE' | 'PASSWORD'>('PUBLIC');

//   const createNewChat = (type: 'GROUP' | 'DIRECT' | 'PUBLIC' | 'PRIVATE' | 'PASSWORD', usernames: string[]) => {
//     let chatDetails: { roomType: 'GROUP' | 'DIRECT' | 'PUBLIC' | 'PRIVATE' | 'PASSWORD', roomName: string, members: { id: number }[] } = {
//       roomType: type,
//       roomName: 'New Chat',
//       members: []
//     };

//     console.log("Create new chat");
  
//     if (type === 'DIRECT' && usernames && usernames.length === 1) {
//       socketRef.current?.emit('getUserIdByUsername', { username: usernames[0] }, (response: { userId: number | null }) => {
//         if (response.userId) {
//           chatDetails.members.push({id: response.userId});
//           socketRef.current?.emit('createRoom', chatDetails);
//           setUsername("");
//           setIsSidebarOpen(false);
//         } else {
//           // Handle the case when the user does not exist
//           console.log('User does not exist');
//         }
//       });
//     } else if (usernames) {
//       console.log("Creating group");
//       socketRef.current?.emit('getUsersIdsByUsernames', { usernames: usernames }, (response: { userIds: number[] | null }) => {
//         if (response.userIds) {
//           chatDetails.members.push(...response.userIds.map(id => ({id: id})));
//           socketRef.current?.emit('createRoom', chatDetails);
//           setUsername("");
//           setIsSidebarOpen(false);
//         } else {
//           // Handle the case when the users do not exist
//           console.log('Users do not exist');
//         }
//       });
//     } else {
//       setUsername("");
//       setIsSidebarOpen(false);
//     }
//   };
  
  
  

//   useEffect(() => {
//     if (!session)
//       navigate('/not-logged');

//     socketRef.current = io('http://localhost:7979', {
// 		withCredentials: true
// 	  });

//     socketRef.current?.on('connect', () => {
//       socketRef.current?.on('user_verified', () => {
//         socketRef.current?.emit('getCurrentUser');
//         socketRef.current?.emit('getUserRooms');
//       });
//     });

//     socketRef.current?.on('currentUser', (user: User) => {
//       setLoggedInUser(user);
//     });

//     socketRef.current?.on('getUserRooms', (rooms: Room[]) => {
//       const directRooms = rooms.filter((room: Room) => room.roomType === 'DIRECT');
//       setDirectMessages(directRooms);

//       const nonDirectRooms = rooms.filter((room: Room) => room.roomType !== 'DIRECT');
//       setChannels(nonDirectRooms);
//     });

//     socketRef.current?.on('disconnect', () => {
//       console.log('Socket.IO connection closed');
//     });

//     socketRef.current?.on('error', (error: any) => {
//       console.error('Socket.IO error', error);
//     });

//     return () => {
//       socketRef.current?.off('getUserRooms');
//       socketRef.current?.disconnect();
//     };

//   }, [navigate, session]);

// return (
//   <>
//     <Header />
//     <div className='bg'>
//       <div className="chat-container">
//         <div className="sidebar">
//           <div className="profile">
//             <img src={Pic} alt="Profile" />
//           </div>
//           {!isSidebarOpen ? (
//             <>
//               <button onClick={createChat}>Create new chat</button>
//               <div className="channels">
//                 <h3>Channels</h3>
//                 <ul style={{overflowY: 'auto', maxHeight: '200px'}}>
//                   {channels.map((channel, index) => (
//                     <li key={index}><button>{channel.roomName}</button></li>
//                   ))}
//                 </ul>
//               </div>
//               <div className="direct-messages">
//                 <h3>Direct Messages</h3>
//                 <ul style={{overflowY: 'auto', maxHeight: '200px'}}>
//                   {directMessages.map((dm, index) => {
//                     let otherUser = dm.users.find(user => user.id !== loggedInUser?.id);
//                     let otherUsername = otherUser ? otherUser.username : 'Unknown user';

//                     return (
//                       <li key={index}><button>{otherUsername}</button></li>
//                     );
//                   })}
//                 </ul>
//               </div>
//             </>
//           ) : (
//             <div className="new-chat-sidebar">
//               <div className="new-group-message">
//                 <h3>Create Group Chat</h3>
//                 <input type="text" placeholder="Usernames separated by comma" value={username} onChange={e => setUsername(e.target.value)} />
//                 <select onChange={e => setRoomType(e.target.value as 'PUBLIC' | 'PRIVATE' | 'PASSWORD')}>
//                   <option value='PUBLIC'>Public</option>
//                   <option value='PRIVATE'>Private</option>
//                   <option value='PASSWORD'>Password Protected</option>
//                 </select>
//                 <button onClick={() => createNewChat(roomType, username.split(','))}>Create Group Chat</button>
//               </div>
//               <div className="new-direct-message">
//                 <h3>Create Direct Message</h3>
//                 <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
//                 <button onClick={() => createNewChat('DIRECT', [username])}>Create Direct Message</button>
//               </div>
//               <button onClick={closeChatCreation}>Cancel</button>
//             </div>
//           )}
//         </div>
//         <div className="chat">
//           <div className="messages">
//             <div className="message">
//               <img src={Pic} alt="Profile" />
//               <div className="message-content">
//                 <p>Message text goes here.</p>
//                 <span className="message-time">12:34 PM</span>
//               </div>
//             </div>
//             <div className="message">
//               <img src={Pic} alt="Profile" />
//               <div className="message-content">
//                 <p>Another message text goes here.</p>
//                 <span className="message-time">12:35 PM</span>
//               </div>
//             </div>
//           </div>
//           <div className="message-input">
//             <input type="text" placeholder="Type a message..." />
//             <button>Send</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   </>
// );
// }

// export default Chat;





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
  const [groupChatUsername, setGroupChatUsername] = useState("");
  const [directMessageUsername, setDirectMessageUsername] = useState("");

  const socketRef = useRef<Socket | null>(null);

  const createChat = () => {
    setIsSidebarOpen(true);
  };

  const closeChatCreation = () => {
    setIsSidebarOpen(false);
    setGroupChatUsername("");
    setDirectMessageUsername("");
  };

  const [roomType, setRoomType] = useState<'PUBLIC' | 'PRIVATE' | 'PASSWORD'>('PUBLIC');

  const [newRoomName, setNewRoomName] = useState("");

  const createNewChat = (type: 'DIRECT' | 'PUBLIC' | 'PRIVATE' | 'PASSWORD', usernames: string[]) => {
    let chatDetails: { roomType: 'DIRECT' | 'PUBLIC' | 'PRIVATE' | 'PASSWORD', roomName: string, members: { id: number }[] } = {
      roomType: type,
      roomName: 'New Chat',
      members: []
    };

    console.log("Create new chat");
    chatDetails.roomName = newRoomName;
  
    if (type === 'DIRECT' && usernames && usernames.length === 1) {
      socketRef.current?.emit('getUserIdByUsername', { username: usernames[0] }, (response: { userId: number | null }) => {
        if (response.userId) {
          chatDetails.members.push({id: response.userId});
          socketRef.current?.emit('createRoom', chatDetails);
          setDirectMessageUsername("");
          setIsSidebarOpen(false);
        } else {
          // Handle the case when the user does not exist
          console.log('User does not exist');
        }
      });
    } else if (usernames) {
      console.log("Creating group");
      socketRef.current?.emit('getUsersIdsByUsernames', { usernames: usernames }, (response: { userIds: number[] | null }) => {
        if (response.userIds) {
          chatDetails.members.push(...response.userIds.map(id => ({id: id})));
          socketRef.current?.emit('createRoom', chatDetails);
          setGroupChatUsername("");
          setIsSidebarOpen(false);
        } else {
          // Handle the case when the users do not exist
          console.log('Users do not exist');
        }
      });
    } else {
      setGroupChatUsername("");
      setDirectMessageUsername("");
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
          {!isSidebarOpen ? (
            <>
              <button onClick={createChat}>Create new chat</button>
              <div className="channels">
                <h3>Channels</h3>
                <ul style={{overflowY: 'auto', maxHeight: '200px'}}>
                  {channels.map((channel, index) => (
                    <li key={index}><button>{channel.roomName}</button></li>
                  ))}
                </ul>
              </div>
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
            </>
          ) : (
            <div className="new-chat-sidebar">
              <div className="new-group-message">
                <h3>Create Group Chat</h3>
                <input type="text" placeholder="Usernames separated by comma" value={groupChatUsername} onChange={e => setGroupChatUsername(e.target.value)} />
                <input type="text" placeholder="Room Name" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} />
                <select onChange={e => setRoomType(e.target.value as 'PUBLIC' | 'PRIVATE' | 'PASSWORD')}>
                  <option value='PUBLIC'>Public</option>
                  <option value='PRIVATE'>Private</option>
                  <option value='PASSWORD'>Password Protected</option>
                </select>
                <button onClick={() => createNewChat(roomType, groupChatUsername.split(','))}>Create Group Chat</button>
              </div>
              <div className="new-direct-message">
                <h3>Create Direct Message</h3>
                <input type="text" placeholder="Username" value={directMessageUsername} onChange={e => setDirectMessageUsername(e.target.value)} />
                <button onClick={() => createNewChat('DIRECT', [directMessageUsername])}>Create Direct Message</button>
              </div>
              <button onClick={closeChatCreation}>Cancel</button>
            </div>
          )}
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
