import React, { useState } from 'react';
import { DirectRoom, User, userPic } from './Chat';  
import UserProfile from './UserProfile'; // adjust path as necessary


interface ChatHeaderProps {
  selectedDirectRoom: DirectRoom | null;
  isChatHeaderClicked: boolean;
  isUserBlocked: boolean;
  loggedInUser: User | null;
  userPics: userPic[];
  currentUserPic: string | null; // Profile picture of the current user
  blockUser: (user_id: number) => void
  unblockUser: (user_id: number) => void;
  setIsChatHeaderClicked: (clicked: boolean) => void;
  inviteToGame: (user_id: number) => void
}


const DirectMessagesHeader: React.FC<ChatHeaderProps> = ({ selectedDirectRoom, isChatHeaderClicked, isUserBlocked, loggedInUser, blockUser, unblockUser, setIsChatHeaderClicked, userPics, currentUserPic, inviteToGame }) => {
    const [showUserProfile, setShowUserProfile] = useState(false);

    const handleViewProfile = () => {
      if (selectedDirectRoom?.receivingUser) {
        setShowUserProfile(true);
      }
    };

    const handleBlockUserClick = () => {
        if (selectedDirectRoom && selectedDirectRoom.receivingUser) {
            const otherUser = selectedDirectRoom.receivingUser;

            if (otherUser) {
                blockUser(otherUser?.user.id);
            }
        }
      };

      const handleUnblockUserClick = () => {
        if (selectedDirectRoom && selectedDirectRoom.receivingUser) {
            const otherUser = selectedDirectRoom.receivingUser;

            if (otherUser) {
                unblockUser(otherUser?.user.id);
            }
        }
      };

      const handleInviteToGameClick = () => {
        console.log("Invite to game click");
        if (selectedDirectRoom && selectedDirectRoom.receivingUser) {
        console.log("Invite to game click2");
          inviteToGame(selectedDirectRoom.receivingUser.user.id);
        }
      };
      return (
        <>
          {selectedDirectRoom && 
            <div 
              className="chat-header" 
              onClick={() => setIsChatHeaderClicked(!isChatHeaderClicked)}>
              <h2>{selectedDirectRoom.receivingUser.user.username}</h2>
              {isChatHeaderClicked && (
                <div className="members-overlay">
                  <div className="members-menu">
                    {!isUserBlocked 
                      ? <button onClick={handleBlockUserClick}>Block User</button> 
                      : <button onClick={handleUnblockUserClick}>Unblock User</button>
                    }
                    <button onClick={() => handleViewProfile()}>View Profile</button>
                    <button onClick={handleInviteToGameClick}>Invite to Game</button> 
                  </div>
                </div>
              )}
            </div>
          }
          {showUserProfile && selectedDirectRoom?.receivingUser && (
            <UserProfile user={selectedDirectRoom.receivingUser.user} closeProfile={() => setShowUserProfile(false)} userPics={userPics} currentUserPic={currentUserPic} loggedInUser={loggedInUser} />
          )}
        </>
      );
      
}

export default DirectMessagesHeader;
