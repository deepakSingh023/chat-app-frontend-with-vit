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
                        <div className="text-sm font-bold mb-1">
                            {senderName}
                        </div>
                        <img 
                            src={msg.fileUrl} 
                            alt={msg.fileName || 'Image'} 
                            className="max-w-full max-h-48 rounded-lg cursor-pointer"
                            onClick={() => window.open(msg.fileUrl, '_blank')}
                        />
                        {msg.fileName && <div className="text-xs mt-1">{msg.fileName}</div>}
                    </div>
                );
            } else {
                return (
                    <div>
                        <div className="text-sm font-bold mb-1">
                            {senderName}
                        </div>
                        <a 
                            href={msg.fileUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-blue-600 no-underline flex items-center gap-1"
                        >
                            📎 {msg.fileName || 'Download File'}
                        </a>
                    </div>
                );
            }
        } else if (msg.content) {
            return (
                <div>
                    <div className="text-sm font-bold mb-1">
                        {senderName}
                    </div>
                    <div>{msg.content}</div>
                </div>
            );
        } else {
            // Handle case where message has neither content nor file
            return (
                <div>
                    <div className="text-sm font-bold mb-1">
                        {senderName}
                    </div>
                    <em className="text-gray-500">[Message content unavailable]</em>
                </div>
            );
        }
    };

    if (!user || !friendId) return <div>Loading or invalid chat...</div>;

    return (
        <div className="p-2.5 border border-gray-300 rounded-md max-w-full min-h-screen box-border">
            {/* User and Friend Info Header */}
            <div className="flex justify-between items-center mb-4 p-2.5 bg-gray-50 rounded-lg flex-wrap gap-2.5">
                <div className="flex flex-col items-start min-w-[120px]">
                    <div className="text-sm text-gray-600 mb-0.5">You</div>
                    <div className="font-bold text-lg">{user.username}</div>
                </div>
                <div className="text-2xl text-blue-600 flex items-center">💬</div>
                <div className="flex flex-col items-end min-w-[120px]">
                    <div className="text-sm text-gray-600 mb-0.5">
                        {isFriendOnline ? '🟢 Online' : '⚪ Offline'}
                    </div>
                    <div className="font-bold text-lg">{friendInfo?.username || 'Friend'}</div>
                </div>
            </div>
            
            {/* Chat Messages Container */}
            <div className="h-[calc(100vh-250px)] min-h-[300px] max-h-[600px] overflow-y-auto mb-4 border border-gray-300 p-2.5 bg-gray-100 rounded-lg">
                {messages.map((msg) => {
                    const isSender = msg.sender._id === user.id || msg.sender === user.id;
                    return (
                        <div
                            key={msg._id}
                            className={`my-2.5 ${isSender ? 'text-right' : 'text-left'}`}
                        >
                            <div className={`inline-block px-3 py-2 rounded-xl max-w-[85%] break-words border shadow-sm ${
                                isSender 
                                    ? 'bg-green-100 border-gray-300' 
                                    : 'bg-white border-gray-300'
                            }`}>
                                {renderMessageContent(msg)}
                                <div className="text-xs text-gray-600 mt-1">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex items-center gap-2 flex-wrap p-2.5 bg-white rounded-lg border border-gray-300">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 min-w-[200px] px-3 py-3 border border-gray-300 rounded-md text-base disabled:opacity-50"
                    placeholder="Type your message"
                    disabled={isLoading}
                />
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    className="text-sm min-w-[100px] disabled:opacity-50"
                />
                <button 
                    onClick={sendMessage} 
                    disabled={isLoading || (!message.trim() && !file)}
                    className={`px-5 py-3 text-white border-none rounded-md text-sm font-bold min-w-[80px] whitespace-nowrap ${
                        isLoading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isLoading ? 'Sending...' : 'Send'}
                </button>
            </div>

            {/* File Preview */}
            {file && (
                <div className="mt-2.5 px-3 py-2 bg-blue-50 rounded-md border border-blue-200 text-sm">
                    📎 Selected file: {file.name}
                </div>
            )}
        </div>
    );
};

export default Chat;