import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ChatList = () => {
    const { user } = useAuth();
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
                    setError('Failed to fetch friends. Please try again later.');
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchFriends();
    }, [user]);

    const openChat = (friendId) => {
        navigate(`/chat/${friendId}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen text-xl">
                Loading friends...
            </div>
        );
    }

    return (
        <div>
            <header className="text-center border shadow-md p-6 rounded-md m-1 border-black">
                <h1 className="text-4xl font-bold">ChatList</h1>
            </header>

            {error && (
                <div className="text-red-500 text-center my-4">{error}</div>
            )}

            <ul className="flex flex-col items-center justify-center min-h-[50vh]">
                {friends.length > 0 ? (
                    friends.map(friend => (
                        <li
                            key={friend._id}
                            className="flex justify-between items-center border border-black m-3 p-3 rounded-md shadow-md w-full max-w-md"
                        >
                            <span className="text-lg font-medium">{friend.username}</span>
                            <button
                                onClick={() => openChat(friend._id)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
                            >
                                Chat
                            </button>
                        </li>
                    ))
                ) : (
                    <li className="text-2xl text-gray-500 text-center">
                        No friends found.
                    </li>
                )}
            </ul>
        </div>
    );
};

export default ChatList;
