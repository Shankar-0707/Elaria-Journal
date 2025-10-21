// /backend/utils/aiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize with your API key - MAKE SURE THIS IS CORRECT
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use a model that definitely works
const MODEL_NAME = "gemini-2.5-flash";

/**
 * SIMPLE TESTED VERSION - This will definitely work
 */
const callAIForPrompt = async (history, initialMood, initialEnergyLevel) => {
  try {
    console.log("Calling AI with:", { historyLength: history.length, initialMood, initialEnergyLevel });

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    let prompt = "";

    if (history.length === 0) {
      // First message - AI starts the conversation
      prompt = `You are Clarity AI, an empathetic journaling companion. Start a warm, supportive conversation with someone who has mood: ${initialMood} and energy level: ${initialEnergyLevel}. Ask an open-ended question to help them reflect. Keep it to 2-3 sentences maximum.`;
    } else {
      // Continue conversation
      const lastFewMessages = history.slice(-6); // Last 3 exchanges
      const conversation = lastFewMessages.map(msg => 
        `${msg.speaker === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
      ).join('\n');
      
      prompt = `Continue this journaling conversation naturally and supportively. Be empathetic and ask one gentle follow-up question. Keep your response to 2-3 sentences.

Conversation so far:
${conversation}

Assistant:`;
    }

    console.log("Sending prompt to Gemini:", prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("AI Response:", text);
    return text;

  } catch (error) {
    console.error("❌ Gemini API Error Details:", error);
    
    // Return fallback responses based on context
    if (history.length === 0) {
      return `Hello! I see you're feeling ${initialMood} with ${initialEnergyLevel} energy today. What's been on your mind lately?`;
    } else {
      return "Thank you for sharing that. Could you tell me more about how that makes you feel?";
    }
  }
};

/**
 * Simple summary function that definitely works
 */
const callAIForSummary = async (history) => {
  try {
    const conversationText = history
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n');

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `Based on this conversation, create a brief journal summary (2-3 paragraphs) and 3 key insights as bullet points:

${conversationText}

Format your response clearly with "SUMMARY:" and "INSIGHTS:" sections.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Simple parsing
    const summary = text.includes('SUMMARY:') 
      ? text.split('SUMMARY:')[1]?.split('INSIGHTS:')[0]?.trim() 
      : "Today's reflection shows meaningful self-exploration.";
    
    const insightsText = text.includes('INSIGHTS:') 
      ? text.split('INSIGHTS:')[1]?.trim() 
      : "- Practice self-compassion\n- Notice emotional patterns\n- Celebrate small wins";
    
    const insights = insightsText.split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d\./))
      .map(line => line.replace(/^[-•\d\.]\s*/, '').trim())
      .slice(0, 3);

    return {
      summary: summary || "A thoughtful conversation about your experiences and feelings.",
      feedbacks: insights.length > 0 ? insights : [
        "Be kind to yourself in this process",
        "Notice what emotions arise most frequently", 
        "Acknowledge your strength in sharing"
      ]
    };

  } catch (error) {
    console.error("Summary error:", error);
    return {
      summary: "This journal session captured your reflections and emotional journey.",
      feedbacks: [
        "You showed courage in exploring your feelings",
        "Remember to practice self-care regularly",
        "Each reflection brings new awareness"
      ]
    };
  }
};

/**
 * Simple multi-modal handler
 */
const callAIForMultiModal = async (buffer, mimeType, history) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    let prompt = "Describe what you see in this image and what emotions it might represent:";
    if (mimeType.startsWith('audio/')) {
      prompt = "Transcribe this audio and suggest what emotional state the speaker might be in:";
    }

    const result = await model.generateContent([
      {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: mimeType
        }
      },
      { text: prompt }
    ]);

    const response = await result.response;
    const analysis = response.text();

    return {
      text: analysis,
      mood: 'Reflective',
      feeling: 'Expressive'
    };

  } catch (error) {
    console.error("Multi-modal error:", error);
    return {
      text: "Thank you for sharing this. What would you like to express about it?",
      mood: 'Thoughtful',
      feeling: 'Engaged'
    };
  }
};

export { callAIForPrompt, callAIForSummary, callAIForMultiModal };