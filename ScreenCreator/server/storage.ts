import { profiles, chatMessages, chatLogs, pageViews } from "@shared/schema";
import type { InsertProfile, Profile, InsertChatMessage, ChatMessage, InsertChatLog, ChatLog, PageView } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  createProfile(profile: InsertProfile): Promise<Profile>;
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByName(name: string): Promise<Profile | undefined>;
  updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile>;
  getAllProfiles(): Promise<Profile[]>;
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(profileId: string): Promise<ChatMessage[]>;
  addChatLog(log: InsertChatLog): Promise<ChatLog>;
  getAllChatLogs(): Promise<ChatLog[]>;
  deleteProfile(id: string): Promise<void>;
  incrementPageView(path: string): Promise<void>;
  getPageViews(): Promise<PageView[]>;
}

export class DbStorage implements IStorage {
  async incrementPageView(path: string): Promise<void> {
    await db
      .insert(pageViews)
      .values({ path, count: 1 })
      .onConflictDoUpdate({
        target: pageViews.path,
        set: { 
          count: sql`${pageViews.count} + 1`,
          updatedAt: new Date()
        }
      });
  }

  async getPageViews(): Promise<PageView[]> {
    return db.select().from(pageViews);
  }
  async createProfile(profile: InsertProfile): Promise<Profile> {
    const result = await db.insert(profiles).values(profile).returning();
    return result[0];
  }

  async getProfile(id: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.id, id));
    return result[0];
  }

  async updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile> {
    const result = await db
      .update(profiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    return result[0];
  }

  async deleteProfile(id: string): Promise<void> {
    // Delete related chat messages and logs first
    await db.delete(chatMessages).where(eq(chatMessages.profileId, id));
    await db.delete(chatLogs).where(eq(chatLogs.profileId, id));
    await db.delete(profiles).where(eq(profiles.id, id));
  }

  async getProfileByName(name: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.name, name));
    return result[0];
  }

  async getAllProfiles(): Promise<Profile[]> {
    return db.select().from(profiles);
  }

  async addChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(chatMessages).values(message).returning();
    return result[0];
  }

  async getChatMessages(profileId: string): Promise<ChatMessage[]> {
    return db.select().from(chatMessages).where(eq(chatMessages.profileId, profileId)).orderBy(chatMessages.createdAt);
  }

  async addChatLog(log: InsertChatLog): Promise<ChatLog> {
    const result = await db.insert(chatLogs).values(log).returning();
    return result[0];
  }

  async getAllChatLogs(): Promise<ChatLog[]> {
    return db.select().from(chatLogs).orderBy(desc(chatLogs.createdAt));
  }
}

export const storage = new DbStorage();
