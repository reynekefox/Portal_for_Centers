import { Router } from "express";
import { storage } from "../storage";
import { insertProfileSchema } from "@shared/schema";

const router = Router();

router.post("/", async (req, res) => {
    try {
        const parsed = insertProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.errors });
        }

        // Check if name already exists (only if name is provided)
        if (parsed.data.name) {
            const existingProfile = await storage.getProfileByName(parsed.data.name);
            if (existingProfile) {
                return res.status(409).json({ error: "Это имя уже используется. Пожалуйста, выберите другое имя." });
            }
        }

        // Create profile with provided AI analysis or null
        const profile = await storage.createProfile({
            ...parsed.data,
            aiAnalysis: parsed.data.aiAnalysis || null,
        });

        res.json(profile);
    } catch (error) {
        console.error("Error creating profile:", error);
        res.status(500).json({ error: "Ошибка при создании профиля" });
    }
});

router.patch("/:id", async (req, res) => {
    try {
        // Check if name already exists (if name is being updated)
        if (req.body.name) {
            const existingProfile = await storage.getProfileByName(req.body.name);
            // If profile exists AND it's not the one we are currently updating
            if (existingProfile && existingProfile.id !== req.params.id) {
                return res.status(409).json({ error: "Это имя уже используется. Пожалуйста, выберите другое имя." });
            }
        }

        const updated = await storage.updateProfile(req.params.id, req.body);
        res.json(updated);
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        await storage.deleteProfile(req.params.id);
        res.sendStatus(204);
    } catch (error) {
        console.error("Error deleting profile:", error);
        res.status(500).json({ error: "Failed to delete profile" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const profile = await storage.getProfile(req.params.id);
        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

router.get("/", async (req, res) => {
    try {
        const profileType = req.query.profileType as string | undefined;
        let profiles = await storage.getAllProfiles();

        if (profileType) {
            profiles = profiles.filter(p => p.profileType === profileType);
        }

        res.json(profiles);
    } catch (error) {
        res.status(500).json({ error: "Ошибка при получении профилей" });
    }
});

router.get("/search/:name", async (req, res) => {
    try {
        const profile = await storage.getProfileByName(req.params.name);
        if (!profile) {
            return res.status(404).json({ error: "Профиль не найден" });
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: "Ошибка при поиске профиля" });
    }
});

export default router;
