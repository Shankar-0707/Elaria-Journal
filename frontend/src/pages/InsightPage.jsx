// /frontend/src/pages/InsightsPage.js

import React from 'react';
import { useNavigate } from 'react-router-dom';

const InsightsPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen p-8 bg-gray-100">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
                📈 AI Insights & Progress
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* AI Feedback Section */}
                <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                        Key Feedbacks
                    </h2>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>**Feedback 1:** Focus on setting clearer boundaries (Recurring theme).</li>
                        <li>**Feedback 2:** Emotional honesty improved this week.</li>
                        <li>**Feedback 3:** Your energy is consistently lowest on Wednesdays.</li>
                    </ul>
                </div>
                
                {/* Calendar Placeholder */}
                <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                        Journaling Calendar
                    </h2>
                    <p className="text-gray-600 mb-4">
                        **Status:** This will be a calendar view where dates you journaled are marked, showing your consistency.
                    </p>
                    {/* Mock Calendar Grid */}
                    <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-500 gap-1">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div key={day} className="py-2">{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 text-center gap-1">
                        {Array(30).fill(0).map((_, i) => (
                            <div 
                                key={i} 
                                className={`py-2 rounded-lg ${i % 3 === 0 ? 'bg-green-300 text-green-900 font-bold' : 'bg-gray-100 text-gray-600'}`}
                            >
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={() => navigate('/journal-session')}
                className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
                Back to Dashboard
            </button>
        </div>
    );
};

export default InsightsPage;