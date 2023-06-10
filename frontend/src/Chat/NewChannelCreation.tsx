
import React, { useState } from 'react';
import { Socket } from 'socket.io-client';

interface ChatDetails {
    roomType: 'DIRECT' | 'PUBLIC' | 'PRIVATE' | 'PASSWORD';
    roomName: string;
    members: { id: number }[];
  }

interface NewChannelState {
    usernames: string[];
    roomName: string;
    roomType: 'PUBLIC' | 'PRIVATE' | 'PASSWORD';
}

type NewChannelCreationProps = {
  setNewChannelOpened: (state: boolean) => void;
  socketRef: React.MutableRefObject<Socket | null>;
};

const NewChannelCreation: React.FC<NewChannelCreationProps> = ({ setNewChannelOpened, socketRef }) => {
    const [newChannel, setNewChannel] = useState<NewChannelState>({
      usernames: [],
      roomName: '',
      roomType: 'PUBLIC',
    });

  // Function to create a new chat
  const createNewGroupChat = (newChannelState: NewChannelState) => {

    // Chat details configuration
    let chatDetails = {
      roomType: newChannelState.roomType,
      roomName: newChannelState.roomName,
      members: [] as { id: number }[]
    };
  
    if (newChannelState.usernames) {
      // Handle group chat creation
      socketRef.current?.emit('getUsersIdsByUsernames', { usernames: newChannelState.usernames }, handleGroupChatCreation(chatDetails));
    }
  };

  const handleGroupChatCreation = (chatDetails: ChatDetails) => (response: { userIds: number[] | null }) => {
    if (response.userIds) {
      chatDetails.members.push(...response.userIds.map(id => ({id: id})));
      socketRef.current?.emit('createRoom', chatDetails);
    } else {
      console.log('Users do not exist');
    }
  };

  const handleUsernameChange = (usernamesString: string) => {
    const usernamesArray = usernamesString.split(',').map(name => name.trim());
    setNewChannel(prevState => ({ ...prevState, usernames: usernamesArray }));
  };
  

  return (
    <div className="new-chat-create new-chat-create-group">
      <h3>Create Group Chat</h3>
      <input type="text" placeholder="Usernames separated by comma" value={newChannel.usernames} onChange={e => handleUsernameChange(e.target.value)} />
      <input type="text" placeholder="Room Name" value={newChannel.roomName} onChange={e => setNewChannel(prev => ({ ...prev, roomName: e.target.value }))} />
      <select onChange={e => setNewChannel(prev => ({ ...prev, roomType: e.target.value as 'PUBLIC' | 'PRIVATE' | 'PASSWORD' }))}>
        <option value='PUBLIC'>Public</option>
        <option value='PRIVATE'>Private</option>
        <option value='PASSWORD'>Password Protected</option>
      </select>
      <button onClick={() => createNewGroupChat(newChannel)}>Create Group Chat</button>
      <button onClick={() => setNewChannelOpened(false)}>Cancel</button>
    </div>
  );
};

export default NewChannelCreation;
