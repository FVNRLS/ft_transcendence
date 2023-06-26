// Importing required libraries and components
import React, { useEffect, useRef, useState } from 'react';
import './Chat.css';
import { useNavigate } from 'react-router-dom';
import Header from '../Header/Header';
import Cookies from 'js-cookie';
import io from 'socket.io-client';
import { Socket } from 'socket.io-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import NewChannelCreation from './NewChannelCreation';
import NewDirectMessageCreation from './NewDirectMessageCreation';
import DirectMessagesHeader from './DirectMessagesHeader';
import GroupHeader from './GroupHeader';
import axios from 'axios';


// Defining interface for User and Room
export interface User {
  id: number;
  username: string;
  role: string;
}

interface Message {
  id: number;
  // userId: number;
  user: User;  // Add this line to include User in Message
  username: string;
  roomId: number;
  createdAt: Date;
  content: string;
}

interface userPic {
  pic: string,
  username: string
}


export interface Room {
  id: number;
  roomName: string;
  roomType: 'PUBLIC' | 'PRIVATE' | 'PASSWORD' | 'DIRECT';
  password?: string;
  userId: number;
  users: User[];
  clientUser: User;
  receivingUser: User;
  messages: Message[]; // Adding the messages array to the Room interface
}

// Chat component
const Chat = () => {

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetching session data
  const session = Cookies.get('session');
  const app_ip = process.env.REACT_APP_IP;
  // Instantiate navigate for routing
  const navigate = useNavigate();

  // State variables for channels, direct messages, logged-in user, sidebar status, group chat and direct message usernames
  const [channels, setChannels] = useState<Room[]>([]);
  const [directRooms, setDirectRooms] = useState<Room[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [newDirectOpened, setNewDirectOpened] = useState(false);
  const [newChannelOpened, setNewChannelOpened] = useState(false);
  const [isUserBlocked, setIsUserBlocked] = useState<boolean>(false);
  const [blockedUsers, setBlockedUsers] = useState<number[]>([]);
  const [isChatHeaderClicked, setIsChatHeaderClicked] = useState(false);
  const [profPic, setProfPic] = useState('');
  const [userPics, setUserPics] = useState<userPic[]>([]);

  // Reference for the socket
  const socketRef = useRef<Socket | null>(null);

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

  const blockUser = (user_id: number) => {
        socketRef.current?.emit('blockUser', { blockedId: user_id }, (response: any) => {
          if (response.success) {
            setIsUserBlocked(true);
            socketRef.current?.emit('getBlockedUsers');
          } else {
            console.error('Block user failed:', response.message);
          }
        });
    }
  
  const unblockUser = (user_id: number) => {
        socketRef.current?.emit('unblockUser', { blockedId: user_id }, (response: any) => {
          if (response.success) {
            setIsUserBlocked(false);
            socketRef.current?.emit('getBlockedUsers');
          } else {
            console.error('Unblock user failed:', response.message);
          }
        });
        
      // }
    // }
  }

  // UseEffect hook for initializing socket connection, fetching user and rooms data
  useEffect(() => {
    // Redirect to 'not-logged' page if there's no session
    if (!session) navigate('/not-logged');

    // Initialize socket connection
    socketRef.current = io(`http://${app_ip}:7979`, {
      withCredentials: true
    });

    // Socket events and handlers
    const handleSocketEvents = () => {
      // socketRef.current?.on('connect', () => {
      //   socketRef.current?.on('user_verified', () => {
      //     console.log("HandleConnection in Frontend");
      //     // socketRef.current?.emit('getCurrentUser');
      //     // socketRef.current?.emit('getUserRooms');
      //     // socketRef.current?.emit('getBlockedUsers');

      //   });
      // });
  
      socketRef.current?.on('currentUser', (user: User) => {
        setLoggedInUser(user);
      });

      socketRef.current?.on('getBlockedUsers', (data) => {
        // data would be an array of blocked users' IDs
        setBlockedUsers(data);
    });
  
      socketRef.current?.on('getUserRooms', (rooms: Room[]) => {
        if (!rooms) {
          console.error("Received null or undefined 'rooms'.");
          return;
        }

        const directRooms2 = rooms.filter((room: Room) => room.roomType === 'DIRECT');
        setDirectRooms(directRooms2);
  
        const nonDirectRooms = rooms.filter((room: Room) => room.roomType !== 'DIRECT');
        setChannels(nonDirectRooms);

        console.log(nonDirectRooms);
      });
  
      socketRef.current?.on('joinedRoom', (newRoom: Room) => {
        if(newRoom.roomType === 'DIRECT' && newRoom.users) {
          setDirectRooms((prevRooms) => [...prevRooms, newRoom]);
        } else if (newRoom.users) {
          setChannels((prevRooms) => [...prevRooms, newRoom]);
        }
      });

      socketRef.current?.on('roomUpdated', (updatedRoom: Room) => {
        const updateRooms = (prevRooms: Room[]) => {
          const roomIndex = prevRooms.findIndex(room => room.id === updatedRoom.id);
          if (roomIndex !== -1) {
            // This will update only the fields that are in the updatedRoom object
            const newRoom = { ...prevRooms[roomIndex], ...updatedRoom };
            return [
              ...prevRooms.slice(0, roomIndex),
              newRoom,
              ...prevRooms.slice(roomIndex + 1),
            ];
          }
          return prevRooms;
        };
        setChannels(prev => updateRooms(prev));
        setDirectRooms(prev => updateRooms(prev));

      });
      
      socketRef.current?.on('newMessage', (newMessage: Message) => {
      
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

      socketRef.current.on('kickUser', (data) => {
        // Update channels and directRooms to remove the kicked user
        setChannels(prevRooms => prevRooms.map(room =>
          room.id === data.roomId ? {...room, users: room.users.filter(user => user.id !== data.userId)} : room
        ));
      });
  
      // socketRef.current.on('banUser', (data) => {
      //   // Update channels and directRooms to remove the banned user
      //   setChannels(prevRooms => prevRooms.map(room =>
      //     room.id === data.roomId ? {...room, users: room.users.filter(user => user.id !== data.userId)} : room
      //   ));
      // });

      socketRef.current.on('banUser', (data) => {
        // Update channels and directRooms to remove the banned user
        setChannels(prevRooms => prevRooms.map(room =>
          room.id === data.roomId ? {
            ...room,
            users: room.users.filter(user => user.id !== data.userId),
            bannedUsers: [...room.bannedUsers, {id: data.userId, bannedAt: data.bannedAt}]  // Add user to bannedUsers
          } : room
        ));
      });
      
  
      socketRef.current.on('unbanUser', (data) => {
        // Update channels to remove the unbanned user from the list of banned users
        setChannels(prevRooms => prevRooms.map(room =>
          room.id === data.roomId ? {...room, bannedUsers: room.bannedUsers.filter(user => user.id !== data.userId)} : room
        ));
      });
      

      socketRef.current.on('muteUser', (data) => {
        console.log("UserMuted");
        // Update channels and directRooms to mute the user
        setChannels(prevRooms => prevRooms.map(room =>
          room.id === data.roomId ? {...room, mutedUsers: [...room.mutedUsers, {id: data.userId, muteExpiresAt: data.muteExpiresAt}]} : room
        ));
      });
  
      socketRef.current.on('unmuteUser', (data) => {
        // Update channels and directRooms to unmute the user
        setChannels(prevRooms => prevRooms.map(room =>
          room.id === data.roomId ? {...room, mutedUsers: room.mutedUsers.filter(mutedUser => mutedUser.id !== data.userId)} : room
        ));
      });
    };

    handleSocketEvents();

    // Clean up on unmount
    return () => {
      socketRef.current?.off('getUserRooms');
      socketRef.current?.off('newMessage');
      socketRef.current?.off('getBlockedUsers');
      socketRef.current.off('kickUser');
      socketRef.current.off('banUser');
      socketRef.current.off('unbanUser');
      socketRef.current.off('muteUser');
      socketRef.current.off('unmuteUser');
      socketRef.current?.disconnect();
    };

  }, [navigate, session, selectedRoom]);

  useEffect(() => {
    // Scroll to the bottom when a new message appears
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [selectedRoom?.messages]);

  useEffect(() => {
    if (selectedRoom && loggedInUser) {
      // const otherUser = selectedRoom.users.find(user => user.id !== loggedInUser.id);
      const otherUser = selectedRoom.receivingUser;

      if (otherUser) {
        setIsUserBlocked(blockedUsers.includes(otherUser.id));
      }
    }
  }, [selectedRoom, loggedInUser, blockedUsers]);

  useEffect(() => {
    const currentRoomType = selectedRoom?.roomType; // or whatever the key for the room type is
    const currentRoomId = selectedRoom?.id;
    if (currentRoomType && currentRoomId) {
      if (currentRoomType !== "DIRECT") {
        const updatedRoom = channels.find((room) => room.id === currentRoomId);
        if (updatedRoom && JSON.stringify(updatedRoom) !== JSON.stringify(selectedRoom)) {
          setSelectedRoom(updatedRoom);
        }
      } else {
        // assuming "PRIVATE" and "DIRECT" are the other possible room types
        const updatedRoom = directRooms.find((room) => room.id === currentRoomId);
        if (updatedRoom && JSON.stringify(updatedRoom) !== JSON.stringify(selectedRoom)) {
          setSelectedRoom(updatedRoom);
        }
      }
    }
  }, [channels, directRooms]);
  
  useEffect(() => {
    const getProfPic = async () => {
      try
      {
        const response = await axios.post(`http://${app_ip}:5000/storage/get_profile_picture`, { cookie: session });
        const uintArray = new Uint8Array(response.data.buffer.data);
				const blob = new Blob([uintArray], { type: 'mimetype' });
				const imageUrl = URL.createObjectURL(blob);
				setProfPic(imageUrl);
      }
      catch (error)
      {
        console.log(error);
      }
    }

    const getImgUrl = (pic: Buffer) => {
      const uintArray = new Uint8Array(pic);
      const blob = new Blob([uintArray], { type: 'mimetype' });
      const imageUrl = URL.createObjectURL(blob);
      return (imageUrl);
    }

    const getUserPics = async () => {
      try
      {
        const response = await axios.post(`http://${app_ip}:5000/friendship/get_users_all`, {cookie: session});
        setUserPics(response.data.map((user:any) => ({pic: getImgUrl(user.picture.buffer.data), username: user.username})));
      }
      catch (error)
      {
        console.log(error);
      }
    }

    if (session && profPic === '')
      getProfPic();
    
    if (session && !userPics[0])
      getUserPics();
  });
  
  const handleKeyPress = (event:any) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  const openNewDirect = () => {
    setSelectedRoom(null);
    setNewChannelOpened(false);
    setNewDirectOpened(true);
    setIsChatHeaderClicked(false)
  }

  const openNewChannel = () => {
    setSelectedRoom(null);
    setNewDirectOpened(false);
    setNewChannelOpened(true);
    setIsChatHeaderClicked(false)
  }

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
              <img src={profPic} alt="Profile" />
            </div>

            {/* Check if sidebar is open or not */}
              <>            
                {/* Chat Section */}
                <div className="chat-section">

                  {/* Channel List */}
                  <div className='sec-name'>
                    <h3>Channels</h3>
                    <FontAwesomeIcon className='plus-icon' icon={faPlus} color='#333333' onClick={openNewChannel}/>
                  </div>
                  <div className="channels" style={{ maxHeight: '10vh', overflowY: 'auto' }}>
                    <ul>
                      {channels.map((channel, index) => (
                        <li key={index}>
                          <button onClick={() => {setNewChannelOpened(false); setNewDirectOpened(false); setSelectedRoom(channel); setIsChatHeaderClicked(false)}}>{channel.roomName}</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Direct Messages Section */}
                <div className="chat-section">
                  <div className='sec-name'>
                    <h3>Direct Messages</h3>
                    <FontAwesomeIcon className='plus-icon' icon={faPlus} color='#333333' onClick={openNewDirect}/>
                  </div>
                  <div className="direct-messages" style={{ maxHeight: '10vh', overflowY: 'auto' }}>
                    <ul>
                      {directRooms.map((dm, index) => {
                        let otherUsername = dm.receivingUser.username;

                        return (
                          <li key={index}>
                            <button onClick={() => {
                              setNewChannelOpened(false); 
                              setNewDirectOpened(false); 
                              setSelectedRoom(dm); 
                              setIsChatHeaderClicked(false)
                            }}>
                              {otherUsername}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </>
          </div>


          {/* Chat Section */}
          <div className="chat">
            {/* Chat Header */}
            {selectedRoom && selectedRoom.roomType === 'DIRECT' &&
              // Inside the Chat component's return statement
              <DirectMessagesHeader
                selectedRoom={selectedRoom}
                isChatHeaderClicked={isChatHeaderClicked}
                isUserBlocked={isUserBlocked}
                loggedInUser={loggedInUser}
                blockUser={blockUser}
                unblockUser={unblockUser}
                setIsChatHeaderClicked={setIsChatHeaderClicked}
              />
            }

            {selectedRoom && selectedRoom.roomType !== 'DIRECT' &&
              // Inside the Chat component's return statement
              <GroupHeader
                loggedInUser={loggedInUser}
                selectedRoom={selectedRoom}
                isChatHeaderClicked={isChatHeaderClicked}
                blockedUsers={blockedUsers}
                socketRef={socketRef}
                blockUser={blockUser}
                unblockUser={unblockUser}
                setIsChatHeaderClicked={setIsChatHeaderClicked}

              />
            }

            
            {/* Messages */}
            <div className={newChannelOpened || newDirectOpened ? "messages creation-window" : "messages"} ref={messagesContainerRef}>
            
            { newChannelOpened && (
              <NewChannelCreation 
              setNewChannelOpened={setNewChannelOpened}
              socketRef={socketRef}
            />
            )}

            { newDirectOpened && (
              <NewDirectMessageCreation 
              setNewDirectOpened={setNewDirectOpened}
              socketRef={socketRef}
            />
              )}

              {/* First message */}
              {selectedRoom?.messages && selectedRoom.messages.map((message, index) => (
                <div 
                  className={`message ${loggedInUser && loggedInUser.id === message.user.id ? "user-message" : "other-message"}`} 
                  key={index}
                >
                  {!(loggedInUser && loggedInUser.id === message.user.id) && <img src={userPics.find((user) => user.username === message.user.username)?.pic} alt="Profile" />}
                  <div className={(loggedInUser && loggedInUser.id === message.user.id) ? "message-content user-message-content" : "message-content"}>
                    <p>{message.content}</p>
                    <span className="message-time">{new Date(message.createdAt).toLocaleTimeString(undefined, {
                        hour: 'numeric',
                        minute: 'numeric',
                        })}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Message Input */}
            <div className="message-input">
              <input type="text" placeholder="Type a message..." value={messageInput} onKeyDown={handleKeyPress} onChange={e => setMessageInput(e.target.value)} />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Chat;