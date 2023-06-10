import React, { useState } from 'react';
import { Socket } from 'socket.io-client';

interface ChatDetails {
  roomType: 'DIRECT';
  roomName: string;
  members: { id: number }[];
}

interface NewDirectMessageState {
  username: string;
  roomType: 'DIRECT';
}

type NewDirectMessageCreationProps = {
  setNewDirectOpened: (state: boolean) => void;
  socketRef: React.MutableRefObject<Socket | null>;
};

const NewDirectMessageCreation: React.FC<NewDirectMessageCreationProps> = ({ setNewDirectOpened, socketRef }) => {
  const [newDirectMessage, setNewDirectMessage] = useState<NewDirectMessageState>({
    username: '',
    roomType: 'DIRECT',
  });

  const createNewDirectChat = (newDirectMessageState: NewDirectMessageState) => {
    let chatDetails = {
      roomType: newDirectMessageState.roomType,
      roomName: newDirectMessageState.username,
      members: [] as { id: number }[]
    };

    if (newDirectMessage.username) {
        socketRef.current?.emit('getUserIdByUsername', { username: newDirectMessageState.username }, handleDirectChatCreation(chatDetails));
    }
  };

  const handleDirectChatCreation = (chatDetails: ChatDetails) => (response: { userId: number | null }) => {
    if (response.userId) {
      chatDetails.members.push({ id: response.userId });
      socketRef.current?.emit('createRoom', chatDetails);
    } else {
      console.log('User does not exist');
    }
  };

  return (
    <div className="new-chat-create new-chat-create-direct">
      <h3>Create Direct Message</h3>
      <input type="text" placeholder="Username" value={newDirectMessage.username} onChange={e => setNewDirectMessage({ ...newDirectMessage, username: e.target.value })} />
      <button onClick={() => createNewDirectChat(newDirectMessage)}>Create Direct Message</button>
      <button onClick={() => setNewDirectOpened(false)}>Cancel</button>
    </div>
  );
};

export default NewDirectMessageCreation;
