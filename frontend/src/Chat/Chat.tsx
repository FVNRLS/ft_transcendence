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
import NewDirectMessageCreation, { ChatDetails } from './NewDirectRoomCreation';
import DirectMessagesHeader from './DirectMessagesHeader';
import GroupHeader from './GroupHeader';
import axios from 'axios';
import RoomsList from './RoomsList';



export interface User {
  id: number;
  username: string;
}

export interface RoomUser {
  user: User;
  role: string;
}

interface WsResponse {
  statusCode: number;
  message: string;
  data?: any;
}


interface Message {
  id: number;
  // userId: number;
  user: User;  // Add this line to include User in Message
  username: string;
  recipientUserId: number;
  roomId: number;
  createdAt: Date;
  content: string;
}

interface DirectMessage {
  id: number;
  // userId: number;
  user: User;  // Add this line to include User in Message
  username: string;
  directRoomId: number;
  createdAt: Date;
  content: string;
}

export interface userPic {
  pic: string,
  username: string
}

interface BannedUser {
  user: User;
  bannedAt: string;
}

interface MutedUser {
  user: User;
  muteExpiresAt: string | null;
}


export interface Room {
  id: number;
  roomName: string;
  roomType: 'PUBLIC' | 'PRIVATE' | 'PASSWORD' | 'DIRECT';
  password?: string;
  userId: number;
  messages: Message[]; // Adding the messages array to the Room interface
  users: RoomUser[];
  bannedUsers: BannedUser[];
  mutedUsers: MutedUser[];
}

export interface DirectRoom {
  id: number;
  clientUser: User;
  receivingUser: User;
  directMessages: DirectMessage[]; // Adding the messages array to the Room interface
  users: RoomUser[];
}

