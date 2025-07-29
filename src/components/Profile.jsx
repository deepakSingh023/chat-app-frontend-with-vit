import { useState, useEffect, useCallback } from 'react';
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
  const [isSearching, setIsSearching] = useState(false);

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

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term) => {
      if (!term.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await axios.get(
          `https://chat-app-backend-ybof.onrender.com/api/auth/search?name=${term}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSearchResults(response.data);
      } catch (error) {
        console.error('Error searching users:', error.message);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [token]
  );

  // Debounce utility function
  function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex flex-col xl:flex-row max-w-7xl mx-auto p-4 lg:p-8 gap-6 lg:gap-8">
        {/* Left Side: Profile Info */}
        <div className="w-full xl:w-2/5 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Profile Header with Gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-32 relative">
            <div className="absolute inset-0 bg-black opacity-10"></div>
          </div>
          
          <div className="px-6 lg:px-8 pb-8">
            {/* Profile Picture */}
            <div className="flex justify-center -mt-16 mb-6">
              <div className="relative">
                {profilePic?.url ? (
                  <img
                    src={profilePic.url}
                    alt="Profile"
                    className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-4 border-white shadow-xl object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-4 border-white shadow-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-3xl lg:text-4xl font-bold">
                      {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            </div>

            {/* User Info */}
            <div className="text-center mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-3">{user?.username}</h1>
              <p className="text-gray-600 text-base lg:text-lg leading-relaxed px-4">
                {description || 'Welcome to my profile! Add a description to tell others about yourself.'}
              </p>
            </div>

            {/* Update Form */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Update Profile
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewProfilePic(e.target.files[0])}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Tell others about yourself..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    rows="4"
                  />
                </div>
                
                <button
                  onClick={handleProfileUpdate}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Search + Navigation */}
        <div className="w-full xl:w-3/5 space-y-6">
          {/* Search Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
              Find Friends
            </h2>
            
            {/* Search Bar */}
            <div className="relative mb-6">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Start typing to search users..."
                className="w-full px-6 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                {isSearching ? (
                  <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
            </div>

            {/* Search Results */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((result) => (
                    <div
                      key={result._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 border border-gray-200"
                    >
                      <div 
                        onClick={() => navigate(`/info/${result._id}`)}
                        className="flex items-center space-x-4 cursor-pointer hover:text-blue-600 transition-colors duration-200 flex-1"
                      >
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {result.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800 text-lg">{result.username}</span>
                      </div>
                      <button
                        onClick={() => sendFriendRequest(result._id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
                      >
                        Add Friend
                      </button>
                    </div>
                  ))}
                </div>
              ) : searchTerm && !isSearching ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-lg">No users found</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Navigation Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
              Quick Actions
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
              <button
                onClick={() => navigate('/FriendList')}
                className="flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Friends List</span>
              </button>
              
              <button
                onClick={() => navigate('/ChatList')}
                className="flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Chat List</span>
              </button>
              
              <button
                onClick={() => navigate('/PendingRequest')}
                className="flex items-center justify-center space-x-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transform hover:scale-105 transition-all duration-200 shadow-lg sm:col-span-2 xl:col-span-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Pending Requests</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};

export default Profile;