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

import { useEffect, useState, useRef, useCallback } from 'react';
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

    const fetchMessages = useCallback(async () => {
        if (!user?.id || !friendId) return;
        
        try {
            const response = await axios.get(
                `https://chat-app-backend-ybof.onrender.com/api/messages/${user.id}/${friendId}`,
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }, [user, friendId]);

    // Socket connection and authentication
    useEffect(() => {
        if (!user?.token) return;

        // Update socket authentication with current token
        socket.auth = { token: user.token };
        
        if (!socket.connected) {
            socket.connect();
            socketInitialized.current = true;
        }

        // Reconnect if socket gets disconnected
        const handleDisconnect = () => {
            if (user?.token) {
                socket.auth = { token: user.token };
                socket.connect();
            }
        };

        socket.on('disconnect', handleDisconnect);

        return () => {
            socket.off('disconnect', handleDisconnect);
        };
    }, [user]);

    // Message handling and event listeners
    useEffect(() => {
        if (!user?.id || !friendId) return;

        fetchMessages();

        const handleReceiveMessage = (newMessage) => {
            console.log('Received socket message:', newMessage);
            const isRelevant = 
                (newMessage.senderId === user.id && newMessage.receiverId === friendId) ||
                (newMessage.senderId === friendId && newMessage.receiverId === user.id);
            
            if (isRelevant) {
                setMessages(prev => {
                    // Check if message already exists
                    if (prev.some(msg => msg._id === newMessage._id)) return prev;
                    
                    // Replace optimistic message if exists
                    if (tempIdRef.current) {
                        const existingIndex = prev.findIndex(
                            msg => msg._id === tempIdRef.current
                        );
                        
                        if (existingIndex !== -1) {
                            const newMessages = [...prev];
                            newMessages[existingIndex] = newMessage;
                            tempIdRef.current = null;
                            return newMessages;
                        }
                    }
                    
                    return [...prev, newMessage];
                });
            }
        };

        socket.on('receiveMessage', handleReceiveMessage);
        
        // Add listener for new messages sent by the current user
        socket.on('messageSent', (sentMessage) => {
            console.log('Message sent confirmation:', sentMessage);
            if (sentMessage.senderId === user.id && sentMessage.receiverId === friendId) {
                setMessages(prev => prev.map(msg => 
                    msg.isOptimistic && msg.content === sentMessage.content ? sentMessage : msg
                ));
            }
        });

        return () => {
            socket.off('receiveMessage', handleReceiveMessage);
            socket.off('messageSent');
        };
    }, [fetchMessages, friendId, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e) => {
        e?.preventDefault();
        if (!message.trim() || !user?.id || !friendId) return;

        const messageData = {
            senderId: user.id,
            receiverId: friendId,
            content: message.trim(),
        };

        // Create temporary message with optimistic flag
        tempIdRef.current = `temp-${Date.now()}`;
        const optimisticMessage = {
            ...messageData,
            _id: tempIdRef.current,
            timestamp: new Date().toISOString(),
            sender: { username: user.username || 'You' },
            isOptimistic: true
        };

        try {
            setMessage('');
            setMessages(prev => [...prev, optimisticMessage]);

            // Emit the message via socket first for immediate delivery
            socket.emit('sendMessage', {
                ...messageData,
                sender: { username: user.username || 'You' }
            });
            
            // Then send to backend for persistence
            await axios.post(
                'https://chat-app-backend-ybof.onrender.com/api/messages',
                messageData,
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => prev.filter(msg => msg._id !== tempIdRef.current));
            setMessage(messageData.content);
            tempIdRef.current = null;
        }
    };

    if (!user || !friendId) {
        return <div className="p-4 text-center">Loading chat...</div>;
    }

    return (
        <div className="flex flex-col h-screen max-w-3xl mx-auto border border-gray-200 rounded-lg shadow-lg">
            <div className="bg-indigo-600 text-white p-4 rounded-t-lg">
                <h1 className="text-xl font-bold">Chat with {friendId}</h1>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {messages.map((msg) => {
                    const isCurrentUser = msg.senderId === user.id;
                    return (
                        <div 
                            key={msg._id} 
                            className={`flex mb-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                            <div 
                                className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                                    isCurrentUser 
                                        ? 'bg-indigo-500 text-white rounded-br-none' 
                                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                                } ${
                                    msg.isOptimistic ? 'opacity-70' : ''
                                }`}
                            >
                                <div className="font-semibold">
                                    {isCurrentUser ? 'You' : msg.sender?.username || 'Unknown'}
                                </div>
                                <div className="mt-1">{msg.content}</div>
                                <div className={`text-xs mt-1 ${isCurrentUser ? 'text-indigo-200' : 'text-gray-500'}`}>
                                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    }) : 'Sending...'}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={sendMessage} className="border-t border-gray-200 p-4 bg-white">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage(e)}
                    />
                    <button
                        type="submit"
                        disabled={!message.trim()}
                        className="bg-indigo-600 text-white rounded-full px-6 py-2 font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat;