import { GoogleGenerativeAI } from "@google/generative-ai";

// Use Replit's Gemini AI integrations
const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

let genAI: GoogleGenerativeAI | null = null;

if (apiKey && baseUrl) {
    genAI = new GoogleGenerativeAI(apiKey);
    // Configure to use Replit's proxy
    (genAI as any).baseUrl = baseUrl;
} else if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
}

export function getGenAI() {
    return genAI;
}

export async function analyzeWithGoogleAI(profileData: any, customPrompt?: string): Promise<string> {
    try {
        if (!genAI) {
            return "AI analysis unavailable. Please configure Google API key.";
        }
        console.log("Calling Gemini API with model: gemini-flash-latest");
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Use the custom prompt that was sent from frontend
        // (frontend already handles combining systemPrompt with patient info)
        const result = await model.generateContent(customPrompt || "Анализ недоступен");
        const response = result.response;
        const text = response.text();
        console.log("Gemini API response received, length:", text.length);
        return text;
    } catch (error) {
        console.error("Error calling Google AI:", error);
        throw error;
    }
}
