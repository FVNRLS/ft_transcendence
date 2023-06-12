import React from 'react';
import { Room, User } from './Chat';  // Import interfaces from Chat component

interface ChatHeaderProps {
  selectedRoom: Room | null;
  isChatHeaderClicked: boolean;
  isUserBlocked: boolean;
  loggedInUser: User | null;
  blockUser: (user_id: number) => void
  unblockUser: (user_id: number) => void;
  setIsChatHeaderClicked: (clicked: boolean) => void;
}




const DirectMessagesHeader: React.FC<ChatHeaderProps> = ({ selectedRoom, isChatHeaderClicked, isUserBlocked, loggedInUser, blockUser, unblockUser, setIsChatHeaderClicked }) => {

    const handleBlockUserClick = () => {
        if (selectedRoom && selectedRoom.receivingUser) {
            const otherUser = selectedRoom.receivingUser;

            if (otherUser) {
                blockUser(otherUser?.id);
            }
        }
      };

      const handleUnblockUserClick = () => {
        if (selectedRoom && selectedRoom.receivingUser) {
            const otherUser = selectedRoom.receivingUser;

            if (otherUser) {
                unblockUser(otherUser?.id);
            }
        }
      };
  return (
    <>
      {selectedRoom && 
        <div 
          className="chat-header" 
          onClick={selectedRoom.roomType === 'DIRECT' ? () => {
            setIsChatHeaderClicked(!isChatHeaderClicked);
            } : undefined}>
          {selectedRoom.roomType === 'DIRECT' ? <h2>{selectedRoom.receivingUser.username}</h2> : <h2>{selectedRoom.roomName}</h2>}
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
