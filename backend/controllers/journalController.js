// /backend/controllers/journalController.js

import asyncHandler from 'express-async-handler';
import Journal from '../models/JournalModel.js';
import { callAIForPrompt, callAIForSummary, callAIForMultiModal } from '../utils/aiService.js'; // Placeholder for AI calls
// import { transcribeAudio } from '../utils/audioService.js'; // Placeholder for STT
// import { uploadToS3 } from '../utils/storageService.js'; // Placeholder for image storage

// @desc    Start a new journal session
// @route   POST /api/journals/start
const startSession = asyncHandler(async (req, res) => {
    console.log("🎯 START SESSION CALLED - Body:", req.body);
    console.log("🎯 START SESSION CALLED - User:", req.user._id);
    
    const { initialMood, initialEnergyLevel } = req.body;
    
    if (!initialMood || !initialEnergyLevel) {
        console.log("❌ Missing mood or energy");
        res.status(400);
        throw new Error('Please provide both mood and energy level.');
    }

    // Create journal
    const newJournal = await Journal.create({
        userId: req.user._id,
        initialMood,
        initialEnergyLevel,
        status: 'in_progress',
        rawConversation: [],
    });
    
    console.log("📝 Journal created:", newJournal._id);
    
    // Call AI - with empty history for first message
    console.log("🤖 Calling AI for first question...");
    const startingQuestion = await callAIForPrompt([], initialMood, initialEnergyLevel);
    console.log("🤖 AI Response:", startingQuestion);
    
    // Add to conversation
    newJournal.rawConversation.push({
        speaker: 'ai',
        text: startingQuestion,
        inputType: 'system',
    });
    
    await newJournal.save();
    console.log("💾 Journal saved with AI response");

    res.status(201).json({ 
        journalId: newJournal._id,
        firstQuestion: startingQuestion,
    });
});
const continueSession = asyncHandler(async (req, res) => {
    console.log("🔄 CONTINUE SESSION - Journal ID:", req.params.id);
    console.log("🔄 Body:", req.body);
    console.log("🔄 File:", req.file ? `Yes - ${req.file.originalname}` : 'No file');

    const journalId = req.params.id;
    const { userInput, inputType } = req.body; 
    const file = req.file;

    const journal = await Journal.findById(journalId);
    console.log("📖 Found journal:", journal ? "Yes" : "No");

    if (!journal) {
        res.status(404);
        throw new Error('Journal session not found.');
    }

    if (journal.userId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized for this journal.');
    }

    if (journal.status === 'completed') {
        res.status(400);
        throw new Error('Journal session already completed.');
    }
    
    let processedText = userInput || '';
    
    // Handle file if present
    if (file) {
        console.log("📁 Processing file:", file.mimetype);
        try {
            const fileResult = await callAIForMultiModal(file.buffer, file.mimetype, journal.rawConversation);
            processedText = fileResult.text;
            console.log("📁 File processed to text:", processedText.substring(0, 100) + "...");
        } catch (fileError) {
            console.error("File processing failed:", fileError);
            processedText = userInput || "I shared a file with my thoughts.";
        }
    }

    // Validate we have content
    if (!processedText.trim()) {
        res.status(400);
        throw new Error('Please provide some text or a file to continue.');
    }

    // Add user message
    journal.rawConversation.push({
        speaker: 'user',
        text: processedText,
        inputType: inputType || 'text',
        timestamp: new Date()
    });

    console.log("📊 Conversation history length:", journal.rawConversation.length);
    
    // Prepare history for AI
    const currentHistory = journal.rawConversation.map(turn => ({
        speaker: turn.speaker,
        text: turn.text
    }));

    console.log("🤖 Calling AI with history...");
    const aiResponse = await callAIForPrompt(currentHistory);
    console.log("🤖 AI Response received:", aiResponse.substring(0, 100) + "...");
    
    // Add AI response
    journal.rawConversation.push({
        speaker: 'ai',
        text: aiResponse,
        inputType: 'system',
        timestamp: new Date()
    });

    // FIX: Use 'journal' not 'newJournal'
    await journal.save();
    console.log("💾 Conversation updated and saved");

    res.status(200).json({ 
        aiResponse,
        success: true
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