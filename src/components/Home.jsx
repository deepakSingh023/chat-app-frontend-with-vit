import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <header className="bg-blue-600 py-4">
                <div className="container mx-auto px-4">
                    <h1 className="text-white text-3xl font-bold">TALKY</h1>
                </div>  
            </header>
             <main className="flex-grow flex flex-col items-center justify-center px-4">
                {/* Welcome Message */}
                <h1 className="text-4xl font-bold text-gray-800 mb-6">Welcome to the Chat App!</h1>

                {/* Buttons */}
                <div className="space-y-4">
                    <Link to="/login">
                        <button className="w-40 px-4 py-2 bg-blue-500 text-white text-lg rounded-lg hover:bg-blue-700 transition duration-300">
                            Login
                        </button>
                    </Link>

                    <Link to="/register">
                        <button className="w-40 px-4 py-2 bg-green-500 text-white text-lg rounded-lg hover:bg-green-700 transition duration-300">
                            Register
                        </button>
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default Home;
