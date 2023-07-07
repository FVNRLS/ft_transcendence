import React, { useState } from 'react';
import { Socket } from 'socket.io-client';

export interface ChatDetails {
  // roomType: 'DIRECT';
  // roomName: string;
  receivingUserId: number;
}

interface NewDirectRoomState {
  username: string;
  // roomType: 'DIRECT';
}

type NewDirectMessageCreationProps = {
  setNewDirectOpened: (state: boolean) => void;
  socketRef: React.MutableRefObject<Socket | null>;
};

const NewDirectMessageCreation: React.FC<NewDirectMessageCreationProps> = ({ setNewDirectOpened, socketRef }) => {
  const [newDirectRoom, setNewDirectRoom] = useState<NewDirectRoomState>({
    username: '',
  });

  const createNewDirectChat = (newDirectMessageState: NewDirectRoomState) => {
    let chatDetails = {
      roomName: newDirectMessageState.username,
      members: [] as { id: number }[]
    };

    if (newDirectRoom.username) {
        socketRef.current?.emit('getUserIdByUsername', { username: newDirectMessageState.username }, handleDirectChatCreation(chatDetails));
    }
  };

  const handleDirectChatCreation = (chatDetails: ChatDetails) => (response: { userId: number | null }) => {
    if (response.userId) {
      chatDetails.receivingUserId = response.userId;
      socketRef.current?.emit('createDirectRoom', chatDetails);
    } else {
      console.log('User does not exist');
    }
  };

  return (
    <div className="new-chat-create new-chat-create-direct">
      <h3>Create Direct Message</h3>
      <input type="text" placeholder="Username" value={newDirectRoom.username} onChange={e => setNewDirectRoom({ ...newDirectRoom, username: e.target.value })} />
      <button onClick={() => createNewDirectChat(newDirectRoom)}>Create Direct Message</button>
      <button onClick={() => setNewDirectOpened(false)}>Cancel</button>
    </div>
  );
};

export default NewDirectMessageCreation;
