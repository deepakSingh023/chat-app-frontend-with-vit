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
    const userRef = useRef(user); // Ref to track current user

    // Update ref when user changes
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // Fetch messages when user or friendId changes
    const fetchMessages = useCallback(async () => {
        if (!userRef.current?.id || !friendId) return;
        
        try {
            const response = await axios.get(
                `https://chat-app-backend-ybof.onrender.com/api/messages/${userRef.current.id}/${friendId}`,
                { headers: { Authorization: `Bearer ${userRef.current.token}` } }
            );
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }, [friendId]);

    useEffect(() => {
        if (!userRef.current?.id || !friendId) return;

        if (!socketInitialized.current) {
            socket.connect();
            socketInitialized.current = true;
        }

        fetchMessages();

        const handleReceiveMessage = (newMessage) => {
            setMessages(prev => {
                // Check if message already exists
                if (prev.some(msg => msg._id === newMessage._id)) return prev;
                
                // Check if it's an optimistic message we need to replace
                const existingIndex = prev.findIndex(
                    msg => msg.isOptimistic && 
                    msg.content === newMessage.content &&
                    msg.senderId === newMessage.senderId
                );

                if (existingIndex !== -1) {
                    const newMessages = [...prev];
                    newMessages[existingIndex] = newMessage;
                    return newMessages;
                }
                
                return [...prev, newMessage];
            });
        };

        socket.on('receiveMessage', handleReceiveMessage);

        return () => {
            socket.off('receiveMessage', handleReceiveMessage);
        };
    }, [fetchMessages, friendId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e) => {
        e?.preventDefault();
        if (!message.trim() || !userRef.current?.id || !friendId) return;

        const messageData = {
            senderId: userRef.current.id,
            receiverId: friendId,
            content: message.trim(),
        };

        try {
            setMessage('');
            
            // Create temporary message with optimistic flag
            const tempId = `temp-${Date.now()}`;
            const optimisticMessage = {
                ...messageData,
                _id: tempId,
                timestamp: new Date().toISOString(),
                sender: { username: userRef.current.username || 'You' },
                isOptimistic: true
            };

            setMessages(prev => [...prev, optimisticMessage]);

            await axios.post(
                'https://chat-app-backend-ybof.onrender.com/api/messages',
                messageData,
                { headers: { Authorization: `Bearer ${userRef.current.token}` } }
            );
            
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => prev.filter(msg => msg._id !== tempId));
            setMessage(messageData.content);
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