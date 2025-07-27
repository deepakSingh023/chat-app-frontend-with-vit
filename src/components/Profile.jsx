import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [description, setDescription] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newProfilePic, setNewProfilePic] = useState(null);

  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  // Fetch latest user profile
  useEffect(() => {
    const fetchProfile = async () => {
      
      if (!user.id || !token) return;

      try {
        const response = await axios.get(
          `https://chat-app-backend-ybof.onrender.com/api/uploads/getUserInfo/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log('Fetched profile:', response.data);
        setDescription(response.data.description);
        setProfilePic(response.data.profilepic );
      } catch (error) {
        console.error('Error fetching profile:', error.message);
      }
    };

    fetchProfile();
  }, [user, token]);

  // Search users
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      const response = await axios.get(
        `https://chat-app-backend-ybof.onrender.com/api/auth/search?name=${searchTerm}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error.message);
    }
  };

  // Send friend request
  const sendFriendRequest = async (receiverId) => {
    try {
      const response = await axios.post(
        'https://chat-app-backend-ybof.onrender.com/api/auth/friend-request',
        { receiverId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert(response.data.message || 'Friend request sent!');
      setSearchResults((prev) =>
        prev.filter((user) => user._id !== receiverId)
      );
    } catch (error) {
      console.error('Error sending friend request:', error.message);
    }
  };

  // Update profile info
  const handleProfileUpdate = async () => {
    if (!newDescription && !newProfilePic) return;

    const formData = new FormData();
    if (newDescription.trim()) formData.append('description', newDescription);
    if (newProfilePic) formData.append('profilepic', newProfilePic);

    try {
      const response = await axios.post(
        'https://chat-app-backend-ybof.onrender.com/api/uploads/setUserInfo',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const { description, profilepic } = response.data;
      setDescription(description);
      setProfilePic(profilepic);
      setNewDescription('');
      setNewProfilePic(null);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error.message);
    }
  };

  return (
    <div className="flex h-screen p-6 bg-gray-100">
      {/* Left Side: Profile Info */}
      <div className="w-1/2 flex flex-col items-center bg-white p-6 rounded-lg shadow-md space-y-4">
      <img
        src={
            profilePic?.url // if profilePic is an object with { url, public_id }
            ? profilePic.url
            : '/default.jpg'
            }
        alt="Profile"
        className="w-32 h-32 rounded-full shadow"
      />


        <h2 className="text-xl font-bold">{user?.username}</h2>
        <p className="text-center text-gray-600">{description || 'No description'}</p>

        {/* Update Form */}
        <div className="w-full pt-4 border-t mt-4">
          <h3 className="text-lg font-semibold mb-2">Update Profile</h3>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNewProfilePic(e.target.files[0])}
            className="mb-2"
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Update your description"
            className="w-full p-2 border border-gray-300 rounded mb-2"
          />
          <button
            onClick={handleProfileUpdate}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Update Profile
          </button>
        </div>
      </div>

      {/* Right Side: Search + Navigation */}
      <div className="w-1/2 flex flex-col pl-8 space-y-4">
        {/* Search Bar */}
        <div className="w-full flex items-center space-x-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Search
          </button>
        </div>

        {/* Search Results */}
        <ul className="w-full space-y-2">
          {searchResults.map((result) => (
            <li
              key={result._id}
              className="flex justify-between items-center p-2 bg-white rounded-md shadow"
            >
              <span
                onClick={() => navigate(`/info/${result._id}`)}
                className="cursor-pointer hover:text-blue-600"
              >
                {result.username}
              </span>
              <button
                onClick={() => sendFriendRequest(result._id)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Friend
              </button>
            </li>
          ))}
        </ul>

        {/* Navigation Buttons */}
        <div className="w-full space-y-2 pt-4">
          <button
            onClick={() => navigate('/FriendList')}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Friends List
          </button>
          <button
            onClick={() => navigate('/ChatList')}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
          >
            Chat List
          </button>
          <button
            onClick={() => navigate('/PendingRequest')}
            className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
          >
            Pending Requests
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;