
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
if (!apiKey) {
    console.error("AI_INTEGRATIONS_GEMINI_API_KEY is not set");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // There isn't a direct listModels method on the instance in some versions,
        // but let's try to just use a known model and see if it works, or print error.
        // Actually, the error message said "Call ListModels".
        // In the Node SDK, it might be different.
        // Let's try to just instantiate a model and run a simple prompt.

        const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro", "gemini-1.0-pro", "gemini-1.5-pro"];

        for (const modelName of models) {
            console.log(`Testing model: ${modelName}`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                console.log(`SUCCESS: ${modelName} works!`);
                console.log(result.response.text());
                break; // Found one that works
            } catch (e: any) {
                console.log(`FAILED: ${modelName} - ${e.message}`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
