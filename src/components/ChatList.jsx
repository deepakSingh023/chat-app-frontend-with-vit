import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // For navigation to ChatPage

const ChatList = () => {
    const { user } = useAuth();
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null); // Error state
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFriends = async () => {
            if (user) {
                try {
                    const response = await axios.get('https://chat-app-backend-ybof.onrender.com/api/auth/friends', {
                        headers: { Authorization: `Bearer ${user.token}` }
                    });
                    setFriends(response.data);
                } catch (error) {
                    console.error('Error fetching friends:', error);
                    setError('Failed to fetch friends. Please try again later.'); // Set error message
                } finally {
                    setLoading(false); // End loading state
                }
            }
        };

        fetchFriends();
    }, [user]);

    const openChat = (friendId) => {
        navigate(`/chat/${friendId}`); // Navigate to the ChatPage with friend's ID
    };

    if (loading) {
        return <div>Loading friends...</div>; // Loading message
    }

    return (
        <div>
            <h3>Friends</h3>
            {error && <div style={{ color: 'red' }}>{error}</div>} {/* Display error message */}
            <ul>
                {friends.length > 0 ? (
                    friends.map(friend => (
                        <li key={friend._id}>
                            {friend.username}
                            <button onClick={() => openChat(friend._id)}>Chat</button> {/* Chat button */}
                        </li>
                    ))
                ) : (
                    <li>No friends found.</li> // Handling case where no friends are available
                )}
            </ul>
        </div>
    );
};

export default ChatList;
