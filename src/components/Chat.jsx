import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const socket = io('https://chat-app-backend-ybof.onrender.com');

const Chat = () => {
    const { friendId } = useParams();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [file, setFile] = useState(null);
    const [isFriendOnline, setIsFriendOnline] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (!user || !friendId) return;
        console.log('User ID:', user.id);
        console.log('Friend ID:', friendId);

        // Fetch previous messages
        const fetchMessages = async () => {
            try {
                const response = await axios.get(
                    `https://chat-app-backend-ybof.onrender.com/api/messages/${user.id}/${friendId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${user.token}`,
                        },
                    }
                );
                setMessages(response.data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        fetchMessages();

        // Socket listeners
        socket.emit('userOnline', user.id);
        socket.emit('checkOnline', friendId);

        socket.on('receiveMessage', (newMessage) => {
            setMessages((prev) => [...prev, newMessage]);
        });

        socket.on('onlineStatus', (isOnline) => {
            setIsFriendOnline(isOnline);
        });

        return () => {
            socket.off('receiveMessage');
            socket.off('onlineStatus');
        };
    }, [user, friendId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!user || !friendId || (!message && !file)) return;

        const formData = new FormData();
        formData.append('sender', user.id);
        formData.append('receiver', friendId);
        formData.append('content', message);
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
            socket.emit('sendMessage', newMessage);
            setMessages((prev) => [...prev, newMessage]);
            setMessage('');
            setFile(null);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
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

            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ width: '60%', padding: '10px', marginRight: '10px' }}
                placeholder="Type your message"
            />
            <input
                type="file"
                onChange={handleFileChange}
                style={{ marginRight: '10px' }}
            />
            <button onClick={sendMessage} style={{ padding: '10px 20px' }}>
                Send
            </button>
        </div>
    );
};

export default Chat;
