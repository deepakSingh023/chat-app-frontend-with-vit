import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const FriendList = () => {
    const { user } = useAuth();
    const [friends, setFriends] = useState([]);

    useEffect(() => {
        const fetchFriends = async () => {
            if (user) {
                try {
                    const response = await axios.get('https://chat-app-backend-ybof.onrender.com/api/auth/friends', {
                        headers: { Authorization: `Bearer ${user.token}` } // Ensure token is included
                    });
                    setFriends(response.data);
                } catch (error) {
                    console.error('Error fetching friends:', error);
                }
            }
        };

        fetchFriends();
    }, [user]);

    const removeFriend = async (friendId) => {
        try {
            await axios.post(
                'https://chat-app-backend-ybof.onrender.com/api/auth/remove-friend', // Endpoint for removing a friend
                { friendId }, // Send the friend's ID in the body
                {
                    headers: { Authorization: `Bearer ${user.token}` } // Include authorization token
                }
            );

            // Update the local state to remove the friend from the list
            setFriends((prevFriends) => prevFriends.filter(friend => friend._id !== friendId));
        } catch (error) {
            console.error('Error removing friend:', error);
        }
    };

    return (
        <div>
            <header className='text-center border shadow-md border-black rounded-md m-1 p-6'>
                <h1 className='text-4xl'>Friends</h1>
            </header>
            <ul className="flex flex-col items-center justify-center min-h-[50vh]">
              {friends.length > 0 ? (
                friends.map(friend => (
                  <li key={friend._id} className="flex justify-between items-center border border-black m-3 p-3 rounded-md shadow-md w-full max-w-md"
                        >
                    <span>{friend.username}</span>
                    <button
                      onClick={() => removeFriend(friend._id)}
                      className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </li>
                ))
              ) : (
                <li className="text-2xl text-gray-500">No friends found</li>
              )}
            </ul>

        </div>
    );
};

export default FriendList;

