import { Router } from "express";
import { storage } from "../storage";
import { analyzeWithGoogleAI, getGenAI } from "../services/ai";

const router = Router();

router.post("/", async (req, res) => {
    try {
        const { prompt, profileId } = req.body;
        console.log(`Received /api/analyze request. ProfileId: ${profileId}, Prompt length: ${prompt?.length}`);
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        if (!getGenAI()) {
            console.error("Gemini AI not initialized.");
            return res.status(503).json({ error: "AI analysis service unavailable" });
        }

        if (profileId) {
            // Background processing mode
            console.log(`Starting background AI analysis for profile ${profileId}...`);

            // Respond immediately to client
            res.json({ status: "processing", message: "Analysis started in background" });

            // Process in background
            (async () => {
                try {
                    // Set status to pending
                    await storage.updateProfile(profileId, { analysisStatus: "pending" });

                    // Create a timeout promise
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error("AI Analysis timed out after 60s")), 60000);
                    });

                    // Race between analysis and timeout
                    const analysis = await Promise.race([
                        analyzeWithGoogleAI({}, prompt),
                        timeoutPromise
                    ]) as string;

                    console.log(`Background analysis completed for profile ${profileId}`);

                    // Save directly to database with completed status
                    await storage.updateProfile(profileId, {
                        aiAnalysis: analysis,
                        analysisStatus: "completed"
                    });
                } catch (error) {
                    console.error(`Background analysis failed for profile ${profileId}:`, error);
                    // Set status to failed
                    await storage.updateProfile(profileId, { analysisStatus: "failed" });
                }
            })();
        } else {
            // Synchronous mode (legacy behavior)
            console.log("Starting synchronous AI analysis...");
            const analysis = await analyzeWithGoogleAI({}, prompt);
            console.log("AI analysis completed successfully");
            res.json({ analysis });
        }
    } catch (error) {
        console.error("Error initiating AI analysis:", error);
        res.status(500).json({ error: "Ошибка при запуске анализа" });
    }
});

export default router;
