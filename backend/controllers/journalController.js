// /backend/controllers/journalController.js

import asyncHandler from 'express-async-handler';
import Journal from '../models/JournalModel.js';
import { callAIForPrompt, callAIForSummary } from '../utils/aiService.js'; // Placeholder for AI calls
// import { transcribeAudio } from '../utils/audioService.js'; // Placeholder for STT
// import { uploadToS3 } from '../utils/storageService.js'; // Placeholder for image storage

// @desc    Start a new journal session
// @route   POST /api/journals/start
const startSession = asyncHandler(async (req, res) => {
    console.log("Body",req.body);
    console.log("User",req.user);
    const { initialMood, initialEnergyLevel } = req.body;
    
    // 1. Validate input
    if (!initialMood || !initialEnergyLevel) {
        res.status(400);
        throw new Error('Please provide both mood and energy level.');
    }

    // 2. Create the initial journal document
    const newJournal = await Journal.create({
        userId: req.user._id, // Set by protect middleware
        initialMood,
        initialEnergyLevel,
        status: 'in_progress',
        rawConversation: [],
    });
    
    // 3. Call AI to get the starting question
    const startingQuestion = await callAIForPrompt(initialMood, initialEnergyLevel);
    // const startingQuestion = `Since your mood is ${initialMood} and energy is ${initialEnergyLevel}, let's start with this: What is one small thing you accomplished today?`; // MOCK AI

    // 4. Add the initial AI turn to the conversation history
    newJournal.rawConversation.push({
        speaker: 'ai',
        text: startingQuestion,
        inputType: 'system',
    });
    await newJournal.save();

    res.status(201).json({ 
        journalId: newJournal._id,
        firstQuestion: startingQuestion,
        // Send back any other necessary session data
    });
});


// @desc    Continue the journal session (User input -> AI response)
// @route   POST /api/journals/continue/:id
const continueSession = asyncHandler(async (req, res) => {
    const journalId = req.params.id;
    const { userInput, inputType, mediaUrl } = req.body; 
    
    const journal = await Journal.findById(journalId);

    if (!journal || journal.userId.toString() !== req.user._id.toString() || journal.status === 'completed') {
        res.status(404);
        throw new Error('Journal session not found or already completed.');
    }
    
    // --- File Handling Logic (Simplified for now) ---
    let userText = userInput;
    // NOTE: For real implementation, audio/image processing happens here:
    // if (inputType === 'audio') { userText = await transcribeAudio(mediaUrl); }
    // if (inputType === 'image') { userText = await captionImage(mediaUrl); } 

    // 1. Add User's Turn
    journal.rawConversation.push({
        speaker: 'user',
        text: userText,
        inputType: inputType || 'text',
        mediaUrl: mediaUrl || undefined,
    });

    const currentHistory = journal.rawConversation.map(t => ({
        speaker: t.speaker,
        text: t.text,
    }));

    // 2. Call AI for the next response
    const aiResponse = await callAIForPrompt(currentHistory);
    // const conversationHistory = journal.rawConversation.map(t => `${t.speaker}: ${t.text}`).join('\n');
    // const aiResponse = await callAIForPrompt(conversationHistory); 
    // const aiResponse = `That's an interesting point about ${userText.substring(0, 20)}... Can you tell me more about how that made you feel?`; // MOCK AI

    // 3. Add AI's Turn
    journal.rawConversation.push({
        speaker: 'ai',
        text: aiResponse,
        inputType: 'system',
    });

    await journal.save();

    res.status(200).json({ 
        aiResponse,
    });
});


// @desc    Complete the journal session and save summary
// @route   POST /api/journals/complete/:id
const completeSession = asyncHandler(async (req, res) => {
    const journalId = req.params.id;
    
    const journal = await Journal.findById(journalId);

    if (!journal || journal.userId.toString() !== req.user._id.toString() || journal.status === 'completed') {
        res.status(404);
        throw new Error('Journal session not found or already completed.');
    }
    
    // 1. Call AI to generate summary and insights
    const { summary, feedbacks } = await callAIForSummary(journal.rawConversation); 
    // const summary = "A deep reflection on work stress, balanced by gratitude for family time. User expressed sadness but ended the session with hope."; // MOCK SUMMARY
    // const feedbacks = ["Focus on setting boundaries at work.", "You showed emotional honesty today.", "Recurring theme of low energy mid-week."]; // MOCK FEEDBACKS

    // 2. Update and save the journal document
    journal.journalSummaryText = summary;
    journal.aiFeedbacks = feedbacks;
    journal.status = 'completed';
    
    await journal.save();

    res.status(200).json({ 
        message: 'Session completed and journal saved.',
        summary,
        feedbacks,
    });
});

// @desc    Get all completed journal entries for the logged-in user
// @route   GET /api/journals
const getUserJournals = asyncHandler(async (req, res) => {
    // CRITICAL FIX: We must filter the database query by the authenticated user's ID.
    const journals = await Journal.find({ 
        userId: req.user._id, // Filter by the ID set in the 'protect' middleware
        status: 'completed' // Optionally only show completed journals
    })
    // We can also select specific fields to keep the response light
    .select('_id initialMood journalSummaryText createdAt') 
    .sort({ createdAt: -1 }); // Show newest first

    res.status(200).json(journals);
});

export { startSession, continueSession, completeSession, getUserJournals};