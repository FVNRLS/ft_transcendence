import React, { useState, useEffect } from 'react';



const RoomsList = ({ socketRef, visibleRooms }) => {
    // const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [password, setPassword] = useState('');
    const [showJoinPopup, setShowJoinPopup] = useState(false);

    const joinRoom = async (roomId, password) => {
        socketRef.current?.emit('joinRoom', { roomId, password }, (response) => {
            // handle response here
            // for example, if response.statusCode is not 200, display an error message
            if(response.statusCode !== 200) {
            console.error(response.message);
            } else {
            console.log('Successfully joined the room');
            }
        });
        };

        // useEffect(() => {
        //     if (socketRef.current) {
        //         socketRef.current.on('findVisibleRooms', (visibleRooms) => {
        //             console.log("findVisibleRooms");
        //             setRooms(visibleRooms.data.sort((a, b) => a.roomName.localeCompare(b.roomName)));
        //         });
        //     }
    
        //     // Clean up the event listener
        //     return () => {
        //         if (socketRef.current) {
        //             socketRef.current.off('findVisibleRooms');
        //         }
        //     };
        // }, []);
          

    const handleRoomClick = (room) => {
        setSelectedRoom(room);
        setShowJoinPopup(true);
    };

    const handleJoinClick = () => {
        joinRoom(selectedRoom.id, password);
        setShowJoinPopup(false);
        setPassword('');
    };

    return (
        <div className="rooms-container">
            {visibleRooms.map((room) => (
            <div className="joinableRoom" key={room.id} onClick={() => handleRoomClick(room)}>
                <span className="joinableRoom-name">{room.roomName}</span>
                <span className="joinableRoom-type">{room.roomType}</span>
            </div>
            ))}
            {showJoinPopup && (
            <div className="join-popup">
                <h2>Join {selectedRoom.roomName}</h2>
                {selectedRoom.roomType === 'PASSWORD' && (
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter room password"
                />
                )}
                <button onClick={handleJoinClick}>Join</button>
                <button onClick={() => setShowJoinPopup(false)}>Cancel</button>
            </div>
            )}
        </div>
        );
    };

    export default RoomsList;


// import React, { useState, useEffect } from 'react';



// const RoomsList = ({ socketRef}) => {
//     const [visibleRooms, setVisibleRooms] = useState([]);
//     const [selectedRoom, setSelectedRoom] = useState(null);
//     const [password, setPassword] = useState('');
//     const [showJoinPopup, setShowJoinPopup] = useState(false);

//     const joinRoom = async (roomId, password) => {
//         socketRef.current?.emit('joinRoom', { roomId, password }, (response) => {
//             // handle response here
//             // for examplae, if response.statusCode is not 200, display an error message
//             if(response.statusCode !== 200) {
//             console.error(response.message);
//             } else {
//             console.log('Successfully joined the room');
//             }
//         });
//         };

//         useEffect(() => {
//             console.log("Hook should run on refresh");
//             console.log(socketRef);
//             if (socketRef.current) {
//                 socketRef.current.on('findVisibleRooms', (visibleRooms) => {
//                     console.log("findVisibleRooms");
//                     setVisibleRooms(visibleRooms.data.sort((a, b) => a.roomName.localeCompare(b.roomName)));
//                 });
//             }
    
//             // Clean up the event listener
//             return () => {
//                 if (socketRef.current) {
//                     socketRef.current.off('findVisibleRooms');
//                 }
//             };
//         }, []);
          

//     const handleRoomClick = (room) => {
//         setSelectedRoom(room);
//         setShowJoinPopup(true);
//     };

//     const handleJoinClick = () => {
//         joinRoom(selectedRoom.id, password);
//         setShowJoinPopup(false);
//         setPassword('');
//     };

//     return (
//         <div className="rooms-container">
//             {visibleRooms.map((room) => (
//             <div className="joinableRoom" key={room.id} onClick={() => handleRoomClick(room)}>
//                 <span className="joinableRoom-name">{room.roomName}</span>
//                 <span className="joinableRoom-type">{room.roomType}</span>
//             </div>
//             ))}
//             {showJoinPopup && (
//             <div className="join-popup">
//                 <h2>Join {selectedRoom.roomName}</h2>
//                 {selectedRoom.roomType === 'PASSWORD' && (
//                 <input
//                     type="password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     placeholder="Enter room password"
//                 />
//                 )}
//                 <button onClick={handleJoinClick}>Join</button>
//                 <button onClick={() => setShowJoinPopup(false)}>Cancel</button>
//             </div>
//             )}
//         </div>
//         );
//     };

//     export default RoomsList;

