// Importing required libraries and components
import React, { useEffect, useRef, useState } from 'react';
import './Chat.css';
import { useNavigate } from 'react-router-dom';
import Header from '../Header/Header';
import Pic from './download.jpeg';
import Cookies from 'js-cookie';
import io from 'socket.io-client';
import { Socket } from 'socket.io-client';


interface Message {
  id: number;
  userId: number;
  roomId: number;
  createdAt: Date;
  content: string;
}

// Defining interface for User and Room
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
  messages: Message[]; // Adding the messages array to the Room interface
}


interface ChatDetails {
  roomType: 'DIRECT' | 'PUBLIC' | 'PRIVATE' | 'PASSWORD';
  roomName: string;
  members: { id: number }[];
}

// Chat component
const Chat = () => {
  // Fetching session data
  const session = Cookies.get('session');
  // Instantiate navigate for routing
  const navigate = useNavigate();

  // State variables for channels, direct messages, logged-in user, sidebar status, group chat and direct message usernames
  const [channels, setChannels] = useState<Room[]>([]);
  const [directRooms, setDirectRooms] = useState<Room[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [groupChatUsername, setGroupChatUsername] = useState("");
  const [directMessageUsername, setDirectMessageUsername] = useState("");
  const [messageInput, setMessageInput] = useState("");


  // Reference for the socket
  const socketRef = useRef<Socket | null>(null);

  // Functions to open and close chat creation sidebar
  const createChat = () => setIsSidebarOpen(true);
  const closeChatCreation = () => {
    setIsSidebarOpen(false);
    setGroupChatUsername("");
    setDirectMessageUsername("");
  };

  // State variable for room type
  const [roomType, setRoomType] = useState<'PUBLIC' | 'PRIVATE' | 'PASSWORD'>('PUBLIC');
  const [newRoomName, setNewRoomName] = useState("");

  // Function to create a new chat
  const createNewChat = (type: 'DIRECT' | 'PUBLIC' | 'PRIVATE' | 'PASSWORD', usernames: string[]) => {
    // Chat details configuration
    let chatDetails = {
      roomType: type,
      roomName: newRoomName,
      members: [] as { id: number }[]
    };
  
    if (type === 'DIRECT' && usernames && usernames.length === 1) {
      // Handle direct chat creation
      socketRef.current?.emit('getUserIdByUsername', { username: usernames[0] }, handleDirectChatCreation(chatDetails));
    } else if (usernames) {
      // Handle group chat creation
      socketRef.current?.emit('getUsersIdsByUsernames', { usernames: usernames }, handleGroupChatCreation(chatDetails));
    } else {
      closeChatCreation();
    }
  };

  const handleGroupChatCreation = (chatDetails: ChatDetails) => (response: { userIds: number[] | null }) => {
    if (response.userIds) {
      chatDetails.members.push(...response.userIds.map(id => ({id: id})));
      socketRef.current?.emit('createRoom', chatDetails);
      closeChatCreation();
    } else {
      console.log('Users do not exist');
    }
  };
  
  const handleDirectChatCreation = (chatDetails: ChatDetails) => (response: { userId: number | null }) => {
    if (response.userId) {
      chatDetails.members.push({id: response.userId});
      socketRef.current?.emit('createRoom', chatDetails);
      closeChatCreation();
    } else {
      console.log('User does not exist');
    }
  };

  const handleSendMessage = () => {
    if (selectedRoom && messageInput.trim().length > 0) {
      // Prepare the message data
      const messageData: Partial<Message> = {
        roomId: selectedRoom.id,
        content: messageInput.trim(),
      };
  
      // Emit the 'sendMessageToRoom' event
      socketRef.current?.emit('sendMessageToRoom', messageData);
  
      // Clear the input field
      setMessageInput("");
    }
  };

  // Ref for storing the latest value of directRooms
  const directRoomsRef = useRef<Room[]>([]);
  
  
  // UseEffect hook for initializing socket connection, fetching user and rooms data
  useEffect(() => {
    // Redirect to 'not-logged' page if there's no session
    if (!session) navigate('/not-logged');

    // Initialize socket connection
    socketRef.current = io('http://localhost:7979', {
      withCredentials: true
    });

    // Socket events and handlers
    handleSocketEvents();

    // Clean up on unmount
    return () => {
      socketRef.current?.off('getUserRooms');
      socketRef.current?.off('newMessage');
      socketRef.current?.disconnect();
    };

  }, [navigate, session]);

  const handleSocketEvents = () => {
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
      const directRooms2 = rooms.filter((room: Room) => room.roomType === 'DIRECT');
      setDirectRooms(directRooms2);

      const nonDirectRooms = rooms.filter((room: Room) => room.roomType !== 'DIRECT');
      setChannels(nonDirectRooms);
    });

    socketRef.current?.on('newMessage', (newMessage: Message) => {
      console.log("New Message");
      console.log(newMessage);
    
      // Define a helper function to find the room in an array of rooms
      const findRoomIndex = (rooms: Room[]) => rooms.findIndex(room => room.id === newMessage.roomId);

    
      // Update the channels state
      setChannels(prev => {
        let roomIndex = findRoomIndex(prev);
        // If room is found in channels
        if (roomIndex !== -1) {
          const updatedRoom = { ...prev[roomIndex] };
          updatedRoom.messages.push(newMessage);
    
          // Update the state and return
          return [
            ...prev.slice(0, roomIndex),
            updatedRoom,
            ...prev.slice(roomIndex + 1),
          ];
        }
        // If room is not found, return the state as it is
        return prev;
      });
    
      // Update the directRooms state
      setDirectRooms(prev => {
        let roomIndex = findRoomIndex(prev);
        // If room is found in directRooms
        if (roomIndex !== -1) {
          const updatedRoom = { ...prev[roomIndex] };
          updatedRoom.messages.push(newMessage);
    
          // Update the state and return
          return [
            ...prev.slice(0, roomIndex),
            updatedRoom,
            ...prev.slice(roomIndex + 1),
          ];
        }
        // If room is not found, return the state as it is
        return prev;
      });
    
        // If the room is currently selected, update selectedRoom as well
        if (selectedRoom && selectedRoom.id === newMessage.roomId) {
          setSelectedRoom(prev => {
            // If this is the currently selected room, update it
            if (prev && prev.id === newMessage.roomId) {
              return { 
                ...prev, 
                messages: [...prev.messages, newMessage] 
              };
            }
            // If not, return the state as it is
            return prev;
          });
        }
    });
    
    
    

    socketRef.current?.on('disconnect', () => {
      console.log('Socket.IO connection closed');
    });

    socketRef.current?.on('error', (error: any) => {
      console.error('Socket.IO error', error);
    });
  };
  
  // Return JSX for the chat page
  return (
    <>
      <Header />
      <div className='bg'>
        <div className="chat-container">

          {/* Sidebar */}
          <div className="sidebar">

            {/* User Profile Picture */}
            <div className="profile">
              <img src={Pic} alt="Profile" />
            </div>

            {/* Check if sidebar is open or not */}
            {!isSidebarOpen ? (
              <>
                {/* Button to create new chat */}
                <button onClick={createChat}>Create new chat</button>
                
                {/* Chat Section */}
                <div className="chat-section">

                  {/* Channel List */}
                  <h3>Channels</h3>
                  <div className="channels" style={{ maxHeight: '10vh', overflowY: 'auto' }}>
                    <ul>
                      {channels.map((channel, index) => (
                        <li key={index}>
                          <button onClick={() => setSelectedRoom(channel)}>{channel.roomName}</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Direct Messages Section */}
                <div className="chat-section2">
                  <h3>Direct Messages</h3>
                  <div className="direct-messages" style={{ maxHeight: '10vh', overflowY: 'auto' }}>
                    <ul>
                      {directRooms.map((dm, index) => {
                        let otherUser = dm.users.find(user => user.id !== loggedInUser?.id);
                        let otherUsername = otherUser ? otherUser.username : 'Unknown user';

                        return (
                          <li key={index}>
                            <button onClick={() => setSelectedRoom(dm)}>{otherUsername}</button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              // New Chat Sidebar
              <div className="new-chat-sidebar">

                {/* New Group Message Section */}
                <div className="new-group-message">
                  <h3>Create Group Chat</h3>
                  <input type="text" placeholder="Usernames separated by comma" value={groupChatUsername} onChange={e => setGroupChatUsername(e.target.value)} />
                  <input type="text" placeholder="Room Name" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} />
                  <select onChange={e => setRoomType(e.target.value as 'PUBLIC' | 'PRIVATE' | 'PASSWORD')}>
                    <option value='PUBLIC'>Public</option>
                    <option value='PRIVATE'>Private</option>
                    <option value='PASSWORD'>Password Protected</option>
                  </select>
                  <button onClick={() => createNewChat(roomType, groupChatUsername.split(',').map(name => name.trim()))}>Create Group Chat</button>
                </div>

                {/* New Direct Message Section */}
                <div className="new-direct-message">
                  <h3>Create Direct Message</h3>
                  <input type="text" placeholder="Username" value={directMessageUsername} onChange={e => setDirectMessageUsername(e.target.value)} />
                  <button onClick={() => createNewChat('DIRECT', [directMessageUsername])}>Create Direct Message</button>
                </div>

                {/* Cancel Button */}
                <button onClick={closeChatCreation}>Cancel</button>
              </div>
            )}
          </div>

          {/* Chat Section */}
          <div className="chat">
            
            {/* Messages */}
            <div className="messages">
              {/* First message */}
              {selectedRoom && selectedRoom.messages.map((message, index) => (
                <div 
                  className={`message ${loggedInUser && loggedInUser.id === message.userId ? "user-message" : "other-message"}`} 
                  key={index}
                >
                  <img src={Pic} alt="Profile" />
                  <div className="message-content">
                    <p>{message.content}</p>
                    <span className="message-time">{new Date(message.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Message Input */}
            <div className="message-input">
            <input type="text" placeholder="Type a message..." value={messageInput} onChange={e => setMessageInput(e.target.value)} />
            <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Chat;
