import React, { useState } from 'react';
import { Room, User, BlockedUser } from './Chat';  // Import interfaces from Chat component
import { Socket } from 'socket.io-client';

interface ChatHeaderProps {
  selectedRoom: Room | null;
  loggedInUser: User | null;
  isChatHeaderClicked: boolean;
  blockedUsers: BlockedUser[];
  socketRef: React.MutableRefObject<Socket | null>;
  blockUser: (user_id: number) => void;
  unblockUser: (user_id: number) => void;
  setIsChatHeaderClicked: (clicked: boolean) => void;
}

const GroupHeader: React.FC<ChatHeaderProps> = ({ selectedRoom, loggedInUser, isChatHeaderClicked, blockedUsers, socketRef, blockUser, unblockUser, setIsChatHeaderClicked }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showBannedUsers, setShowBannedUsers] = useState(false);

  let currentUser = selectedRoom ? selectedRoom.users.find(user => user.user.id === loggedInUser?.id) : null;

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

  const setUserRole = (user: User, role: string) => {
    socketRef.current?.emit('setUserRole', {userId: user.id, roomId: selectedRoom.id, role});
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
              {currentUser?.role === 'OWNER' && (
                <button onClick={(event) => {event.stopPropagation(); setShowBannedUsers(!showBannedUsers)}}>
                  {showBannedUsers ? 'Show Members' : 'Show Banned Users'}
                </button>
              )}
                <ul>
                  {showBannedUsers 
                    ? selectedRoom.bannedUsers.map((user, index) => {
                      return (
                        <li 
                          key={index} 
                          onClick={(event) => {event.stopPropagation(); setSelectedUser(user.user);}}
                          className={selectedUser?.id === user?.user.id ? 'selected' : ''}
                        >
                          <div>
                            {user.user.username}
                            <span className="role-display">{user.role}</span>
                          </div>
                          {selectedUser?.id === user?.user.id &&
                            <div className="user-actions">
                              <button onClick={() => handleUnbanUser(user.user)}>Unban User</button>
                              <button onClick={(event) => handleMsgClick(user.user, event)}>Send Message</button>
                            </div>
                          }

                        </li>
                      )}
                    )
                    : selectedRoom.users.map((user, index) => {
                      const isUserBlocked = blockedUsers.some(blockedUser => blockedUser.blockedId === user.user.id);
                      const isUserMuted = selectedRoom.mutedUsers.some(mutedUser => mutedUser.user.id === user.user.id);
                      const isUserBanned = selectedRoom.bannedUsers.some(bannedUser => bannedUser.user.id === user.user.id)
                      return (
                        <li 
                          key={index} 
                          onClick={(event) => {event.stopPropagation(); setSelectedUser(user.user);}}
                          className={selectedUser?.id === user?.user.id ? 'selected' : ''}
                        >
                          <div>
                            {user.user.username}
                            <span className="role-display">{user.role}</span>
                          </div>
                          {selectedUser?.id === user?.user.id &&
                            <div className="user-actions">
                              {/* <button onClick={(event) => handleMsgClick(user.user, event)}>Send Message</button> */}
                              {currentUser?.user.id != user.user.id && user.role !== 'OWNER' &&
                                <>
                                 {user.role !== 'OWNER' &&
                                   <>
                                  {
                                  !isUserBlocked
                                    ? <button onClick={() => handleBlockUserClick(user.user)}>Block User</button> 
                                    : <button onClick={() => handleUnblockUserClick(user.user)}>Unblock User</button>
                                  }
                                  {currentUser && (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') &&
                                    <>
                                      {!isUserMuted 
                                        ? <button onClick={(event) => {event.stopPropagation(); handleMuteUser(user.user)}}>Mute User</button>
                                        : <button onClick={(event) => {event.stopPropagation(); handleUnmuteUser(user.user)}}>Unmute User</button>
                                      }
                                      {!isUserBanned
                                        ? <button onClick={(event) => {event.stopPropagation(); handleBanUser(user.user)}}>Ban User</button>
                                        : <button onClick={(event) => {event.stopPropagation(); handleUnbanUser(user.user)}}>Unban User</button>
                                      }
                                      <button onClick={(event) => {event.stopPropagation(); handleKickUser(user.user)}}>Kick User</button>
                                    </>
                                  }

                                  {currentUser && currentUser.role === 'OWNER' &&
                                    <>
                                      <button onClick={(event) => {event.stopPropagation(); setUserRole(user.user, 'ADMIN')}}>Make Admin</button>
                                      <button onClick={(event) => {event.stopPropagation(); setUserRole(user.user, 'MEMBER')}}>Make Member</button>
                                    </>
                                  }
                                  </>
                               }
                              </>
                          }
                            
                            </div>
                          }
                        </li>
                      )}
                    )
                  }
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
