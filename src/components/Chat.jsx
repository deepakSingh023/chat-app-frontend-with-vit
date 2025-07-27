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
    const [isLoading, setIsLoading] = useState(false);
    const [friendInfo, setFriendInfo] = useState(null);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const processedMessages = useRef(new Set()); // Track processed message IDs

    useEffect(() => {
        if (!user || !friendId) return;

        // Clear processed messages when chat changes
        processedMessages.current.clear();

        // Register the current user
        socket.emit('registerUser', user.id);

        // Join a room for this specific chat
        const roomId = [user.id, friendId].sort().join('-');
        socket.emit('joinRoom', roomId);

        // Check if friend is online
        socket.emit('checkUserOnline', friendId);

        // Listen for friend's online status
        const handleUserOnlineStatus = (data) => {
            if (data.userId === friendId) {
                setIsFriendOnline(data.isOnline);
            }
        };

        // Listen for user coming online/offline
        const handleUserStatusUpdate = (data) => {
            if (data.userId === friendId) {
                setIsFriendOnline(data.isOnline);
            }
        };

        // Listen for messages with duplicate prevention
        const handleReceiveMessage = (newMessage) => {
            // Skip if we've already processed this message
            if (processedMessages.current.has(newMessage._id)) {
                return;
            }

            processedMessages.current.add(newMessage._id);
            
            setMessages((prevMessages) => {
                // Double-check for duplicates in current state
                const messageExists = prevMessages.some(msg => msg._id === newMessage._id);
                if (messageExists) {
                    return prevMessages;
                }
                return [...prevMessages, newMessage];
            });
        };

        socket.on('userOnlineStatus', handleUserOnlineStatus);
        socket.on('userStatusUpdate', handleUserStatusUpdate);
        socket.on('receiveMessage', handleReceiveMessage);

        // Fetch friend information
        const fetchFriendInfo = async () => {
            try {
                const response = await axios.get(
                    `https://chat-app-backend-ybof.onrender.com/api/users/getFriendInfo/${friendId}`,
                    { headers: { Authorization: `Bearer ${user.token}` } }
                );
                setFriendInfo(response.data);
            } catch (error) {
                console.error('Error fetching friend info:', error);
            }
        };

        // Fetch previous messages
        const fetchMessages = async () => {
            try {
                const response = await axios.get(
                    `https://chat-app-backend-ybof.onrender.com/api/messages/${user.id}/${friendId}`,
                    { headers: { Authorization: `Bearer ${user.token}` } }
                );
                
                // Clear and rebuild processed messages set
                processedMessages.current.clear();
                response.data.forEach(msg => {
                    processedMessages.current.add(msg._id);
                });
                
                setMessages(response.data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };
        
        fetchFriendInfo();
        fetchMessages();

        // Cleanup function
        return () => {
            socket.off('userOnlineStatus', handleUserOnlineStatus);
            socket.off('userStatusUpdate', handleUserStatusUpdate);
            socket.off('receiveMessage', handleReceiveMessage);
            socket.emit('leaveRoom', roomId);
        };
    }, [user, friendId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!user || !friendId || (!message.trim() && !file)) return;
        
        setIsLoading(true);

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
            
            // Add to processed messages to prevent duplicates
            processedMessages.current.add(newMessage._id);
            
            // Create room ID for targeted message sending
            const roomId = [user.id, friendId].sort().join('-');
            
            // Emit to specific room
            socket.emit('sendMessage', {
                ...newMessage,
                roomId: roomId,
                sender: newMessage.sender,
                receiver: newMessage.receiver
            });

            // Add to local state immediately for sender
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
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
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

    const renderMessageContent = (msg) => {
        // Get sender name - check if it's the current user or friend
        const isSender = msg.sender._id === user.id || msg.sender === user.id;
        const senderName = isSender ? user.username : (friendInfo?.username || 'Friend');
        
        if (msg.fileUrl) {
            const isImage = msg.fileName && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(msg.fileName);
            
            if (isImage) {
                return (
                    <div>
                        <div style={{ fontSize: '0.9em', fontWeight: 'bold', marginBottom: '4px' }}>
                            {senderName}
                        </div>
                        <img 
                            src={msg.fileUrl} 
                            alt={msg.fileName || 'Image'} 
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '200px', 
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                            onClick={() => window.open(msg.fileUrl, '_blank')}
                        />
                        {msg.fileName && <div style={{ fontSize: '0.8em', marginTop: '4px' }}>{msg.fileName}</div>}
                    </div>
                );
            } else {
                return (
                    <div>
                        <div style={{ fontSize: '0.9em', fontWeight: 'bold', marginBottom: '4px' }}>
                            {senderName}
                        </div>
                        <a 
                            href={msg.fileUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ 
                                color: '#007bff', 
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            📎 {msg.fileName || 'Download File'}
                        </a>
                    </div>
                );
            }
        } else if (msg.content) {
            return (
                <div>
                    <div style={{ fontSize: '0.9em', fontWeight: 'bold', marginBottom: '4px' }}>
                        {senderName}
                    </div>
                    <div>{msg.content}</div>
                </div>
            );
        } else {
            // Handle case where message has neither content nor file
            return (
                <div>
                    <div style={{ fontSize: '0.9em', fontWeight: 'bold', marginBottom: '4px' }}>
                        {senderName}
                    </div>
                    <em style={{ color: '#999' }}>[Message content unavailable]</em>
                </div>
            );
        }
    };

    if (!user || !friendId) return <div>Loading or invalid chat...</div>;

    return (
        <div style={{ 
            padding: '10px', 
            border: '1px solid #ccc', 
            borderRadius: '5px', 
            maxWidth: '100%', 
            minHeight: '100vh',
            boxSizing: 'border-box'
        }}>
            {/* User and Friend Info Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                flexWrap: 'wrap',
                gap: '10px'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    minWidth: '120px'
                }}>
                    <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '2px' }}>You</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{user.username}</div>
                </div>
                <div style={{
                    fontSize: '1.5em',
                    color: '#007bff',
                    display: 'flex',
                    alignItems: 'center'
                }}>💬</div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    minWidth: '120px'
                }}>
                    <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '2px' }}>
                        {isFriendOnline ? '🟢 Online' : '⚪ Offline'}
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{friendInfo?.username || 'Friend'}</div>
                </div>
            </div>
            
            <h2 style={{ 
                margin: '0 0 15px 0', 
                fontSize: '1.3em',
                textAlign: 'center',
                display: 'none'
            }}>Chat with {friendInfo?.username || 'Friend'} ({isFriendOnline ? '🟢 Online' : '⚪ Offline'})</h2>
            <div
                style={{
                    height: 'calc(100vh - 250px)',
                    minHeight: '300px',
                    maxHeight: '600px',
                    overflowY: 'auto',
                    marginBottom: '15px',
                    border: '1px solid #ddd',
                    padding: '10px',
                    background: '#f5f5f5',
                    borderRadius: '8px'
                }}
            >
                {messages.map((msg) => {
                    const isSender = msg.sender._id === user.id || msg.sender === user.id;
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
                                    padding: '8px 12px',
                                    borderRadius: '12px',
                                    backgroundColor: isSender ? '#d4f8d4' : '#ffffff',
                                    maxWidth: '85%',
                                    wordWrap: 'break-word',
                                    border: '1px solid #ddd',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }}
                            >
                                {renderMessageContent(msg)}
                                <div style={{ fontSize: '0.7em', color: '#666', marginTop: '4px' }}>
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>

            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                flexWrap: 'wrap',
                padding: '10px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '1px solid #ddd'
            }}>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    style={{ 
                        flex: 1, 
                        minWidth: '200px',
                        padding: '12px', 
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '16px' // Prevents zoom on iOS
                    }}
                    placeholder="Type your message"
                    disabled={isLoading}
                />
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    style={{
                        fontSize: '14px',
                        minWidth: '100px'
                    }}
                />
                <button 
                    onClick={sendMessage} 
                    disabled={isLoading || (!message.trim() && !file)}
                    style={{ 
                        padding: '12px 20px',
                        backgroundColor: isLoading ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        minWidth: '80px',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {isLoading ? 'Sending...' : 'Send'}
                </button>
            </div>

            {file && (
                <div style={{ 
                    marginTop: '10px', 
                    padding: '8px 12px', 
                    background: '#e3f2fd', 
                    borderRadius: '6px',
                    border: '1px solid #bbdefb',
                    fontSize: '14px'
                }}>
                    📎 Selected file: {file.name}
                </div>
            )}
        </div>
    );
};

export default Chat;