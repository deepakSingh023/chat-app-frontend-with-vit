import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Move socket outside component to prevent recreating on every render
const socket = io('https://chat-app-backend-ybof.onrender.com');

const Chat = () => {
    const { friendId } = useParams();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [file, setFile] = useState(null);
    const [isFriendOnline, setIsFriendOnline] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Add loading state
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null); // Add ref for file input

    useEffect(() => {
        if (!user || !friendId) return;

        // Register the current user
        socket.emit('registerUser', user.id);

        // Join a room for this specific chat
        const roomId = [user.id, friendId].sort().join('-');
        socket.emit('joinRoom', roomId);

        // Check if friend is online
        socket.emit('checkUserOnline', friendId);

        // Listen for friend's online status
        socket.on('userOnlineStatus', (data) => {
            if (data.userId === friendId) {
                setIsFriendOnline(data.isOnline);
            }
        });

        // Listen for user coming online/offline
        socket.on('userStatusUpdate', (data) => {
            if (data.userId === friendId) {
                setIsFriendOnline(data.isOnline);
            }
        });

        // Listen for messages - only add if not already in messages array
        socket.on('receiveMessage', (newMessage) => {
            setMessages((prevMessages) => {
                // Check if message already exists to prevent duplicates
                const messageExists = prevMessages.some(msg => msg._id === newMessage._id);
                if (messageExists) {
                    return prevMessages;
                }
                return [...prevMessages, newMessage];
            });
        });

        // Fetch previous messages
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

        // Cleanup function
        return () => {
            socket.off('userOnlineStatus');
            socket.off('userStatusUpdate');
            socket.off('receiveMessage');
            socket.emit('leaveRoom', roomId);
        };
    }, [user, friendId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!user || !friendId || (!message.trim() && !file)) return;
        
        setIsLoading(true); // Start loading

        const formData = new FormData();
        formData.append('sender', user.id);
        formData.append('receiver', friendId);
        formData.append('content', message.trim());
        if (file) {
            formData.append('file', file);
        }

        try {
            const response = await axios.post(
                'https://chat-app-backend-ybof.onrender.com/api/messages',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            const newMessage = response.data;
            
            // Create room ID for targeted message sending
            const roomId = [user.id, friendId].sort().join('-');
            
            // Emit to specific room instead of broadcasting
            socket.emit('sendMessage', {
                ...newMessage,
                roomId: roomId
            });

            // Only add to local state if it's not already there
            setMessages((prevMessages) => {
                const messageExists = prevMessages.some(msg => msg._id === newMessage._id);
                if (messageExists) {
                    return prevMessages;
                }
                return [...prevMessages, newMessage];
            });

            // Clear inputs
            setMessage('');
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Clear file input display
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false); // End loading
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (!user || !friendId) return <div>Loading or invalid chat...</div>;

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2>Chat with Friend ({isFriendOnline ? '🟢 Online' : '⚪ Offline'})</h2>
            <div
                style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    marginBottom: '20px',
                    border: '1px solid #ddd',
                    padding: '10px',
                    background: '#f5f5f5',
                }}
            >
                {messages.map((msg) => {
                    const isSender = msg.sender._id === user.id;
                    return (
                        <div
                            key={msg._id}
                            style={{
                                textAlign: isSender ? 'right' : 'left',
                                margin: '10px 0',
                            }}
                        >
                            <div
                                style={{
                                    display: 'inline-block',
                                    padding: '10px',
                                    borderRadius: '10px',
                                    backgroundColor: isSender ? '#d4f8d4' : '#ffffff',
                                    maxWidth: '70%',
                                    wordWrap: 'break-word',
                                }}
                            >
                                {msg.fileUrl ? (
                                    <a href={msg.fileUrl} target="_blank" rel="noreferrer">
                                        📎 {msg.fileName || 'File'}
                                    </a>
                                ) : (
                                    <>
                                        <strong>{msg.sender.username}: </strong>
                                        {msg.content}
                                    </>
                                )}
                                <div style={{ fontSize: '0.7em', color: '#666', marginTop: '4px' }}>
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    style={{ flex: 1, padding: '10px' }}
                    placeholder="Type your message"
                    disabled={isLoading}
                />
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    disabled={isLoading}
                />
                <button 
                    onClick={sendMessage} 
                    disabled={isLoading || (!message.trim() && !file)}
                    style={{ 
                        padding: '10px 20px',
                        backgroundColor: isLoading ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isLoading ? 'Sending...' : 'Send'}
                </button>
            </div>
        </div>
    );
};

export default Chat;