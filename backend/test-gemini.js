// /backend/test-gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function testGemini() {
  try {
    console.log("🔑 Testing API Key:", process.env.GEMINI_API_KEY ? "Present" : "MISSING!");
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = "Say 'Hello from Gemini!' in a friendly way.";
    console.log("🤖 Sending test prompt...");
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ SUCCESS! Gemini response:", text);
    return true;
  } catch (error) {
    console.error("❌ Gemini Test FAILED:", error.message);
    console.log("💡 Check your API key and internet connection");
    return false;
  }
}

testGemini();