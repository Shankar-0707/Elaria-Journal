import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/journals';

const JournalsListPage = () => {
    const navigate = useNavigate();
    const [journals, setJournals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJournals = async () => {
            try {
                // IMPORTANT: Use withCredentials to send the JWT cookie
                const { data } = await axios.get(API_URL, { withCredentials: true });
                setJournals(data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch journals:", err);
                setError("Failed to load journals. Please ensure you are logged in.");
                setLoading(false);
                // Optionally redirect to login if 401 Unauthorized
                if (err.response && err.response.status === 401) {
                    navigate('/login'); 
                }
            }
        };

        fetchJournals();
    }, [navigate]);
    
    // Utility to format date for display
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen p-8 bg-gray-100 flex justify-center items-center">
                <p className="text-xl text-gray-700">Loading history...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="min-h-screen p-8 bg-gray-100">
                <div className="bg-red-100 p-6 rounded-xl shadow-lg text-red-800">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 bg-gray-100">
           {/* 🔝 NAVBAR SECTION */}
            <div className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-gray-800">🪶 Your Journal History</h1>

                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                    >
                        Dashboard
                    </button>

                    <button
                        onClick={() => navigate('/journal-session')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                         Start New Chat
                    </button>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg max-h-[100vh] overflow-y-auto">
                
                {journals.length === 0 ? (
                    <p className="text-gray-600 text-center py-10">
                        You haven't completed any journal sessions yet. Start one from the dashboard!
                    </p>
                ) : (
                    journals.map((journal) => (
                        <div key={journal._id} className="p-4 border-b border-gray-200 hover:bg-gray-50 transition overflow-auto duration-150 cursor-pointer">
                            <h3 className="font-semibold text-lg text-gray-800">
                                Session on: {formatDate(journal.createdAt)}
                            </h3>
                            <p className="text-sm text-gray-500 mb-2">
                                Initial Mood: {journal.initialMood}
                            </p>
                            <p className="text-gray-700 italic line-clamp-2 overflow-auto min-h-[50vh]">
                                Summary: "{journal.journalSummaryText || 'No summary available.'}"
                            </p>
                        </div>
                    ))
                )}

                <button
                    onClick={() => navigate('/journal-session')}
                    className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default JournalsListPage;