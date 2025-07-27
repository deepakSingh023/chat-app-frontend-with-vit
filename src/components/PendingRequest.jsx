import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PendingRequest = () => {
    const [pendingRequests, setPendingRequests] = useState([]);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchPendingRequests = async () => {
            if (!token) {
                console.error('No token found in localStorage');
                return;
            }

            try {
                const response = await axios.get('https://chat-app-backend-ybof.onrender.com/api/auth/pending-requests', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                console.log('API Response:', response.data);

                if (response.data && response.data.pendingRequests) {
                    setPendingRequests(response.data.pendingRequests);
                } else {
                    console.warn('Unexpected response structure:', response.data);
                    setPendingRequests([]);
                }
            } catch (error) {
                console.error('Error fetching pending friend requests:', error);
            }
        };

        fetchPendingRequests();
    }, [token]);

    const acceptFriendRequest = async (requestID) => {
        const token = localStorage.getItem('token');
        console.log('Accepting friend request ID:', requestID);

        if (!token) {
            console.error('No token found in localStorage');
            return;
        }

        try {
            await axios.post(
                'https://chat-app-backend-ybof.onrender.com/api/auth/accept-request',
                { id: requestID },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setPendingRequests((prev) =>
                prev.filter((request) => request.userId !== requestID)
            );

            alert('Friend request accepted!');
        } catch (error) {
            console.error('Error accepting friend request:', error.response?.data || error.message);
        }
    };

    const rejectFriendRequest = async (requestID) => {
        const token = localStorage.getItem('token');

        if (!token) {
            console.error('No token found in localStorage');
            return;
        }

        try {
            await axios.post(
                'https://chat-app-backend-ybof.onrender.com/api/auth/reject-request',
                { id: requestID },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setPendingRequests((prev) =>
                prev.filter((request) => request.userId !== requestID)
            );
        } catch (error) {
            console.error('Error rejecting friend request:', error.response?.data || error.message);
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-800">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 to-green-500 shadow-md text-white px-6 py-4">
                <h1 className="text-2xl font-bold">Friend Requests</h1>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto p-6">
                <h2 className="text-xl font-semibold mb-4">Pending Friend Requests</h2>

                {pendingRequests.length > 0 ? (
                    <ul className="space-y-4">
                        {pendingRequests.map((request) => (
                            <li key={request.userId} className="bg-gray-100 p-4 rounded-lg shadow-sm flex justify-between items-center">
                                <span className="font-medium text-lg">{request.username}</span>
                                <div className="space-x-2">
                                    <button
                                        onClick={() => acceptFriendRequest(request.userId)}
                                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => rejectFriendRequest(request.userId)}
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600 text-center mt-10">No pending friend requests</p>
                )}
            </main>
        </div>
    );
};

export default PendingRequest;
