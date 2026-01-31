import type { Express } from "express";
import { createServer, type Server } from "http";
import profileRoutes from "./routes/profiles";
import analysisRoutes from "./routes/analysis";
import chatRoutes from "./routes/chat";
import authRoutes from "./routes/auth";

import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Register modular routes
  app.use("/api/profiles", profileRoutes);
  app.use("/api/analyze", analysisRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api", authRoutes); // Auth, Schools, Students, Courses

  app.post("/api/view", async (req, res) => {
    try {
      const { path } = req.body;
      await storage.incrementPageView(path || "/");
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to record view" });
    }
  });

  app.get("/api/stats", async (_req, res) => {
    try {
      const views = await storage.getPageViews();
      res.json(views);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  return httpServer;
}
