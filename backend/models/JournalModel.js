import mongoose from 'mongoose';

// Define the schema for a single turn in the conversation
const conversationTurnSchema = mongoose.Schema({
    // 'user' or 'ai'
    speaker: {
        type: String,
        required: true,
        enum: ['user', 'ai'], 
    },
    // The actual text spoken/asked
    text: {
        type: String,
        required: true,
    },
    // Used to track the original input type for user turns
    inputType: {
        type: String,
        enum: ['text', 'audio', 'image', 'system'], // 'system' for initial AI prompt
        default: 'text',
    },
    // Optional: URL if the input was an image or audio file
    mediaUrl: {
        type: String,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

// Define the main Journal Schema
const journalSchema = mongoose.Schema(
    {
        // Link the journal entry to the User who created it (Required)
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User', // Reference the User model
        },
        
        // 1. Session Start Data
        initialMood: {
            type: String,
            required: true,
        },
        initialEnergyLevel: {
            type: String,
            required: true,
        },

        // 2. Raw Conversation History
        rawConversation: {
            type: [conversationTurnSchema], // Array of conversation turns
            default: [],
        },

        // 3. AI-Processed Final Journal Entry
        journalSummaryText: {
            type: String,
            required: false, // Will be set upon session completion
        },

        // 4. AI Insights for the Insights Page
        aiFeedbacks: {
            type: [String], // Array of key feedback points/insights
            default: [],
        },
        
        // Status to track if the session is still ongoing or complete
        status: {
            type: String,
            enum: ['in_progress', 'completed'],
            default: 'in_progress',
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

const Journal = mongoose.model('Journal', journalSchema);

export default Journal;