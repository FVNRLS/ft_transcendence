// Importing required libraries and components
import React, { useEffect, useRef, useState } from 'react';
import './Chat.css';
import { useNavigate } from 'react-router-dom';
import Header from '../Header/Header';
import Pic from './download.jpeg';
import Cookies from 'js-cookie';
import io from 'socket.io-client';
import { Socket } from 'socket.io-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';


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

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetching session data
  const session = Cookies.get('session');
  // Instantiate navigate for routing
  const navigate = useNavigate();

  // State variables for channels, direct messages, logged-in user, sidebar status, group chat and direct message usernames
  const [channels, setChannels] = useState<Room[]>([]);
  const [directRooms, setDirectRooms] = useState<Room[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [groupChatUsername, setGroupChatUsername] = useState("");
  const [directMessageUsername, setDirectMessageUsername] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [newDirectOpened, setNewDirectOpened] = useState(false);
  const [newChannelOpened, setNewChannelOpened] = useState(false);
  const [isUserBlocked, setIsUserBlocked] = useState<boolean>(false);
  const [blockedUsers, setBlockedUsers] = useState<number[]>([]);
  const [isChatHeaderClicked, setIsChatHeaderClicked] = useState(false);
  const [otherUsername, setOtherUsername] = useState<string>('');


  // Reference for the socket
  const socketRef = useRef<Socket | null>(null);

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
    }
  };

  const handleGroupChatCreation = (chatDetails: ChatDetails) => (response: { userIds: number[] | null }) => {
    if (response.userIds) {
      chatDetails.members.push(...response.userIds.map(id => ({id: id})));
      socketRef.current?.emit('createRoom', chatDetails);
    } else {
      console.log('Users do not exist');
    }
  };
  
  const handleDirectChatCreation = (chatDetails: ChatDetails) => (response: { userId: number | null }) => {
    if (response.userId) {
      chatDetails.members.push({id: response.userId});
      socketRef.current?.emit('createRoom', chatDetails);
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

  const blockUser = () => {
    if (selectedRoom && selectedRoom.users) {
      const otherUser = selectedRoom.users.find(user => user.id !== loggedInUser?.id);
      if (otherUser) {
        // socketRef.current?.emit('blockUser', { blockedId: otherUser.id });
        socketRef.current?.emit('blockUser', { blockedId: otherUser.id }, (response: any) => {
          if (response.success) {
            setIsUserBlocked(true);
            socketRef.current?.emit('getBlockedUsers');
          } else {
            console.error('Block user failed:', response.message);
          }
        });
        
      }
    }
  }
  
  const unblockUser = () => {
    if (selectedRoom && selectedRoom.users) {
      const otherUser = selectedRoom.users.find(user => user.id !== loggedInUser?.id);
      if (otherUser) {
        // socketRef.current?.emit('unblockUser', { blockedId: otherUser.id });
        socketRef.current?.emit('unblockUser', { blockedId: otherUser.id }, (response: any) => {
          if (response.success) {
            setIsUserBlocked(false);
            socketRef.current?.emit('getBlockedUsers');
          } else {
            console.error('Unblock user failed:', response.message);
          }
        });
        
      }
    }
  }
  
  // UseEffect hook for initializing socket connection, fetching user and rooms data
  useEffect(() => {
    // Redirect to 'not-logged' page if there's no session
    if (!session) navigate('/not-logged');

    // Initialize socket connection
    socketRef.current = io('http://localhost:7979', {
      withCredentials: true
    });

    // Socket events and handlers
    const handleSocketEvents = () => {
      socketRef.current?.on('connect', () => {
        socketRef.current?.on('user_verified', () => {
          socketRef.current?.emit('getCurrentUser');
          socketRef.current?.emit('getUserRooms');
          socketRef.current?.emit('getBlockedUsers');

        });
      });
  
      socketRef.current?.on('currentUser', (user: User) => {
        setLoggedInUser(user);
      });

      socketRef.current?.on('getBlockedUsers', (data) => {
        // data would be an array of blocked users' IDs
        setBlockedUsers(data);
    });
  
      socketRef.current?.on('getUserRooms', (rooms: Room[]) => {
        const directRooms2 = rooms.filter((room: Room) => room.roomType === 'DIRECT');
        setDirectRooms(directRooms2);
  
        const nonDirectRooms = rooms.filter((room: Room) => room.roomType !== 'DIRECT');
        setChannels(nonDirectRooms);
        console.log("Direct Rooms");
        console.log(directRooms2);
        console.log("Non Direct Rooms");
        console.log(nonDirectRooms);
      });
  
      socketRef.current?.on('joinedRoom', (newRoom: Room) => {
        if(newRoom.roomType === 'DIRECT' && newRoom.users) {
          setDirectRooms((prevRooms) => [...prevRooms, newRoom]);
        } else if (newRoom.users) {
          setChannels((prevRooms) => [...prevRooms, newRoom]);
        }
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
    };

    handleSocketEvents();

    // Clean up on unmount
    return () => {
      socketRef.current?.off('getUserRooms');
      socketRef.current?.off('newMessage');
      socketRef.current?.off('getBlockedUsers');
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
      const otherUser = selectedRoom.users.find(user => user.id !== loggedInUser.id);
      if (otherUser) {
        setIsUserBlocked(blockedUsers.includes(otherUser.id));
      }
    }
  }, [selectedRoom, loggedInUser, blockedUsers]);
  
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
              <img src={Pic} alt="Profile" />
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
                        let otherUser = dm.users.find(user => user.id !== loggedInUser?.id);
                        let otherUsername = otherUser ? otherUser.username : 'Unknown user';

                        return (
                          <li key={index}>
                            <button onClick={() => {
                              setNewChannelOpened(false); 
                              setNewDirectOpened(false); 
                              setSelectedRoom(dm); 
                              setOtherUsername(otherUsername);
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
            {selectedRoom && 
              <div 
                className="chat-header" 
                onClick={selectedRoom.roomType === 'DIRECT' ? () => {
                  setIsChatHeaderClicked(!isChatHeaderClicked);
                  } : undefined}>
                {selectedRoom.roomType === 'DIRECT' ? <h2>{otherUsername}</h2> : <h2>{selectedRoom.roomName}</h2>}
                          {/* Block/Unblock Modal */}
                {isChatHeaderClicked && (
                  <div className="block-menu">
                    {!isUserBlocked 
                      ? <button onClick={blockUser}>Block User</button> 
                      : <button onClick={unblockUser}>Unblock User</button>
                    }
                  </div>
                )}
              </div>
            }

            
            {/* Messages */}
            <div className={newChannelOpened || newDirectOpened ? "messages creation-window" : "messages"} ref={messagesContainerRef}>
            
            { newChannelOpened && (
              <div className="new-chat-create new-chat-create-group">
                <h3>Create Group Chat</h3>
                <input type="text" placeholder="Usernames separated by comma" value={groupChatUsername} onChange={e => setGroupChatUsername(e.target.value)} />
                <input type="text" placeholder="Room Name" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} />
                <select onChange={e => setRoomType(e.target.value as 'PUBLIC' | 'PRIVATE' | 'PASSWORD')}>
                  <option value='PUBLIC'>Public</option>
                  <option value='PRIVATE'>Private</option>
                  <option value='PASSWORD'>Password Protected</option>
                </select>
                <button onClick={() => createNewChat(roomType, groupChatUsername.split(',').map(name => name.trim()))}>Create Group Chat</button>

                  <button onClick={() => {setNewChannelOpened(false)}}>Cancel</button>
              </div>
            )}

            { newDirectOpened && (
              <div className="new-chat-create">
                <h3>Create Direct Message</h3>
                <input type="text" placeholder="Username" value={directMessageUsername} onChange={e => setDirectMessageUsername(e.target.value)} />
                <button onClick={() => createNewChat('DIRECT', [directMessageUsername])}>Create Direct Message</button>

                <button onClick={() => {setNewDirectOpened(false)}}>Cancel</button>
              </div>
              )}

              {/* First message */}
              {selectedRoom && selectedRoom.messages.map((message, index) => (
                <div 
                  className={`message ${loggedInUser && loggedInUser.id === message.userId ? "user-message" : "other-message"}`} 
                  key={index}
                >
                  {!(loggedInUser && loggedInUser.id === message.userId) && <img src={Pic} alt="Profile" />}
                  <div className={(loggedInUser && loggedInUser.id === message.userId) ? "message-content user-message-content" : "message-content"}>
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