export type BlockedUser = {
  id: number;
  blockerId: number;
  blockedId: number;
  createdAt: string;
};


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
  const [directRooms, setDirectRooms] = useState<DirectRoom[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedDirectRoom, setSelectedDirectRoom] = useState<DirectRoom | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [newDirectOpened, setNewDirectOpened] = useState(false);
  const [newChannelOpened, setNewChannelOpened] = useState(false);
  const [isUserBlocked, setIsUserBlocked] = useState<boolean>(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isChatHeaderClicked, setIsChatHeaderClicked] = useState(false);
  const [profPic, setProfPic] = useState('');
  const [userPics, setUserPics] = useState<userPic[]>([]);
  const [visibleRooms, setVisibleRooms] = useState([]);


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

  const handleSendDirectMessage = () => {
    if (selectedDirectRoom && messageInput.trim().length > 0) {
      
      // Prepare the message data
      const messageData: Partial<Message> = {
        roomId: selectedDirectRoom.id,
        content: messageInput.trim(),
      };

      // Emit the 'sendMessageToRoom' event
      socketRef.current?.emit('sendMessageToDirectRoom', messageData);
  
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
  }

  const inviteToGame = (userId: number) => {
    // Emit the 'createDirectRoom' event to ensure that the room is created
    const createRoomDto: ChatDetails = { receivingUserId: userId };
    socketRef.current?.emit('createDirectRoom', createRoomDto, (response: WsResponse) => {
        // Emit the 'getDirectRoomId' event to get the room ID, regardless of whether the room was just created or already existed
        socketRef.current?.emit('getDirectRoomId', userId, (response: WsResponse) => {
            // Check if the operation was successful
            if (response.statusCode === 200) {
                // Prepare the message data
                const messageData: Partial<Message> = {
                    roomId: response.data.roomId, // use the room ID returned by the 'getDirectRoomId' event
                    content: "Let's play Ping Pong!",
                };

                // Emit the 'sendMessageToDirectRoom' event
                socketRef.current?.emit('sendMessageToDirectRoom', messageData);
            } else {
                // Handle the error here
                console.error(response.message);
            }
        });
    });
};



  

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
  
        const nonDirectRooms = rooms.filter((room: Room) => room.roomType !== 'DIRECT');
        setChannels(nonDirectRooms);

      });

      socketRef.current?.on('getUserDirectRooms', (directRooms: DirectRoom[]) => {
        if (!directRooms) {
          console.error("Received null or undefined 'directRooms'.");
          return;
        }

        setDirectRooms(directRooms);

      });
  
      socketRef.current?.on('joinedRoom', (newRoom: Room) => {
        if (newRoom.users) {
          setChannels((prevRooms) => [...prevRooms, newRoom]);
        }
      });

      socketRef.current?.on('joinedDirectRoom', (newRoom: DirectRoom) => {
        if(newRoom.users) {
          setDirectRooms((prevRooms) => [...prevRooms, newRoom]);
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

      socketRef.current?.on('newDirectMessage', (newMessage: DirectMessage) => {      
        // Define a helper function to find the room in an array of rooms
        const findRoomIndex = (directRooms: DirectRoom[]) => directRooms.findIndex(room => room.id === newMessage.directRoomId);


        console.log("newDirectMessage");
        console.log(newMessage);
        console.log(directRooms);
  
      
        // Update the directRooms state
        setDirectRooms(prev => {
          let roomIndex = findRoomIndex(prev);
          // If room is found in directRooms
          if (roomIndex !== -1) {
            const updatedRoom = { ...prev[roomIndex] };
            updatedRoom.directMessages.push(newMessage);
      
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
          if (selectedDirectRoom && selectedDirectRoom.id === newMessage.directRoomId) {
            setSelectedDirectRoom(prev => {
              // If this is the currently selected room, update it
              if (prev && prev.id === newMessage.directRoomId) {
                return { 
                  ...prev, 
                  directMessages: [...prev.directMessages, newMessage] 
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
          room.id === data.roomId ? {...room, users: room.users.filter(user => user.user.id !== data.userId)} : room
        ));
      });

      socketRef.current.on('banUser', (data) => {
        // Update channels and directRooms to remove the banned user
        setChannels(prevRooms => prevRooms.map(room =>
          room.id === data.roomId ? {
            ...room,
            users: room.users.filter(user => user.user.id !== data.userId),
            bannedUsers: [
              ...room.bannedUsers, 
              {
                user: {id: data.userId, username: data.username}, 
                bannedAt: data.bannedAt
              }
            ]  // Add user to bannedUsers
          } : room
        ));
      });
      
  
      socketRef.current.on('unbanUser', (data) => {
        // Update channels to remove the unbanned user from the list of banned users
        setChannels(prevRooms => prevRooms.map(room =>
          room.id === data.roomId ? {
            ...room, 
            bannedUsers: room.bannedUsers.filter(user => user.user.id !== data.userId)} : room
        ));
      });
      

      socketRef.current.on('muteUser', (data) => {
        // Update channels and directRooms to mute the user
        setChannels(prevRooms => prevRooms.map(room =>
          room.id === data.roomId ? {
            ...room,
            mutedUsers: [
              ...room.mutedUsers,
              {
                user: {id: data.userId, username: data.username}, // assuming `data` contains the `username`
                muteExpiresAt: data.muteExpiresAt
              }
            ]
          } : room
        ));
      });

      socketRef.current.on('unmuteUser', (data) => {
        // Update channels and directRooms to unmute the user
        setChannels(prevRooms => prevRooms.map(room =>
          room.id === data.roomId ? {
            ...room, 
            mutedUsers: room.mutedUsers.filter(mutedUser => mutedUser.user.id !== data.userId)
          } : room
        ));
      });     
      
      const setUserRoleInState = (userId: number, roomId: number, role: string) => {
        setChannels(prevChannels => {
          const updatedChannels = [...prevChannels];  // make a shallow copy of the channels array
          const roomIndex = updatedChannels.findIndex(channel => channel.id === roomId);  // find the index of the room
          if (roomIndex > -1) {
            const userIndex = updatedChannels[roomIndex].users.findIndex(user => user.user.id === userId);  // find the index of the user in the room
            if (userIndex > -1) {
              updatedChannels[roomIndex].users[userIndex].role = role;  // update the user's role
            }
          }
          return updatedChannels;
        });
      };
      
      
      const handleSetUserRole = (data: { userId: number, roomId: number, role: string }) => {
        const { userId, roomId, role } = data;
        // A function that updates the role of the user in your state
        setUserRoleInState(userId, roomId, role);
      };
      
      // When the component mounts, subscribe to 'setUserRole' event
      socketRef.current?.on('setUserRole', handleSetUserRole);
    };

    handleSocketEvents();

    // Clean up on unmount
    return () => {
      socketRef.current?.off('getUserRooms');
      socketRef.current?.off('getUserDirectRooms');
      socketRef.current?.off('newMessage');
      socketRef.current?.off('newDirectMessage');
      socketRef.current?.off('getBlockedUsers');
      socketRef.current.off('kickUser');
      socketRef.current.off('banUser');
      socketRef.current.off('unbanUser');
      socketRef.current.off('muteUser');
      socketRef.current.off('unmuteUser');
      socketRef.current?.disconnect();
    };

  }, [navigate, session, selectedRoom, selectedDirectRoom]);

      
  // Find Visible Rooms
  useEffect(() => {
    console.log("Hook should run on refresh IN PARENT");
    console.log(socketRef);
        if (socketRef.current) {
            socketRef.current.on('findVisibleRooms', (visibleRooms) => {
                console.log("findVisibleRooms");
                setVisibleRooms(visibleRooms.data.sort((a, b) => a.roomName.localeCompare(b.roomName)));
            });
        }

        // Clean up the event listener
        return () => {
            if (socketRef.current) {
                socketRef.current.off('findVisibleRooms');
            }
        };
    }, []);

  useEffect(() => {
    // Scroll to the bottom when a new message appears
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [selectedRoom, selectedDirectRoom]);


  
  //Only for direct rooms
  useEffect(() => {
    if (selectedDirectRoom && loggedInUser) {
      // const otherUser = selectedRoom.users.find(user => user.id !== loggedInUser.id);
      const otherUser = selectedDirectRoom.receivingUser;

      if (otherUser) {
        const isUserBlocked = blockedUsers.some(blockedUser => blockedUser.blockedId === otherUser.user.id);
        setIsUserBlocked(isUserBlocked);
      }
    }
  }, [selectedDirectRoom, loggedInUser, blockedUsers]);

  useEffect(() => {
    const currentRoomType = selectedRoom?.roomType; // or whatever the key for the room type is
    const currentRoomId = selectedRoom?.id;
    if (currentRoomType && currentRoomId) {
        const updatedRoom = channels.find((room) => room.id === currentRoomId);
        if (updatedRoom && JSON.stringify(updatedRoom) !== JSON.stringify(selectedRoom)) {
          setSelectedRoom(updatedRoom);
        }
    }
  }, [channels]);

  useEffect(() => {
    const currentRoomId = selectedDirectRoom?.id;
    if (currentRoomId) {
        const updatedRoom = directRooms.find((room) => room.id === currentRoomId);
        if (updatedRoom && JSON.stringify(updatedRoom) !== JSON.stringify(selectedDirectRoom)) {
          console.log("UpdatedRoom");
          console.log(updatedRoom);
          setSelectedDirectRoom(updatedRoom);
        }
    }
  }, [directRooms]);
  
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
  
  
  const handleSendClick = () => {
      if (selectedRoom) {
        handleSendMessage();
      } else if (selectedDirectRoom) {
        handleSendDirectMessage();
      }
  };
  
  
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { // added check for shift key so that user can make newlines
      event.preventDefault(); // prevents from making a newline
      handleSendClick();
    }
  };
  

  const openNewDirect = () => {
    setSelectedRoom(null);
    setSelectedDirectRoom(null);
    setNewChannelOpened(false);
    setNewDirectOpened(true);
    setIsChatHeaderClicked(false)
  }

  const openNewChannel = () => {
    setSelectedDirectRoom(null);
    setSelectedRoom(null);
    setNewDirectOpened(false);
    setNewChannelOpened(true);
    setIsChatHeaderClicked(false)
  }

  const renderMessage = (message, index) => {
    return (
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
    );
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
                          <button onClick={() => {setNewChannelOpened(false); setNewDirectOpened(false); setSelectedRoom(channel); setSelectedDirectRoom(null); setIsChatHeaderClicked(false)}}>{channel.roomName}</button>
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
                        let otherUsername = dm.receivingUser.user.username;

                        return (
                          <li key={index}>
                            <button onClick={() => {
                              setNewChannelOpened(false); 
                              setNewDirectOpened(false); 
                              setSelectedRoom(null);
                              setSelectedDirectRoom(dm); 
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
            {selectedDirectRoom &&
              // Inside the Chat component's return statement
              <DirectMessagesHeader
                selectedDirectRoom={selectedDirectRoom}
                isChatHeaderClicked={isChatHeaderClicked}
                isUserBlocked={isUserBlocked}
                loggedInUser={loggedInUser}
                setIsChatHeaderClicked={setIsChatHeaderClicked}
                userPics={userPics}
                currentUserPic={profPic}
                blockUser={blockUser}
                unblockUser={unblockUser}
                inviteToGame={inviteToGame}
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
                setIsChatHeaderClicked={setIsChatHeaderClicked}
                userPics={userPics}
                currentUserPic={profPic}
                blockUser={blockUser}
                unblockUser={unblockUser}

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
                renderMessage(message, index)
              ))}
              {selectedDirectRoom?.directMessages && selectedDirectRoom.directMessages.map((message, index) => (
                renderMessage(message, index)
              ))}
            </div>
            {/* Message Input */}
            <div className="message-input">
              <input type="text" placeholder="Type a message..." value={messageInput} onKeyDown={handleKeyPress} onChange={e => setMessageInput(e.target.value)} />
              {<button onClick={handleSendClick}>Send</button>}
            </div>
          </div>


          {/* Visible Rooms Sidebar */}
          <div className="sidebar-right">
            <div className="chat-section">
              <div className='sec-name'>
                <h3>Visible Rooms</h3>
              </div>
              <RoomsList socketRef={socketRef} visibleRooms={visibleRooms} />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default Chat;