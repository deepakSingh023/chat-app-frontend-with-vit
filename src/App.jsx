import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import PrivateRoute from './components/PrivateRoute';
import Home from './components/Home'
import FriendList from './components/FriendList'
import Profile from './components/Profile';
import PendingRequest from './components/PendingRequest';
import ChatList from './components/ChatList';

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" exact element={<Home/>} />
                    <Route path="/PendingRequest" exact element={<PendingRequest/>} />
                    <Route path="/Profile" exact element={<Profile/>} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/FriendList" element={<FriendList />}/>
                    <Route path="ChatList" element={<ChatList/>}/>
                    <Route 
                        path="/chat/:friendId" 
                        element={
                            <PrivateRoute>
                                <Chat />
                            </PrivateRoute>
                        } 
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
