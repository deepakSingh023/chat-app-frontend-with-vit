import { createContext, useContext, useState } from 'react';
import axios from 'axios';

// Create an authentication context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // Login function
    const login = async (username, password) => {
        try {
            // Make API request for login
            const response = await axios.post('http://localhost:5000/api/auth/login', { username, password });
            
            // Log the full response to check its structure
            console.log('Full response:', response);

            // Assuming response.data contains token and user information
            const { token, user: userData } = response.data || {};  // Handle undefined response safely
            
            // Log userData to check if it's correctly retrieved
            console.log('User data:', userData);

            // Check if userData and userData._id exist before accessing them
            if (userData && userData._id) {
                console.log('User ID:', userData._id);
            } else {
                console.log('No user ID found in the response.');
            }

            // Set the user state with the received data and token
            if (userData) {
                setUser({ ...userData, token });
                localStorage.setItem('token', token);
                localStorage.setItem('userID', userData.id)
            }
            console.log(localStorage.getItem('token'))

        } catch (error) {
            // Handle any errors during the login process
            console.error('Login error:', error.response ? error.response.data : error.message);
            throw error; // Optionally, rethrow the error to handle it elsewhere
        }
    };

    // Registration function
    const register = async (username, password) => {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', { username, password });
            return response.data; // Return any useful data
        } catch (error) {
            console.error('Registration error:', error.response ? error.response.data : error.message);
            throw error; // Rethrow for handling elsewhere
        }
    };

    // Logout function
    const logout = () => {
        setUser(null); // Clear the user state on logout
        localStorage.removeItem('token'); // Remove token from local storage
    };

    // Provide the user state and functions to the context
    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);