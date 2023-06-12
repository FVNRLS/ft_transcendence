// import React from 'react';
// import { Room } from './Chat';  // Import interfaces from Chat component

// interface ChatHeaderProps {
//   selectedRoom: Room | null;
//   isChatHeaderClicked: boolean;
// }

// const GroupHeader: React.FC<ChatHeaderProps> = ({ selectedRoom, isChatHeaderClicked }) => {
//   return (
//     <>
//       {selectedRoom && 
//         <div 
//           className="chat-header" 
//           onClick={undefined}>
//           {<h2>{selectedRoom.roomName}</h2>}
//           {/* Block/Unblock Modal */}
//           {isChatHeaderClicked && (
//             <div className="block-menu">
//             </div>
//           )}
//         </div>
//       }
//     </>
//   );
// }

// export default GroupHeader;

// import React, { useState } from 'react';
// import { Room, User } from './Chat';  // Import interfaces from Chat component

// interface ChatHeaderProps {
//   selectedRoom: Room | null;
//   isChatHeaderClicked: boolean;
//   setIsChatHeaderClicked: (clicked: boolean) => void;
// }

// const GroupHeader: React.FC<ChatHeaderProps> = ({ selectedRoom, isChatHeaderClicked, setIsChatHeaderClicked }) => {
//   const [selectedUser, setSelectedUser] = useState<User | null>(null);

//   const handleBlockClick = (user: User) => {
//     // Block or unblock user logic goes here
//   };

//   const handleMsgClick = (user: User) => {
//     // Direct message user logic goes here
//   };

//   return (
//     <>
//       {selectedRoom && 
//         <div 
//           className="chat-header" 
//           onClick={() => setIsChatHeaderClicked(!isChatHeaderClicked)}>
//           <h2>{selectedRoom.roomName}</h2>
//           {/* Members Modal */}
//           {isChatHeaderClicked && (
//             <div className="members-overlay">
//               <div className="members-menu">
//                 <ul>
//                   {selectedRoom.users.map((user, index) => (
//                     <li 
//                       key={index} 
//                       onClick={() => setSelectedUser(user)}
//                       className={selectedUser === user ? 'selected' : ''}
//                     >
//                       {user.username}
//                       {selectedUser === user &&
//                         <div className="user-actions">
//                           <button onClick={() => handleBlockClick(user)}>Block/Unblock</button>
//                           <button onClick={() => handleMsgClick(user)}>Send Message</button>
//                         </div>
//                       }
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             </div>
//           )}
//         </div>
//       }
//     </>
//   );
// }

// export default GroupHeader;


// import React, { useState } from 'react';
// import { Room, User } from './Chat';  // Import interfaces from Chat component

// interface ChatHeaderProps {
//   selectedRoom: Room | null;
//   isChatHeaderClicked: boolean;
//   blockedUsers: number[];
//   blockUser: (user_id: number) => void;
//   unblockUser: (user_id: number) => void;
//   setIsChatHeaderClicked: (clicked: boolean) => void;
// }

// const GroupHeader: React.FC<ChatHeaderProps> = ({ selectedRoom, isChatHeaderClicked, blockedUsers, blockUser, unblockUser, setIsChatHeaderClicked }) => {
//   const [selectedUser, setSelectedUser] = useState<User | null>(null);

//   // const handleBlockClick = (user: User, event: React.MouseEvent) => {
//   //   event.stopPropagation();
//   //   // Block or unblock user logic goes here
//   // };

//   const handleBlockUserClick = (user: User, event?: React.MouseEvent) => {
//     // event.stopPropagation();
//     blockUser(user.id);
//   };

//   const handleUnblockUserClick = (user: User, event?: React.MouseEvent) => {
//     // event.stopPropagation();
//     unblockUser(user.id);
//   };

//   const handleMsgClick = (user: User, event: React.MouseEvent) => {
//     event.stopPropagation();
//     // Direct message user logic goes here
//   };

//   return (
//     <>
//       {selectedRoom && 
//         <div 
//           className="chat-header" 
//           onClick={() => setIsChatHeaderClicked(!isChatHeaderClicked)}>
//           <h2>{selectedRoom.roomName}</h2>
//           {/* Members Modal */}
//           {isChatHeaderClicked && (
//             <div className="members-overlay">
//               <div className="members-menu">
//                 <ul>
//                   {selectedRoom.users.map((user, index) => (
//                     <li 
//                       key={index} 
//                       onClick={(event) => {event.stopPropagation(); setSelectedUser(user);}}
//                       className={selectedUser === user ? 'selected' : ''}
//                     >
//                       {user.username}
//                       {selectedUser === user &&
//                         <div className="user-actions">
//                           {/* <button onClick={(event) => handleBlockClick(user, event)}>Block/Unblock</button> */}
//                           {!isUserBlocked 
//                             ? <button onClick={() => handleBlockUserClick(user)}>Block User</button> 
//                             : <button onClick={() => handleUnblockUserClick(user)}>Unblock User</button>
//                           }
//                           <button onClick={(event) => handleMsgClick(user, event)}>Send Message</button>
//                         </div>
//                       }
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             </div>
//           )}
//         </div>
//       }
//     </>
//   );
// }

// export default GroupHeader;


import React, { useState } from 'react';
import { Room, User } from './Chat';  // Import interfaces from Chat component

interface ChatHeaderProps {
  selectedRoom: Room | null;
  isChatHeaderClicked: boolean;
  blockedUsers: number[];
  blockUser: (user_id: number) => void;
  unblockUser: (user_id: number) => void;
  setIsChatHeaderClicked: (clicked: boolean) => void;
}

const GroupHeader: React.FC<ChatHeaderProps> = ({ selectedRoom, isChatHeaderClicked, blockedUsers, blockUser, unblockUser, setIsChatHeaderClicked }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleBlockUserClick = (user: User) => {
    blockUser(user.id);
  };

  const handleUnblockUserClick = (user: User) => {
    unblockUser(user.id);
  };

  const handleMsgClick = (user: User, event: React.MouseEvent) => {
    event.stopPropagation();
    // Direct message user logic goes here
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
                        className={selectedUser === user ? 'selected' : ''}
                      >
                        {user.username}
                        {selectedUser === user &&
                          <div className="user-actions">
                            {!isUserBlocked 
                              ? <button onClick={() => handleBlockUserClick(user)}>Block User</button> 
                              : <button onClick={() => handleUnblockUserClick(user)}>Unblock User</button>
                            }
                            <button onClick={(event) => handleMsgClick(user, event)}>Send Message</button>
                          </div>
                        }
                      </li>
                    )}
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      }
    </>
  );
}

export default GroupHeader;
