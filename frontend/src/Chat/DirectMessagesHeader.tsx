import React from 'react';
import { DirectRoom, User } from './Chat';  // Import interfaces from Chat component

interface ChatHeaderProps {
  selectedDirectRoom: DirectRoom | null;
  isChatHeaderClicked: boolean;
  isUserBlocked: boolean;
  loggedInUser: User | null;
  blockUser: (user_id: number) => void
  unblockUser: (user_id: number) => void;
  setIsChatHeaderClicked: (clicked: boolean) => void;
}


const DirectMessagesHeader: React.FC<ChatHeaderProps> = ({ selectedDirectRoom, isChatHeaderClicked, isUserBlocked, loggedInUser, blockUser, unblockUser, setIsChatHeaderClicked }) => {

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
  return (
    <>
      {selectedDirectRoom && 
        <div 
          className="chat-header" 
          onClick={() => {
            setIsChatHeaderClicked(!isChatHeaderClicked);
            }}>
          {<h2>{selectedDirectRoom.receivingUser.user.username}</h2>}
          {/* Block/Unblock Modal */}
          {isChatHeaderClicked && (
            <div className="block-menu">
              {!isUserBlocked 
                ? <button onClick={handleBlockUserClick}>Block User</button> 
                : <button onClick={handleUnblockUserClick}>Unblock User</button>
              }
            </div>
          )}
        </div>
      }
    </>
  );
}

export default DirectMessagesHeader;
