import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios  from 'axios';

function Info() {
  const { id } = useParams();
  const token = localStorage.getItem('token');

  const [user,    setUser]    = useState(null);
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Fetching user profile for ID:', id);
    console.log('Using token:', token);

    // If we don’t have an id or token, bail out *and* clear loading
    if (!id || !token) {
      setError('Missing user ID or auth token.');
      setLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response  = await axios.get(
          `https://chat-app-backend-ybof.onrender.com/api/uploads/getUserInfo/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUser(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Could not load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [id, token]);

  const sendFriendRequest = async () => {
    try {
      const response = await axios.post(
        'https://chat-app-backend-ybof.onrender.com/api/auth/friend-request',
        {  receiverId: id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert(response.data.message || 'Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error.message);
    }
  };


  // Render
  if (loading)  return <div>Loading profile…</div>;
  if (error)    return <div className="text-red-500">{error}</div>;

  // Build image URL (cache‑bust querystring)
  const imgSrc =
  user.profilepic?.url
    ? `${user.profilepic.url}?t=${Date.now()}`  // optional cache busting
    : '/default.jpg';

  return (
    <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md">
      <img
        src={imgSrc}
        alt={`${user.username}'s avatar`}
        className="w-48 h-48 rounded-full shadow mb-4"
      />
      <h2 className="text-2xl font-bold">{user.username}</h2>
      <p className="mt-2 text-center text-gray-700">
        {user.description || 'No description provided.'}
      </p>
      <button
       onClick={() => sendFriendRequest()}

        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        Send Friend Request
      </button>
    </div>
  );
}

export default Info;
