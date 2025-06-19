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


//import { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format, isToday, isYesterday } from 'date-fns';

// Create socket instance outside component
//const socket = io('https://chat-app-backend-ybof.onrender.com', {
  //autoConnect: false,
  //transports: ['websocket'],
  //reconnection: true,
  //reconnectionAttempts: 5,
  //reconnectionDelay: 1000,
//});

/*const Chat = () => {
    const { friendId } = useParams();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [friendUsername, setFriendUsername] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const socketInitialized = useRef(false);
    const tempIdRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Fetch friend's username
    useEffect(() => {
        const fetchFriendUsername = async () => {
            if (!friendId) return;
            try {
                const response = await axios.get(`https://chat-app-backend-ybof.onrender.com/api/users/${friendId}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setFriendUsername(response.data.username);
            } catch (error) {
                console.error('Error fetching friend username:', error);
            }
        };

        if (user?.token) fetchFriendUsername();
    }, [friendId, user]);

    // Format timestamp for messages
    const formatTimestamp = useCallback((timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        
        if (isToday(date)) {
            return format(date, 'HH:mm');
        } else if (isYesterday(date)) {
            return 'Yesterday ' + format(date, 'HH:mm');
        } else {
            return format(date, 'dd/MM/yyyy HH:mm');
        }
    }, []);

    // Fetch messages and setup socket
    useEffect(() => {
        if (!user || !friendId) return;

        const fetchMessages = async () => {
            try {
                const response = await axios.get(
                    `https://chat-app-backend-ybof.onrender.com/api/messages/${user.id}/${friendId}`,
                    { headers: { Authorization: `Bearer ${user.token}` } }
                );
                setMessages(response.data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        fetchMessages();

        // Initialize socket connection
        if (!socketInitialized.current) {
            socket.auth = { token: user.token };
            socket.connect();
            socketInitialized.current = true;
        }

        // Setup event listeners
        const handleReceiveMessage = (newMessage) => {
            const isRelevant = 
                (newMessage.senderId === user.id && newMessage.receiverId === friendId) ||
                (newMessage.senderId === friendId && newMessage.receiverId === user.id);
            
            if (isRelevant) {
                setMessages(prev => {
                    // Replace optimistic message if exists
                    if (tempIdRef.current) {
                        return prev.map(msg => 
                            msg._id === tempIdRef.current ? newMessage : msg
                        );
                    }
                    // Add new message if not already present
                    return prev.some(msg => msg._id === newMessage._id) 
                        ? prev 
                        : [...prev, newMessage];
                });
                tempIdRef.current = null;
            }
        };

        const handleTyping = (senderId) => {
            if (senderId === friendId) {
                setIsTyping(true);
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
            }
        };

        socket.on('receiveMessage', handleReceiveMessage);
        socket.on('typing', handleTyping);

        return () => {
            socket.off('receiveMessage', handleReceiveMessage);
            socket.off('typing', handleTyping);
            clearTimeout(typingTimeoutRef.current);
        };
    }, [user, friendId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle typing indicator
    const handleInputChange = (e) => {
        setMessage(e.target.value);
        if (e.target.value.trim() && socketInitialized.current) {
            socket.emit('typing', { senderId: user.id, receiverId: friendId });
        }
    };

    const sendMessage = async (e) => {
        e?.preventDefault();
        const trimmedMessage = message.trim();
        if (!trimmedMessage || !user || !friendId) return;

        const messageData = {
            senderId: user.id,
            receiverId: friendId,
            content: trimmedMessage,
        };

        try {
            // Create temporary message for optimistic UI
            tempIdRef.current = `temp-${Date.now()}`;
            setMessages(prev => [
                ...prev, 
                {
                    ...messageData,
                    _id: tempIdRef.current,
                    timestamp: new Date().toISOString(),
                    sender: { username: user.username || 'You' },
                    isOptimistic: true
                }
            ]);
            setMessage('');

            // Send to backend
            await axios.post(
                'https://chat-app-backend-ybof.onrender.com/api/messages', 
                messageData, 
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            
        } catch (error) {
            console.error('Error sending message:', error);
            // Remove optimistic message on error
            setMessages(prev => prev.filter(msg => msg._id !== tempIdRef.current));
            setMessage(trimmedMessage);
            tempIdRef.current = null;
        }
    };

    if (!user || !friendId) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-gray-500">Loading chat...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen max-w-3xl mx-auto bg-white shadow-lg">
            
            <div className="bg-indigo-600 text-white p-4 flex items-center">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                <div className="ml-3">
                    <div className="font-semibold">{friendUsername}</div>
                    <div className="text-xs opacity-80">
                        {isTyping ? 'typing...' : 'Online'}
                    </div>
                </div>
            </div>

            
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {messages.map((msg) => (
                    <div 
                        key={msg._id} 
                        className={`flex mb-4 ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.senderId === user.id 
                            ? 'bg-indigo-600 text-white rounded-br-none' 
                            : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'}`}
                        >
                            <div>{msg.content}</div>
                            <div className={`text-xs mt-1 ${msg.senderId === user.id ? 'text-indigo-200' : 'text-gray-500'}`}>
                                {formatTimestamp(msg.timestamp)}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            
            <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={sendMessage} className="flex items-center">
                    <input
                        type="text"
                        value={message}
                        onChange={handleInputChange}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 rounded-full bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(e)}
                    />
                    <button 
                        type="submit" 
                        className="ml-3 bg-indigo-600 text-white rounded-full p-3 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        disabled={!message.trim()}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};*/

