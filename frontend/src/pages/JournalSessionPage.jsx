import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // To access the configured Axios instance
// Note: You should configure 'api' in AuthContext or use a separate API utility
const API_URL = 'http://localhost:5000/api/journals';

const JournalSessionPage = () => {
    const { user } = useAuth(); // Assuming you have an authenticated user
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    
    // State for the entire session flow
    const [sessionState, setSessionState] = useState('initial'); // 'initial', 'in_progress', 'completed'
    const [journalId, setJournalId] = useState(null);
    const [mood, setMood] = useState('');
    const [energy, setEnergy] = useState('');
    const [conversation, setConversation] = useState([]); // Stores {speaker, text, inputType, mediaUrl}
    
    // State for current user input
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // State for multi-modal input placeholders (You'll implement file uploads later)
    const [inputType, setInputType] = useState('text'); // 'text', 'audio', 'image'

    const messagesEndRef = useRef(null);

    useEffect(() => {
    const fetchHistory = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/journals', { withCredentials: true });
            setHistory(res.data.history || []); // always ensure array
        } catch (err) {
            console.error(err);
            setHistory([]);
        }
    };
    fetchHistory();
}, []);

    // Scroll to the bottom of the conversation on update
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [conversation]);

    // ----------------------------------------------------------------------
    // 1. Session Start Handler
    // ----------------------------------------------------------------------
    const handleStartSession = async () => {
        setError('');
        if (!mood || !energy) {
            setError('Please select both mood and energy level.');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/start`, { 
                initialMood: mood, 
                initialEnergyLevel: energy 
            }, { withCredentials: true }); // Send cookie
            console.log('START RES:', res.data);
            const { journalId: newId, firstQuestion } = res.data;
            
            setJournalId(newId);
            setConversation([
                { speaker: 'ai', text: firstQuestion, inputType: 'system' }
            ]);
            setSessionState('in_progress');

        } catch (err) {
            console.error('Start Session Error:', err);
            setError(err.response?.data?.message || 'Failed to start session.');
        } finally {
            setLoading(false);
        }
    };

    // ----------------------------------------------------------------------
    // 2. Continue Conversation Handler
    // ----------------------------------------------------------------------
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!userInput.trim() || loading || sessionState !== 'in_progress') return;

        const userMessage = { speaker: 'user', text: userInput, inputType: inputType };
        
        // 1. Update UI immediately with user message
        setConversation(prev => [...prev, userMessage]);
        setUserInput('');
        setLoading(true);
        setError('');
        
        try {
            // 2. Send user message to backend
            const res = await axios.post(`${API_URL}/continue/${journalId}`, {
                userInput: userMessage.text,
                inputType: userMessage.inputType,
                // In real app, you would include `mediaUrl` if inputType was audio/image
            }, { withCredentials: true });

            // 3. Update UI with AI response
            const aiMessage = { speaker: 'ai', text: res.data.aiResponse, inputType: 'system' };
            setConversation(prev => [...prev, aiMessage]);

        } catch (err) {
            console.error('Continue Session Error:', err);
            setError('Could not get AI response. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ----------------------------------------------------------------------
    // 3. Complete Session Handler
    // ----------------------------------------------------------------------
    const handleCompleteSession = async () => {
        if (!journalId || loading) return;

        setLoading(true);
        setError('');

        try {
            const res = await axios.post(`${API_URL}/complete/${journalId}`, {}, { withCredentials: true });
            
            setSessionState('completed');
            setLoading(false);
            // Optionally, show a confirmation modal or navigate to the insights page
            alert(`Session complete! Summary: ${res.data.summary}`);
            navigate('/journals'); // Navigate to journal history

        } catch (err) {
            console.error('Complete Session Error:', err);
            setError('Failed to finalize and save the journal.');
            setLoading(false);
        }
    };

    // ----------------------------------------------------------------------
    // UI Rendering Logic
    // ----------------------------------------------------------------------

    const renderChat = () => (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white rounded-lg shadow-inner">
                {conversation.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-xl p-3 rounded-xl shadow-md ${
                            msg.speaker === 'user' 
                                ? 'bg-green-100 text-gray-800' 
                                : 'bg-gray-100 text-gray-800'
                        }`}>
                            <p className="font-semibold text-xs mb-1 opacity-70">
                                {msg.speaker === 'user' ? 'You' : 'Clarity AI'}
                            </p>
                            <p>{msg.text}</p>
                            {/* Placeholder for Media Display */}
                            {msg.mediaUrl && <img src={msg.mediaUrl} alt="User input" className="mt-2 rounded-lg max-h-40" />}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-700 p-3 rounded-xl">
                            <span className="animate-pulse">Clarity is thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="mt-4 p-4 bg-white rounded-xl shadow-lg border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex space-x-3">
                    
                    {/* Input Type Select/Buttons (Simplified for text for now) */}
                    <select 
                        value={inputType} 
                        onChange={(e) => setInputType(e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-green-500 focus:border-green-500"
                        disabled={loading}
                    >
                        <option value="text">✍️ Text</option>
                        <option value="audio" disabled>🎤 Audio (WIP)</option>
                        <option value="image" disabled>🖼️ Image (WIP)</option>
                    </select>

                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={`Share your thoughts via ${inputType}...`}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={loading || inputType !== 'text'} // Disable if not text or loading
                    />
                    
                    <button
                        type="submit"
                        disabled={!userInput.trim() || loading}
                        className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150 disabled:bg-gray-400"
                    >
                        Send
                    </button>
                    
                    <button
                        type="button"
                        onClick={handleCompleteSession}
                        disabled={loading || conversation.length < 2}
                        className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition duration-150 disabled:bg-gray-400"
                    >
                        Complete Session
                    </button>
                </form>
            </div>
        </div>
    );

    const renderInitialScreen = () => (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-2xl h-full">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
                How are you feeling right now?
            </h2>
            {error && (
                <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg w-full max-w-md text-center">
                    {error}
                </div>
            )}
            
            <div className="space-y-6 w-full max-w-md">
                {/* Mood Selector */}
                <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">Mood:</label>
                    <select 
                        value={mood} 
                        onChange={(e) => setMood(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        disabled={loading}
                    >
                        <option value="">Select Mood...</option>
                        <option value="Happy">😊 Happy</option>
                        <option value="Anxious">😥 Anxious</option>
                        <option value="Tired">😴 Tired</option>
                        <option value="Neutral">😐 Neutral</option>
                        <option value="Excited">🥳 Excited</option>
                    </select>
                </div>

                {/* Energy Level Selector */}
                <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">Energy Level:</label>
                    <select 
                        value={energy} 
                        onChange={(e) => setEnergy(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        disabled={loading}
                    >
                        <option value="">Select Energy...</option>
                        <option value="High">⚡ High</option>
                        <option value="Medium">🟠 Medium</option>
                        <option value="Low">🔻 Low</option>
                    </select>
                </div>
            </div>

            <button
                onClick={handleStartSession}
                disabled={!mood || !energy || loading}
                className="mt-8 w-full max-w-md py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
                {loading ? 'Starting AI...' : 'Start Reflection'}
            </button>
        </div>
    );
    
    // Main Component Return
    return (
  <div className="min-h-screen p-8 bg-gray-100">
    <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
      Clarity AI Session
    </h1>

    {/* ---------------- Main Session/Chat Container ---------------- */}
    <div className={`h-[70vh] ${sessionState === 'initial' ? 'flex items-center justify-center' : ''}`}>
      {sessionState === 'initial' && renderInitialScreen()}
      {sessionState === 'in_progress' && renderChat()}
      {sessionState === 'completed' && (
        <div className="text-center p-10 bg-white rounded-xl shadow-lg">
          <p className="text-2xl text-green-700 font-semibold mb-4">
            🎉 Session Saved Successfully!
          </p>
          <p className="text-gray-600">
            Your reflection has been summarized and saved. Check the Insights page for feedback.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>

    {/* ---------------- Past Journals Section ---------------- */}
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Your Past Journals</h2>

      {Array.isArray(history) && history.length > 0 ? (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {history.map((j) => (
            <div key={j._id} className="p-4 bg-white rounded-lg shadow flex flex-col">
              <p className="font-semibold text-gray-700">
                Status: {j.status || 'In Progress'}
              </p>
              <p className="text-gray-600 mt-1">
                {j.journalSummaryText || 'No summary yet'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No journals found.</p>
      )}
    </div>
  </div>
);
};

export default JournalSessionPage;