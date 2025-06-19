import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const socket = io('https://chat-app-backend-ybof.onrender.com'); // Update with your server URL

const Chat = () => {
    const { friendId } = useParams();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        console.log("Current User:", user.id);
        console.log("Friend ID:", friendId);

        const fetchMessages = async () => {
            if (!user || !friendId) {
                console.error('User or friendId not found');
                return;
            }

            try {
                const response = await axios.get(`https://chat-app-backend-ybof.onrender.com/api/messages/${user.id}/${friendId}`, {
                    headers: {
                        Authorization: `Bearer ${user.token}`, // Assuming the token is stored in the user object
                    },
                });
                setMessages(response.data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        fetchMessages();

        socket.on('receiveMessage', (newMessage) => {
            setMessages((prevMessages) => [...prevMessages, newMessage]);
        });

        return () => {
            socket.off('receiveMessage');
        };
    }, [user, friendId]);

    const sendMessage = async () => {
        if (!user || !friendId) {
            console.error('User or friendId not found');
            return;
        }
    
        const messageData = {
            senderId: user.id,   // Ensure user.id is correct
            receiverId: friendId,
            content: message,
        };
    
        try {
            // Send the message data to the backend
            await axios.post('https://chat-app-backend-ybof.onrender.com/api/messages', messageData, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });
    
            // Emit the message via socket.io
            socket.emit('sendMessage', messageData);
    
            // Clear the input field after sending
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };
    

    // Add a loading state or conditional rendering based on user and friendId
    if (!user || !friendId) {
        return <div>Loading or invalid chat...</div>; // Prevent errors when user or friendId is not available
    }

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h1>Live Chat with Friend</h1>
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #ddd', padding: '10px' }}>
                {messages.map((msg) => (
                    <div key={msg._id} style={{ margin: '5px 0' }}>
                        <strong>{msg.sender.username}: </strong>
                        {msg.content}
                        <span style={{ marginLeft: '10px', fontSize: 'small', color: 'gray' }}>
                            {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ width: '70%', padding: '10px', marginRight: '10px' }}
            />
            <button onClick={sendMessage} style={{ padding: '10px 20px' }}>Send</button>
        </div>
    );
};

export default Chat;