//export default Chat;

import { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format, isToday, isYesterday } from 'date-fns';

// Create socket instance globally
const socket = io('https://chat-app-backend-ybof.onrender.com', {
  autoConnect: false,
  transports: ['websocket'],
});

const Chat = () => {
  const { friendId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [friendUsername, setFriendUsername] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const socketInitialized = useRef(false);
  const tempIdRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch friend's username
  useEffect(() => {
    const fetchFriendUsername = async () => {
      if (!friendId || !user?.token) return;
      try {
        const res = await axios.get(`https://chat-app-backend-ybof.onrender.com/api/users/${friendId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setFriendUsername(res.data.username);
      } catch (err) {
        console.error('Username fetch error:', err);
      }
    };
    fetchFriendUsername();
  }, [friendId, user]);

  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isToday(date)) return format(date, 'HH:mm');
    else if (isYesterday(date)) return 'Yesterday ' + format(date, 'HH:mm');
    return format(date, 'dd/MM/yyyy HH:mm');
  }, []);

  // Socket setup and message fetching
  useEffect(() => {
    if (!user || !friendId) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `https://chat-app-backend-ybof.onrender.com/api/messages/${user.id}/${friendId}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        setMessages(res.data);
      } catch (err) {
        console.error('Fetch messages error:', err);
      }
    };

    fetchMessages();

    // Connect socket
    if (!socketInitialized.current) {
      socket.auth = { token: user.token };
      socket.connect();

      socket.on('connect', () => {
        console.log('🟢 Connected to socket:', socket.id);
        socket.emit('registerUser', user.id); // REQUIRED!
      });

      socket.on('receiveMessage', (newMsg) => {
        const isRelevant =
          (newMsg.sender === user.id && newMsg.receiver === friendId) ||
          (newMsg.sender === friendId && newMsg.receiver === user.id);
        if (isRelevant) {
          setMessages((prev) => {
            if (tempIdRef.current) {
              return prev.map((m) => (m._id === tempIdRef.current ? newMsg : m));
            }
            return prev.some((m) => m._id === newMsg._id) ? prev : [...prev, newMsg];
          });
          tempIdRef.current = null;
        }
      });

      socket.on('typing', (senderId) => {
        if (senderId === friendId) {
          setIsTyping(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
        }
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      socketInitialized.current = true;
    }

    return () => {
      socket.off('receiveMessage');
      socket.off('typing');
      clearTimeout(typingTimeoutRef.current);
    };
  }, [user, friendId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (e.target.value.trim() && socketInitialized.current) {
      socket.emit('typing', { senderId: user.id, receiverId: friendId });
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || !user || !friendId) return;

    const messageData = {
      senderId: user.id,
      receiverId: friendId,
      content: trimmed,
    };

    // Optimistic update
    tempIdRef.current = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        ...messageData,
        _id: tempIdRef.current,
        timestamp: new Date().toISOString(),
        sender: { username: user.username || 'You' },
        isOptimistic: true,
      },
    ]);
    setMessage('');

    socket.emit('sendMessage', messageData);
  };

  if (!user || !friendId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-white shadow">
      {/* Header */}
      <div className="p-4 bg-indigo-600 text-white flex items-center">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="ml-3">
          <div className="font-semibold">{friendUsername}</div>
          <div className="text-xs">{isTyping ? 'typing...' : 'Online'}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`flex mb-4 ${msg.sender === user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-2xl ${
                msg.sender === user.id
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 rounded-bl-none border'
              }`}
            >
              <div>{msg.content}</div>
              <div className="text-xs mt-1 text-right opacity-60">
                {formatTimestamp(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t flex items-center">
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 bg-gray-100 rounded-full outline-none"
        />
        <button
          type="submit"
          className="ml-3 bg-indigo-600 text-white p-3 rounded-full disabled:opacity-50"
          disabled={!message.trim()}
        >
          ➤
        </button>
      </form>
    </div>
  );
};

export default Chat;
