import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState([]);

    const login = async (username, password) => {
        try {
            const response = await axios.post('https://chat-app-backend-ybof.onrender.com/api/auth/login', { username, password });
            const { token, user: userData } = response.data || {};  

            if (userData && userData.id) {
                console.log('User ID:', userData.id);
            } else {
                console.log('No user ID found in the response.');
            }

            if (userData) {
                setUser({ ...userData, token });
                localStorage.setItem('token', token);
                localStorage.setItem('userId', userData.id);
            }

        } catch (error) {
            console.error('Login error:', error.response ? error.response.data : error.message);
            throw error;
        }
    };

    const register = async (username, password) => {
        try {
            const response = await axios.post('https://chat-app-backend-ybof.onrender.com/api/auth/register', { username, password });
            return response.data;
        } catch (error) {
            console.error('Registration error:', error.response ? error.response.data : error.message);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
