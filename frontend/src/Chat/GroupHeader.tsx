import React, { useState } from 'react';
import { Room, User } from './Chat';  // Import interfaces from Chat component
import { Socket } from 'socket.io-client';

interface ChatHeaderProps {
  selectedRoom: Room | null;
  loggedInUser: User | null;
  isChatHeaderClicked: boolean;
  blockedUsers: number[];
  socketRef: React.MutableRefObject<Socket | null>;
  blockUser: (user_id: number) => void;
  unblockUser: (user_id: number) => void;
  setIsChatHeaderClicked: (clicked: boolean) => void;
}

const GroupHeader: React.FC<ChatHeaderProps> = ({ selectedRoom, loggedInUser, isChatHeaderClicked, blockedUsers, socketRef, blockUser, unblockUser, setIsChatHeaderClicked }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  let currentUser = selectedRoom ? selectedRoom.users.find(user => user.id === loggedInUser?.id) : null;

  const handleMsgClick = (user: User, event: React.MouseEvent) => {
    event.stopPropagation();
    // Direct message user logic goes here
  };

  const handleBlockUserClick = (user: User) => {
    blockUser(user.id);
  };

  const handleUnblockUserClick = (user: User) => {
    unblockUser(user.id);
  };

  const handleMuteUser = (user: User) => {
    socketRef.current?.emit('muteUser', {userId: user.id, roomId: selectedRoom.id});
  };

  const handleUnmuteUser = (user: User) => {
    socketRef.current?.emit('unmuteUser', {userId: user.id, roomId: selectedRoom.id});
  };
  
  
  const handleKickUser = (user: User) => {
    socketRef.current?.emit('kickUser', {userId: user.id, roomId: selectedRoom.id});
  };
  
  const handleBanUser = (user: User) => {
    socketRef.current?.emit('banUser', {userId: user.id, roomId: selectedRoom.id});
  };

  const handleUnbanUser = (user: User) => {
    socketRef.current?.emit('unbanUser', {userId: user.id, roomId: selectedRoom.id});
  };
  


  const changePassword = () => {
    if (selectedRoom) {
      socketRef.current?.emit('updateRoomPassword', { roomId: selectedRoom.id, newPassword });
      setNewPassword('');
    }
  };

  const addPassword = () => {
    if (selectedRoom) {
      socketRef.current?.emit('updateRoomPassword', { roomId: selectedRoom.id, newPassword });
      setNewPassword('');
    }
  };

  const removePassword = () => {
    if (selectedRoom) {
      socketRef.current?.emit('removeRoomPassword', { roomId: selectedRoom.id });
    }
  };


  return (
    <>
      {selectedRoom && 
        <div 
          className="chat-header" 
          onClick={() => setIsChatHeaderClicked(!isChatHeaderClicked)}>
          <h2>{selectedRoom.roomName}</h2>
          {/* Members Modal */}
          {isChatHeaderClicked && (
            <div className="members-overlay">
              <div className="members-menu">
                <ul>
                  {selectedRoom.users.map((user, index) => {
                    const isUserBlocked = blockedUsers.includes(user.id);
                    return (
                      <li 
                        key={index} 
                        onClick={(event) => {event.stopPropagation(); setSelectedUser(user);}}
                        className={selectedUser?.id === user?.id ? 'selected' : ''}
                      >
                        <div>
                          {user.username}
                          <span className="role-display">{user.role}</span>
                        </div>
                        {selectedUser?.id === user?.id &&
                          <div className="user-actions">
                            <button onClick={(event) => handleMsgClick(user, event)}>Send Message</button>
                            {!isUserBlocked 
                              ? <button onClick={() => handleBlockUserClick(user)}>Block User</button> 
                              : <button onClick={() => handleUnblockUserClick(user)}>Unblock User</button>
                            }
                            {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER') &&
                              <>
                                {!selectedRoom.mutedUsers.some(mutedUser => mutedUser.userId === user.id) 
                                  ? <button onClick={(event) => {event.stopPropagation(); handleMuteUser(user)}}>Mute User</button>
                                  : <button onClick={(event) => {event.stopPropagation(); handleUnmuteUser(user)}}>Unmute User</button>
                                }
                                {!selectedRoom.bannedUsers.some(bannedUser => bannedUser.userId === user.id)
                                  ? <button onClick={(event) => {event.stopPropagation(); handleBanUser(user)}}>Ban User</button>
                                  : <button onClick={(event) => {event.stopPropagation(); handleUnbanUser(user)}}>Unban User</button>
                                }
                                <button onClick={(event) => {event.stopPropagation(); handleKickUser(user)}}>Kick User</button>
                              </>
                            }

                          </div>
                        }

                      </li>
                    )}
                  )}
                </ul>
                {currentUser?.role === 'OWNER' && (
                  <>
                    <input 
                      type="text" 
                      value={newPassword} 
                      onChange={(event) => {setNewPassword(event.target.value)}}
                      placeholder="New password"
                      onClick={(event) => event.stopPropagation()}
                    />
                    {selectedRoom.roomType === 'PASSWORD' ? (
                      <>
                        <button onClick={(event) => {event.stopPropagation(); changePassword()}}>Change Password</button>
                        <button onClick={(event) => {event.stopPropagation(); removePassword()}}>Remove Password</button>
                      </>
                    ) : (
                      <button onClick={(event) => {event.stopPropagation(); addPassword()}}>Add Password</button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      }
    </>
  );
}

export default GroupHeader;
