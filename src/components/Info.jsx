import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function Info() {
  const { id } = useParams(); // Get the user ID from the URL parameters
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null); // State to handle errors
  const token = localStorage.getItem('token'); // Get the token for authorization

  useEffect(() => {
    const fetchUserProfile = async () => {
      
      try {
        const response = await axios.get(`http://localhost:5000/api/uploads/getUserInfo/${id}`, { // Make sure this endpoint fetches the user by ID
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data); // Set user data
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Error fetching user data'); // Set error state
      }
    };

    fetchUserProfile(); // Fetch user data
  }, [id, token]);

  const sendFriendRequest = async () => {
    if (!token) {
      console.error('No token found in localStorage');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/friend-request',
        { receiverId: id }, // Use the user ID from the fetched user data
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('Friend request sent:', response.data);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  if (error) {
    return <div>{error}</div>; // Display error if exists
  }

  if (!user) {
    return <div>Loading...</div>; // Loading state
  }

  return (
    <div className="flex flex-col items-center">
      <img
        src={user.profilepic && user.profilepic !== "default.jpg"
          ? `http://localhost:5000/uploads/${user.profilepic}?${new Date().getTime()}`
          : `http://localhost:5000/assets/default.jpg`}
        alt={`${user.username}'s avatar`}
        className="w-48 h-48 rounded-full"
      />
      <h2 className="mt-4 text-2xl font-bold">{user.username}</h2>
      <p className="mt-2 text-center">{user.description}</p>
      <button 
        onClick={sendFriendRequest} // Attach the friend request function
        className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
      >
        Send Friend Request
      </button>
    </div>
  );
}

export default Info;



