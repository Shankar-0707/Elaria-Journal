import { GoogleGenAI } from '@google/genai';
import dotenv from "dotenv";


dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY, // env variable me rakho
});

const SYSTEM_INSTRUCTION = `
You are an empathetic, non-judgmental AI journaling companion named 'Clarity'. 
Your primary goal is to foster emotional awareness and personal growth through conversation.
Maintain a warm, supportive, and reflective tone. 
Keep your responses concise (2-3 sentences max) to encourage the user to elaborate.
After acknowledging the user's input, ask one gentle, open-ended question to guide deeper reflection.
`;

const MODEL_NAME = 'gemini-2.5-flash'; // Fast and capable for conversational chat

/**
 * Generates the AI's response based on the current conversation history.
 * @param {Array} history - Array of { speaker: 'user' | 'ai', text: string } objects.
 * @returns {Promise<string>} The AI's generated reply/question.
 */


const callAIForPrompt = async (history, initialMood, initialEnergyLevel) => {
        // Ensure history is always an array

    if (!Array.isArray(history)) history = [];

    // Convert our internal history format to the Gemini content structure
    const contents = history.map(turn => ({
        role: turn.speaker === 'user' ? 'user' : 'model',
        parts: [{ text: turn.text }],
    }));

    // Add the initial mood/energy as context for the first turn if history is empty
    if (history.length === 0 && initialMood && initialEnergyLevel) {
        contents.unshift({
            role: 'user',
            parts: [{ text: `My starting mood is ${initialMood} and energy is ${initialEnergyLevel}.` }],
        });
    }

    // Check for an empty contents array and add a fallback prompt
    if (contents.length === 0) {
        // This handles cases where history is empty AND mood/energy are missing.
        console.warn("History and initial context are missing. Adding generic greeting.");
        contents.push({
            role: 'user',
            parts: [{ text: "Hello, let's start a journaling session." }],
        });
    }

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: contents,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
            }
        });

        return response.text.trim();
    } catch (error) {
        console.error("Gemini API Error (Prompt):", error.message);
        return "I'm having a little trouble connecting right now. Could you please rephrase that?";
    }
};

// ----------------------------------------------------------------------
// 3. Function to Summarize and Generate Insights (Session Completion)
// ----------------------------------------------------------------------

/**
 * Generates a journal summary and key insights upon session completion.
 * @param {Array} history - The full conversation history.
 * @returns {Promise<{summary: string, feedbacks: Array<string>}>}
 */
const callAIForSummary = async (history) => {
    // Format conversation for the summary prompt
    const conversationText = history
        .map(t => `${t.speaker.toUpperCase()}: ${t.text}`)
        .join('\n');

    const PROMPT = `
        Review the following journal session conversation:
        ---
        ${conversationText}
        ---
        
        Your task is two-fold:
        1. **Summary:** Write a concise, coherent, and reflective journal entry (around 3 paragraphs) based on the full conversation. Ensure it captures the main themes, emotional journey, and resolution (if any).
        2. **Feedbacks:** Identify 3 actionable or reflective insights/feedbacks for the user, based on recurring patterns, emotional breakthroughs, or challenges mentioned. Format these as a comma-separated list of strings.
        
        Output must be strictly in JSON format: {"summary": "your summary text...", "feedbacks": ["insight 1", "insight 2", "insight 3"]}.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Using a more powerful model for complex summarization
            contents: PROMPT,
            config: {
                responseMimeType: "application/json",
            }
        });

        // The response text is a JSON string, so we parse it
        const result = JSON.parse(response.text.trim());
        return {
            summary: result.summary,
            feedbacks: result.feedbacks,
        };

    } catch (error) {
        console.error("Gemini API Error (Summary):", error);
        // Fallback or error response
        return {
            summary: "Error: Could not generate a detailed summary due to an AI service issue.",
            feedbacks: ["Review the conversation yourself for key takeaways."],
        };
    }
};

export { callAIForPrompt, callAIForSummary };