import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const FriendList = () => {
    const { user } = useAuth();
    const [friends, setFriends] = useState([]);
    
    useEffect(() => {
        const token = localStorage.getItem('token'); 
        const fetchFriends = async () => {
            console.log(token)
            if (user) {
                try {
                    
                    const response = await axios.get('http://localhost:5000/api/auth/friends', {
                        headers: { Authorization: `Bearer ${token}` } // Ensure token is included
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
        const token = localStorage.getItem('token');
        try {
            await axios.post(
                'http://localhost:5000/api/auth/remove-friend', // Endpoint for removing a friend
                { friendId }, // Send the friend's ID in the body
                {
                    headers: { Authorization: `Bearer ${token}` } // Include authorization token
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
            <h3>Friends</h3>
            <ul>
                {friends.map(friend => (
                    <li key={friend._id}>
                        {friend.username}
                        <button onClick={() => removeFriend(friend._id)}>Remove</button> {/* Add Remove button */}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FriendList;

