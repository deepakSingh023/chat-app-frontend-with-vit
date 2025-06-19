// import { useEffect, useState } from 'react';
// import io from 'socket.io-client';
// import { useParams } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import axios from 'axios';

// const socket = io('https://chat-app-backend-ybof.onrender.com'); // Update with your server URL

// const Chat = () => {
//     const { friendId } = useParams();
//     const { user } = useAuth();
//     const [messages, setMessages] = useState([]);
//     const [message, setMessage] = useState('');

//     useEffect(() => {
//         console.log("Current User:", user.id);
//         console.log("Friend ID:", friendId);

//         const fetchMessages = async () => {
//             if (!user || !friendId) {
//                 console.error('User or friendId not found');
//                 return;
//             }

//             try {
//                 const response = await axios.get(`https://chat-app-backend-ybof.onrender.com/api/messages/${user.id}/${friendId}`, {
//                     headers: {
//                         Authorization: `Bearer ${user.token}`, // Assuming the token is stored in the user object
//                     },
//                 });
//                 setMessages(response.data);
//             } catch (error) {
//                 console.error('Error fetching messages:', error);
//             }
//         };

//         fetchMessages();

//         socket.on('receiveMessage', (newMessage) => {
//             setMessages((prevMessages) => [...prevMessages, newMessage]);
//         });

//         return () => {
//             socket.off('receiveMessage');
//         };
//     }, [user, friendId]);

//     const sendMessage = async () => {
//         if (!user || !friendId) {
//             console.error('User or friendId not found');
//             return;
//         }
    
//         const messageData = {
//             senderId: user.id,   // Ensure user.id is correct
//             receiverId: friendId,
//             content: message,
//         };
    
//         try {
//             // Send the message data to the backend
//             await axios.post('https://chat-app-backend-ybof.onrender.com/api/messages', messageData, {
//                 headers: {
//                     Authorization: `Bearer ${user.token}`,
//                 },
//             });
    
//             // Emit the message via socket.io
//             socket.emit('sendMessage', messageData);
    
//             // Clear the input field after sending
//             setMessage('');
//         } catch (error) {
//             console.error('Error sending message:', error);
//         }
//     };
    

//     // Add a loading state or conditional rendering based on user and friendId
//     if (!user || !friendId) {
//         return <div>Loading or invalid chat...</div>; // Prevent errors when user or friendId is not available
//     }

//     return (
//         <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
//             <h1>Live Chat with Friend</h1>
//             <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #ddd', padding: '10px' }}>
//                 {messages.map((msg) => (
//                     <div key={msg._id} style={{ margin: '5px 0' }}>
//                         <strong>{msg.sender.username}: </strong>
//                         {msg.content}
//                         <span style={{ marginLeft: '10px', fontSize: 'small', color: 'gray' }}>
//                             {new Date(msg.timestamp).toLocaleTimeString()}
//                         </span>
//                     </div>
//                 ))}
//             </div>
//             <input
//                 type="text"
//                 value={message}
//                 onChange={(e) => setMessage(e.target.value)}
//                 style={{ width: '70%', padding: '10px', marginRight: '10px' }}
//             />
//             <button onClick={sendMessage} style={{ padding: '10px 20px' }}>Send</button>
//         </div>
//     );
// };

// export default Chat;



import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Create socket instance outside component (single instance)
const socket = io('https://chat-app-backend-ybof.onrender.com', {
  autoConnect: false,
  transports: ['websocket'],
});

