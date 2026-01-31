import { Router } from "express";
import { storage } from "../storage";
import { getGenAI } from "../services/ai";

const router = Router();

router.get("/logs", async (req, res) => {
    try {
        const logs = await storage.getAllChatLogs();
        res.json(logs);
    } catch (error) {
        console.error("Error fetching chat logs:", error);
        res.status(500).json({ error: "Ошибка при загрузке логов" });
    }
});

router.post("/logs", async (req, res) => {
    try {
        const { profileId, profileName, messageType, sender, content } = req.body;
        const log = await storage.addChatLog({ profileId, profileName, messageType, sender, content });
        res.json(log);
    } catch (error) {
        console.error("Error saving chat log:", error);
        res.status(500).json({ error: "Ошибка при сохранении лога" });
    }
});

router.get("/:profileId", async (req, res) => {
    try {
        const messages = await storage.getChatMessages(req.params.profileId);
        res.json(messages);
    } catch (error) {
        console.error("Error fetching chat messages:", error);
        res.status(500).json({ error: "Ошибка при загрузке сообщений" });
    }
});

router.post("/", async (req, res) => {
    try {
        const { profileId, message, chatSystemPrompt, currentFormData } = req.body;

        if (!profileId || !message) {
            return res.status(400).json({ error: "profileId and message are required" });
        }

        const genAI = getGenAI();
        if (!genAI) {
            return res.status(503).json({ error: "AI service unavailable" });
        }

        // Get profile and chat history
        const profile = await storage.getProfile(profileId);
        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        const chatHistory = await storage.getChatMessages(profileId);

        // Save user message FIRST so it appears immediately
        const savedUserMessage = await storage.addChatMessage({
            profileId,
            role: "user",
            content: message,
        });

        try {
            // Use currentFormData if available (for unsaved changes), otherwise use DB profile
            const contextData = currentFormData || profile;


            // Build system context with profile info
            let systemContext = `ВАЖНО: Ответь ТОЛЬКО на русском языке. Не используй английский язык.

Ты ассистент для анализа и помощи с информацией о профиле. Вот информация о профиле:

Тип: ${contextData.profileType === "child" ? "Ребенок" : "Взрослый"}
Имя: ${contextData.name} ${contextData.surname || ""}
Пол: ${contextData.gender}
Дата рождения: ${contextData.dateOfBirth || "Не указана"}
${contextData.parentName ? `Родитель/Опекун: ${contextData.parentName}` : ""}
Телефон: ${contextData.phone || "Не указан"}
Telegram: ${contextData.telegramId || "Не указан"}
Жалоба: ${contextData.complaint || "не указана"}
Дополнительные заметки: ${contextData.additionalNotes || "нет"}
${contextData.aiAnalysis ? `\nПредыдущий анализ ИИ:\n${contextData.aiAnalysis}` : ""}

Помогай пользователю на основе этой информации. Будь вежливым, профессиональным и полезным помощником.`;

            // Add custom chat prompt if provided
            if (chatSystemPrompt) {
                systemContext = `${systemContext}\n\nДополнительные инструкции:\n${chatSystemPrompt}`;
            }

            // Build conversation history for API - include the user message we just saved
            const allMessages = [...chatHistory, savedUserMessage];
            const conversationHistory = allMessages
                .map((msg) => ({
                    role: msg.role === "user" ? "user" : "model",
                    parts: [{ text: msg.content }],
                }));

            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                systemInstruction: systemContext
            });

            // Start chat session with history
            const chat = model.startChat({
                history: conversationHistory,
            });

            // Send the user's message
            const result = await chat.sendMessage(message);
            const assistantMessage = result.response.text();

            // Save assistant message
            await storage.addChatMessage({
                profileId,
                role: "assistant",
                content: assistantMessage,
            });
        } catch (aiError) {
            console.error("AI processing error:", aiError);
            // Return messages with user message even if AI fails
        }

        // Return updated messages (but filter out the system context message from response)
        const updatedMessages = await storage.getChatMessages(profileId);
        res.json({ messages: updatedMessages });
    } catch (error) {
        console.error("Error in chat endpoint:", error);
        res.status(500).json({ error: "Ошибка при общении с ИИ" });
    }
});

export default router;
