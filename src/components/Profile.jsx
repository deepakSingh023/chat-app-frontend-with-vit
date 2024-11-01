import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [profilePic, setProfilePic] = useState(''); 
    const [description, setDescription] = useState(''); 
    const [file, setFile] = useState(null); 
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        const loadProfileData = async () => {
            // Assuming user is an object with an id property
            const id =localStorage.getItem('userID')// Get the user ID directly from the user object
            const token = localStorage.getItem('token'); // Ensure you get the token from localStorage
    
            if (!token) {
                console.error('No token found in localStorage');
                return;
            }
    
            try {
                const response = await axios.get(`http://localhost:5000/api/uploads/getUserInfo/${id}`, { // Use template literals correctly
                    headers: { Authorization: `Bearer ${token}` },
                });
    
                setProfilePic(response.data.profilepic); 
                setDescription(response.data.description);
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };
    
        loadProfileData();
    }, [token, user]); // Include user in the dependency array to re-run effect if user changes
    

    const handleSearch = async () => {
        if (!token) {
            console.error('No token found in localStorage');
            return;
        }
        if (searchTerm) {
            try {
                const response = await axios.get(`http://localhost:5000/api/auth/search?name=${searchTerm}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setSearchResults(response.data);
            } catch (error) {
                console.error('Error searching users:', error);
            }
        }
    };

    const sendFriendRequest = async (receiverId) => {
        if (!token) {
            console.error('No token found in localStorage');
            return;
        }

        try {
            const response = await axios.post(
                'http://localhost:5000/api/auth/friend-request',
                { receiverId }, 
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            console.log('Friend request sent:', response.data);
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]); 
    };

    const handleProfileUpdate = async () => {
        if (!token) {
            console.error('No token found in localStorage');
            return;
        }

        const formData = new FormData();
        formData.append('description', description);
        if (file) {
            formData.append('profilepic', file);
        }

        try {
            const response = await axios.post('http://localhost:5000/api/uploads/setUserInfo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.profilepic) {
                setProfilePic(response.data.profilepic);
            }
            console.log('Profile updated successfully:', response.data);
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const goToPendingRequests = () => {
        navigate('/PendingRequest'); 
    };

    const goToFriendList = () => {
        navigate('/FriendList');
    };

    const goToChatList = () => {
        navigate('/ChatList');
    };

   

    return (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-5xl mx-auto mt-10 flex">
            {/* Profile Section */}
            <div className="w-1/2 pr-4">
                <h1 className="text-4xl font-bold text-blue-600 mb-8 text-center">Profile</h1>

                <div className="text-center mb-8">
                    <img
                        src={profilePic && profilePic !== "default.jpg"
                            ? `http://localhost:5000/uploads/${profilePic}?${new Date().getTime()}` 
                            : `http://localhost:5000/assets/default.jpg`} 
                        alt="Profile"
                        className="w-36 h-36 rounded-full mx-auto border-4 border-green-500"
                    />
                </div>

                <div className="mb-6">
                    <input 
                        type="file" 
                        onChange={handleFileChange} 
                        className="block w-full text-lg text-blue-600 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                    />
                </div>

                <div className="mb-6">
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Update your description"
                        rows="4"
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                </div>

                <div className="mb-8">
                    <button
                        onClick={handleProfileUpdate}
                        className="bg-green-500 text-white py-2 px-6 rounded-lg hover:bg-green-600 transition"
                    >
                        Update Profile
                    </button>
                </div>
            </div>

            {/* Actions Section */}
            <div className="w-1/2 pl-4">
                <div className="mb-6 flex items-center justify-center">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users"
                        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button 
                        onClick={handleSearch} 
                        className="bg-blue-500 text-white ml-4 py-2 px-6 rounded-lg hover:bg-blue-600 transition"
                    >
                        Search
                    </button>
                </div>

                <ul className="mb-8">
                    {searchResults.map((result) => (
                        <li key={result._id} onClick={() => navigate(`/info/${result._id}`)} className="py-2 border-b border-gray-200 flex justify-between">
                            {result.username}
                            <button
                                onClick={() => sendFriendRequest(result._id)}
                                className="bg-blue-500 text-white py-1 px-4 rounded-lg hover:bg-blue-600 transition"
                            >
                                Add Friend
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="flex flex-col space-y-4">
                    <button onClick={goToPendingRequests} className="bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition">View Pending Requests</button>
                    <button onClick={goToFriendList} className="bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition">View Friends List</button>
                    <button onClick={goToChatList} className="bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition">View Chat List</button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
