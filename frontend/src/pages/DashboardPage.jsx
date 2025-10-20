import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
    // Get user info, loading state, and logout function from AuthContext
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            // Redirect to login page after successful logout
            navigate('/login');
        } catch (error) {
            console.error("Logout failed:", error);
            // Optionally set an error state here to show user
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-xl text-gray-700">Loading user data...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header / Navbar */}
            <header className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                        My Journal Companion
                    </h1>
                    <div className="flex items-center space-x-4">
                        {user && (
                            <span className="text-gray-600 hidden sm:inline">
                                Welcome, **{user.name || user.email}**
                            </span>
                        )}
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg shadow-md hover:bg-red-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Action Card: Start New Session */}
                    <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-green-200 hover:shadow-xl transition duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Start a New Session ✍️
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Begin your reflection by sharing your current mood and energy level.
                        </p>
                        <button
                            // You will link this to the actual Journal Session page later
                            onClick={() => navigate('/journal-session')} 
                            className="w-full py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition duration-150"
                        >
                            Begin Journaling
                        </button>
                    </div>

                    {/* Navigation Card: View Insights */}
                    <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-blue-200 hover:shadow-xl transition duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Review Insights & Progress 📈
                        </h2>
                        <p className="text-gray-600 mb-6">
                            See your mood calendar, recurring themes, and AI-driven feedback.
                        </p>
                        <button
                            // You will link this to the actual Insights page later
                            onClick={() => navigate('/insights')} 
                            className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-150"
                        >
                            Go to Insights
                        </button>
                    </div>
                    
                    {/* Navigation Card: Past Journals */}
                    <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-purple-200 hover:shadow-xl transition duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            View All Sessions 📖
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Browse and read your previous conversations and summaries.
                        </p>
                        <button
                            // You will link this to the actual Sessions/Journals list page later
                            onClick={() => navigate('/journals')} 
                            className="w-full py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition duration-150"
                        >
                            View History
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default DashboardPage;