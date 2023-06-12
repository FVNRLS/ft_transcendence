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
import NewChannelCreation from './NewChannelCreation';
import NewDirectMessageCreation from './NewDirectMessageCreation';
import DirectMessagesHeader from './DirectMessagesHeader';
import GroupHeader from './GroupHeader';


interface Message {
  id: number;
  userId: number;
  roomId: number;
  createdAt: Date;
  content: string;
}

// Defining interface for User and Room
export interface User {
  id: number;
  username: string;
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
    console.log("Block User");
        socketRef.current?.emit('blockUser', { blockedId: user_id }, (response: any) => {
          if (response.success) {
            setIsUserBlocked(true);
            socketRef.current?.emit('getBlockedUsers');
          } else {
            console.error('Block user failed:', response.message);
          }
        });
        
    //   }
    // }
  }
  
  const unblockUser = (user_id: number) => {
    // if (selectedRoom && selectedRoom.receivingUser) {
      // const otherUser = selectedRoom.users.find(user => user.id !== loggedInUser?.id);
      // const otherUser = selectedRoom.receivingUser;

      // if (otherUser) {
        // socketRef.current?.emit('unblockUser', { blockedId: otherUser.id });
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
      // const otherUser = selectedRoom.users.find(user => user.id !== loggedInUser.id);
      const otherUser = selectedRoom.receivingUser;

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
                selectedRoom={selectedRoom}
                isChatHeaderClicked={isChatHeaderClicked}
                blockedUsers={blockedUsers}
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