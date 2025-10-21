import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/journals';

const InsightsPage = () => {
  const navigate = useNavigate();
  const [journals, setJournals] = useState([]);
  const [highlightedDates, setHighlightedDates] = useState([]);

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const res = await axios.get(API_URL, { withCredentials: true });
        setJournals(res.data);

        // Extract only the "day" from each journal's createdAt
        const dates = res.data.map(j => new Date(j.createdAt).getDate());
        setHighlightedDates(dates);

        console.log("✅ Highlighted Dates:", dates);
      } catch (err) {
        console.error('Error fetching journals:', err);
      }
    };

    fetchJournals();
  }, []);

  // Generate days for the current month dynamically
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="flex justify-between items-center bg-white px-6 py-4 rounded-xl shadow-md mb-6 sticky top-0 z-20">
        <h1 className="text-3xl font-extrabold text-gray-900">
          📈 AI Insights & Progress
        </h1>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            ⬅️ Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/journals')}
            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
          >
            📚 All Journals
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Feedback Section */}
        <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
            Key Feedbacks
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>⭐ You’re improving your self-awareness with each reflection.</li>
            <li>💬 More emotional honesty detected this week.</li>
            <li>🌿 Try writing on low-energy days for balance.</li>
          </ul>
        </div>

        {/* Calendar Section */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
            Journaling Calendar
          </h2>
          <p className="text-gray-600 mb-4">
            Dates marked in <span className="text-green-600 font-semibold">green</span> represent your journal entries for this month.
          </p>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-500 gap-1 mb-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 text-center gap-1">
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const isJournalDay = highlightedDates.includes(day);
              return (
                <div
                  key={day}
                  className={`py-2 rounded-lg ${
                    isJournalDay
                      ? 'bg-green-400 text-green-900 font-bold shadow-sm'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;