const Chat = () => {
    const { friendId } = useParams();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef(null);
    const socketInitialized = useRef(false);
    const tempIdRef = useRef(null);

    useEffect(() => {
        console.log("Current User:", user?.id);
        console.log("Friend ID:", friendId);

        const fetchMessages = async () => {
            if (!user || !friendId) {
                console.error('User or friendId not found');
                return;
            }

            try {
                const response = await axios.get(`https://chat-app-backend-ybof.onrender.com/api/messages/${user.id}/${friendId}`, {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                });
                setMessages(response.data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        fetchMessages();

        // Initialize socket connection with authentication
        if (!socketInitialized.current && user?.token) {
            socket.auth = { token: user.token };
            socket.connect();
            socketInitialized.current = true;
        }

        const handleReceiveMessage = (newMessage) => {
            console.log('Received new message:', newMessage);
            
            // Check if message is relevant to this chat
            const isRelevant = 
                (newMessage.senderId === user.id && newMessage.receiverId === friendId) ||
                (newMessage.senderId === friendId && newMessage.receiverId === user.id);
            
            if (isRelevant) {
                setMessages(prevMessages => {
                    // Check if message already exists
                    if (prevMessages.some(msg => msg._id === newMessage._id)) {
                        return prevMessages;
                    }
                    
                    // Replace optimistic message if exists
                    if (tempIdRef.current) {
                        const existingIndex = prevMessages.findIndex(
                            msg => msg._id === tempIdRef.current
                        );
                        
                        if (existingIndex !== -1) {
                            const newMessages = [...prevMessages];
                            newMessages[existingIndex] = newMessage;
                            tempIdRef.current = null;
                            return newMessages;
                        }
                    }
                    
                    return [...prevMessages, newMessage];
                });
            }
        };

        socket.on('receiveMessage', handleReceiveMessage);

        return () => {
            socket.off('receiveMessage', handleReceiveMessage);
        };
    }, [user, friendId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e) => {
        e?.preventDefault();
        if (!message.trim() || !user || !friendId) {
            console.error('Cannot send message - missing data');
            return;
        }
    
        const messageData = {
            senderId: user.id,
            receiverId: friendId,
            content: message.trim(),
        };
    
        try {
            // Create temporary message for optimistic UI
            tempIdRef.current = `temp-${Date.now()}`;
            const tempMessage = {
                ...messageData,
                _id: tempIdRef.current,
                timestamp: new Date().toISOString(),
                sender: { username: user.username || 'You' },
                isOptimistic: true
            };
            
            // Add to UI immediately
            setMessages(prev => [...prev, tempMessage]);
            setMessage('');
    
            // Send to backend
            const response = await axios.post(
                'https://chat-app-backend-ybof.onrender.com/api/messages', 
                messageData, 
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );
            
            // Emit via socket for real-time delivery
            socket.emit('sendMessage', {
                ...response.data,
                sender: { username: user.username || 'You' }
            });
            
        } catch (error) {
            console.error('Error sending message:', error);
            // Remove optimistic message on error
            setMessages(prev => prev.filter(msg => msg._id !== tempIdRef.current));
            setMessage(messageData.content);
            tempIdRef.current = null;
        }
    };

    if (!user || !friendId) {
        return <div>Loading or invalid chat...</div>;
    }

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h1>Live Chat with Friend</h1>
            <div 
                style={{ 
                    maxHeight: '400px', 
                    overflowY: 'auto', 
                    marginBottom: '20px', 
                    border: '1px solid #ddd', 
                    padding: '10px' 
                }}
            >
                {messages.map((msg) => (
                    <div 
                        key={msg._id} 
                        style={{ 
                            margin: '5px 0',
                            textAlign: msg.senderId === user.id ? 'right' : 'left'
                        }}
                    >
                        <div
                            style={{
                                display: 'inline-block',
                                padding: '8px 12px',
                                borderRadius: '12px',
                                backgroundColor: msg.senderId === user.id ? '#3b82f6' : '#e5e7eb',
                                color: msg.senderId === user.id ? 'white' : 'black',
                                maxWidth: '70%',
                                opacity: msg.isOptimistic ? 0.7 : 1
                            }}
                        >
                            <strong>{msg.senderId === user.id ? 'You' : (msg.sender?.username || 'Unknown')}: </strong>
                            {msg.content}
                            <div style={{ 
                                marginTop: '4px', 
                                fontSize: 'small', 
                                color: msg.senderId === user.id ? '#dbeafe' : '#6b7280'
                            }}>
                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) : 'Sending...'}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} style={{ display: 'flex' }}>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={{ 
                        flex: 1, 
                        padding: '10px', 
                        marginRight: '10px',
                        borderRadius: '20px',
                        border: '1px solid #ddd',
                        outline: 'none',
                        fontSize: '16px'
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage(e)}
                />
                <button 
                    type="submit" 
                    style={{ 
                        padding: '10px 20px', 
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                    disabled={!message.trim()}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;