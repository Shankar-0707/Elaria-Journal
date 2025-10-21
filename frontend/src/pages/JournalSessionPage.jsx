import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // To access the configured Axios instance
// Note: You should configure 'api' in AuthContext or use a separate API utility
const API_URL = 'http://localhost:5000/api/journals';

const JournalSessionPage = () => {
    const { user } = useAuth(); // Assuming you have an authenticated user
    const navigate = useNavigate();
    
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

    // NEW STATE for file upload
    const [selectedFile, setSelectedFile] = useState(null);
    const [isRecording, setIsRecording] = useState(false);

    // State for multi-modal input placeholders (You'll implement file uploads later)
    const [inputType, setInputType] = useState('text'); // 'text', 'audio', 'image'

    // ADD THESE MISSING REFS:
    const mediaRecorderRef = useRef(null); // Ref for audio recording object
    const audioChunksRef = useRef([]);     // Ref to store audio data chunks
    const fileInputRef = useRef(null);     // Ref for the file input element
    const messagesEndRef = useRef(null);

    

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
    // Show connecting message immediately
    setConversation([{ speaker: 'ai', text: 'Connecting with Clarity AI...', inputType: 'system' }]);
    
    try {
        console.log("🔄 Starting session with:", { mood, energy });
        const res = await axios.post(`${API_URL}/start`, { 
            initialMood: mood, 
            initialEnergyLevel: energy 
        }, { withCredentials: true });
        
        console.log("✅ Session started:", res.data);
        const { journalId: newId, firstQuestion } = res.data;
        
        setJournalId(newId);
        // REPLACE the loading message with actual AI response
        setConversation([{ speaker: 'ai', text: firstQuestion, inputType: 'system' }]);
        setSessionState('in_progress');

    } catch (err) {
        console.error('❌ Start Session Error:', err);
        setError(err.response?.data?.message || 'Failed to start session.');
        // Clear the loading message on error
        setConversation([]);
    } finally {
        setLoading(false);
    }
};

    // ----------------------------------------------------------------------
    // 2. Continue Conversation Handler
    // ----------------------------------------------------------------------
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (loading || sessionState !== 'in_progress') return;

    // Validate input based on type
    if (inputType === 'text' && !userInput.trim()) {
        setError('Please enter some text.');
        return;
    }

    if ((inputType === 'image' || inputType === 'audio') && !selectedFile) {
        setError(`Please select a ${inputType} file.`);
        return;
    }

    const formData = new FormData();
    
    if (inputType === 'text') {
        formData.append('userInput', userInput.trim());
        formData.append('inputType', 'text');
    } else if (selectedFile) {
        formData.append('file', selectedFile);
        formData.append('inputType', inputType);
        // Include any text input along with file (optional)
        formData.append('userInput', userInput.trim() || '');
    }

    // Create user message for UI
    const userMessage = { 
        speaker: 'user', 
        text: inputType === 'text' ? userInput.trim() : `Shared ${inputType}: ${selectedFile?.name || 'file'}`,
        inputType: inputType,
        mediaUrl: selectedFile ? URL.createObjectURL(selectedFile) : null 
    };

    // Update UI immediately
    setConversation(prev => [...prev, userMessage]);
    setUserInput('');
    setSelectedFile(null);
    setLoading(true);
    setError('');

    try {
        const res = await axios.post(`${API_URL}/continue/${journalId}`, formData, { 
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Add AI response to conversation
        const aiMessage = { 
            speaker: 'ai', 
            text: res.data.aiResponse, 
            inputType: 'system' 
        };
        setConversation(prev => [...prev, aiMessage]);

    } catch (err) {
        console.error('Continue Session Error:', err);
        setError(err.response?.data?.message || 'Failed to send message. Please try again.');
        // Remove the user message if there was an error
        setConversation(prev => prev.slice(0, -1));
    } finally {
        setLoading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
};

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp4' });
                setSelectedFile(audioBlob);
                setIsRecording(false);
                // The main send handler will use this selectedFile
            };
            
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            setError('Microphone access denied or failed.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
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
        {/* Conversation Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg">
            {conversation.map((message, index) => (
                <div
                    key={index}
                    className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                            message.speaker === 'user'
                                ? 'bg-green-500 text-white rounded-br-none'
                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                        }`}
                    >
                        {/* Show file preview for user messages */}
                        {message.mediaUrl && (
                            <div className="mb-2">
                                {message.inputType === 'image' ? (
                                    <img 
                                        src={message.mediaUrl} 
                                        alt="User shared" 
                                        className="max-w-full h-32 object-cover rounded"
                                    />
                                ) : message.inputType === 'audio' ? (
                                    <audio controls className="w-full">
                                        <source src={message.mediaUrl} type="audio/mp4" />
                                        Your browser does not support the audio element.
                                    </audio>
                                ) : null}
                            </div>
                        )}
                        
                        <p className="text-sm">{message.text}</p>
                        
                        {/* Show input type indicator */}
                        {message.speaker === 'user' && message.inputType !== 'text' && (
                            <div className="text-xs opacity-70 mt-1">
                                Sent via {message.inputType}
                            </div>
                        )}
                    </div>
                </div>
            ))}
            
            {/* Loading indicator */}
            {loading && (
                <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-lg rounded-bl-none p-3">
                        <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                    </div>
                </div>
            )}
            
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="mt-4 p-4 bg-white rounded-xl shadow-lg border-t border-gray-100">
            
            {/* Display selected file/recording status */}
            {selectedFile && inputType !== 'text' && (
                <div className="mb-3 p-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm flex justify-between items-center">
                    <span className='font-medium'>File ready to send: 
                        {inputType === 'image' ? selectedFile.name || 'Image' : 'Audio Recording'}
                    </span>
                    <button onClick={() => setSelectedFile(null)} className="text-red-600 hover:text-red-800">
                        Clear
                    </button>
                </div>
            )}
            
            {isRecording && (
                 <div className="mb-3 p-2 bg-red-100 text-red-800 rounded-lg text-sm flex justify-between items-center">
                    <span className='font-medium animate-pulse'>🔴 Recording...</span>
                    <button 
                        onClick={stopRecording} 
                        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                        Stop & Send
                    </button>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="flex space-x-3">
                
                {/* Input Type Selector/Buttons */}
                <select 
                    value={inputType} 
                    onChange={(e) => { 
                        setInputType(e.target.value); 
                        setSelectedFile(null); // Clear file on mode switch
                        setUserInput(''); // Clear text on mode switch
                    }}
                    className="p-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-green-500 focus:border-green-500"
                    disabled={loading || isRecording}
                >
                    <option value="text">✍️ Text</option>
                    <option value="audio">🎤 Audio</option>
                    <option value="image">🖼️ Image</option>
                </select>

                {inputType === 'text' && (
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Share your thoughts..."
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={loading}
                    />
                )}

                {inputType === 'image' && (
                    <div className="flex-1 flex space-x-2">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSelectedFile(e.target.files[0])}
                            ref={fileInputRef}
                            className="flex-1 p-2 border border-gray-300 rounded-lg"
                            disabled={loading}
                        />
                    </div>
                )}

                {inputType === 'audio' && !isRecording && !selectedFile && (
                     <button
                        type="button"
                        onClick={startRecording}
                        disabled={loading}
                        className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-150 disabled:bg-gray-400"
                    >
                        Start Recording
                    </button>
                )}
                
                {/* Send Button */}
                {inputType === 'text' && (
                    <button
                        type="submit"
                        disabled={!userInput.trim() || loading}
                        className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150 disabled:bg-gray-400"
                    >
                        {loading ? 'Sending...' : 'Send'}
                    </button>
                )}
                
                {/* Send Button for Files */}
                {(inputType === 'image' || inputType === 'audio') && selectedFile && (
                    <button
                        type="submit"
                        disabled={loading || isRecording}
                        className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150 disabled:bg-gray-400"
                    >
                        {loading ? 'Sending...' : 'Send File'}
                    </button>
                )}
                
                {/* Complete Session Button */}
                <button
                    type="button"
                    onClick={handleCompleteSession}
                    disabled={loading || conversation.length < 2 || isRecording}
                    className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition duration-150 disabled:bg-gray-400"
                >
                    Complete Session
                </button>
            </form>
            
            {/* Error display */}
            {error && (
                <div className="mt-3 p-2 bg-red-100 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}
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
    {/* 🌟 Navbar on top */}
    <div className="flex justify-between items-center bg-white px-6 py-4 rounded-xl shadow-md mb-6 sticky top-0 z-20">
      <h1 className="text-2xl font-extrabold text-gray-900">
        🧠 Clarity AI Session
      </h1>
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          Dashboard
        </button>
        <button
          onClick={() => navigate('/journals')}
          className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
        >
          View All Journals
        </button>
      </div>
    </div>
    {/* ---------------- Main Session/Chat Container ---------------- */}
    <div className={` ${sessionState === 'initial' ? 'flex items-center justify-center' : ''}`}>
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

    
  </div>
);
};

export default JournalSessionPage;