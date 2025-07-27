import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, X } from 'lucide-react'; // includes alert close icon

const Login = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Clear old error
        setLoading(true);
        try {
            await login(username, password);
            navigate('/Profile');
        } catch (err) {
            console.error("Login failed:", err);
            setError(err.response?.data?.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Welcome Back</h2>

                {/* Alert for errors */}
                {error && (
                    <div className="relative mb-4 p-3 text-sm text-red-800 bg-red-100 border border-red-300 rounded-lg">
                        {error}
                        <button 
                            type="button" 
                            onClick={() => setError(null)}
                            className="absolute top-2 right-2 text-red-700 hover:text-red-900"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Username Input */}
                    <div>
                        <label className="block mb-1 text-gray-600 font-medium">Username</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            placeholder="Enter your username" 
                            required 
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Password Input with Eye Icon */}
                    <div>
                        <label className="block mb-1 text-gray-600 font-medium">Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                placeholder="Enter your password" 
                                required 
                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)} 
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full py-2 font-semibold rounded-lg transition duration-300 ${
                            loading
                                ? 'bg-blue-300 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Logging in...
                            </div>
                        ) : (
                            "Login"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;

