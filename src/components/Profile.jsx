import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Import your auth context
import axios from 'axios';
import {useNavigate} from 'react-router-dom';

const Profile = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const navigate = useNavigate();


    // Search for users
    const handleSearch = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found in localStorage');
            return;
        }
        if (searchTerm) {
            try {
                const response = await axios.get(`http://localhost:5000/api/auth/search?name=${searchTerm}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSearchResults(response.data);
            } catch (error) {
                console.error('Error searching users:', error);
            }
        }
    };

    // Send friend request
    const sendFriendRequest = async (receiverId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found in localStorage');
            return;
        }

        try {
            const response = await axios.post(
                'http://localhost:5000/api/auth/friend-request',
                { receiverId }, // Only pass receiverId
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            console.log('Friend request sent:', response.data);
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };

    // Accept friend request
    const acceptFriendRequest = async (senderId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found in localStorage');
            return;
        }

        try {
            const response = await axios.post(
                'http://localhost:5000/api/auth/accept-request',
                { senderId }, // Pass senderId in body
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            console.log('Friend request accepted:', response.data);}
            catch(error){
            console.error('Error accepting friend request:', error);
        }
    };

    const goToPendingRequests = () => {
        navigate('/PendingRequest'); // Adjust the route accordingly
    };

    // Navigate to the friend list page
    const goToFriendList = () => {
        navigate('/FriendList'); // Adjust the route accordingly
    };

    const goToChatList = () => {
        navigate('/ChatList'); // Adjust the route accordingly
    };

    return (
        <div>
            <h1> Profile</h1>

            {/* Search users */}
            <div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users"
                />
                <button onClick={handleSearch}>Search</button>

                {/* Search Results */}
                <ul>
                    {searchResults.map((result) => (
                        <li key={result._id}>
                            {result.username}
                            <button onClick={() => sendFriendRequest(result._id)}>Add Friend</button>
                        </li>
                    ))}
                </ul>
            </div>

            <button onClick={goToPendingRequests}>View Pending Friend Requests</button>
            <button onClick={goToFriendList}>View Friends List</button>
            <button onClick={goToChatList}>view chat list</button>
        </div>
    );
};

export default Profile;
