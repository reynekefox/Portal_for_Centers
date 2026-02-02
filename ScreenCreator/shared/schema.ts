import { pgTable, text, varchar, json, timestamp, uniqueIndex, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileType: text("profile_type").notNull(), // "child" | "adult"
  gender: text("gender").notNull(), // "male" | "female"
  name: text("name"),
  surname: text("surname"),
  dateOfBirth: text("date_of_birth"),
  parentName: text("parent_name"),
  telegramId: text("telegram_id"),
  phone: text("phone"),
  complaint: text("complaint"), // "adhd" | "other" | null
  additionalNotes: text("additional_notes"),
  checklist: json("checklist").default({}), // { key: boolean }
  questionnaireComments: text("questionnaire_comments"),
  aiAnalysis: text("ai_analysis"),
  analysisStatus: text("analysis_status").default("none"), // "none" | "pending" | "completed" | "failed"
  completedStages: json("completed_stages").$type<{ stage1: boolean; stage2: boolean; stage3: boolean }>().default({ stage1: false, stage2: false, stage3: false }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull(),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatLogs = pgTable("chat_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull(),
  profileName: text("profile_name").notNull(),
  messageType: text("message_type").notNull(), // "user" | "assistant" | "specialist"
  sender: text("sender").notNull(), // "user" or "specialist" for specialist chats
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertChatLogSchema = createInsertSchema(chatLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatLog = z.infer<typeof insertChatLogSchema>;
export type ChatLog = typeof chatLogs.$inferSelect;

export const cosmoPatrolResults = pgTable("cosmo_patrol_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull(),
  childName: text("child_name"),
  childAge: text("child_age"),
  parentConcern: text("parent_concern"),
  totalTargets: text("total_targets").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCosmoPatrolResultSchema = createInsertSchema(cosmoPatrolResults).omit({
  id: true,
  createdAt: true,
});

export const pageViews = pgTable("page_views", {
  path: text("path").primaryKey(),
  count: integer("count").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPageViewSchema = createInsertSchema(pageViews).omit({
  updatedAt: true,
});

export type InsertPageView = z.infer<typeof insertPageViewSchema>;
export type PageView = typeof pageViews.$inferSelect;
export type InsertCosmoPatrolResult = z.infer<typeof insertCosmoPatrolResultSchema>;
export type CosmoPatrolResult = typeof cosmoPatrolResults.$inferSelect;

// ==================== SCHOOLS ====================
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  login: text("login").notNull().unique(),
  password: text("password").notNull(),
  allowedTrainings: json("allowed_trainings").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type School = typeof schools.$inferSelect;

// ==================== STUDENTS ====================
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  login: text("login").notNull().unique(),
  password: text("password").notNull(),
  allowedGames: json("allowed_games").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// ==================== COURSE TEMPLATES ====================
export const courseTemplates = pgTable("course_templates", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  days: json("days").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCourseTemplateSchema = createInsertSchema(courseTemplates).omit({
  id: true,
  createdAt: true,
});

export type InsertCourseTemplate = z.infer<typeof insertCourseTemplateSchema>;
export type CourseTemplate = typeof courseTemplates.$inferSelect;

// ==================== ASSIGNMENTS ====================
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  scheduledDate: text("scheduled_date").notNull(),
  exercises: json("exercises").$type<Array<{ trainingId: string; parameters: Record<string, unknown>; requiredResult: { type: string; minValue?: number } }>>().default([]),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
});

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;

// ==================== EXERCISE RESULTS ====================
export const exerciseResults = pgTable("exercise_results", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  exerciseIndex: integer("exercise_index").notNull(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  result: json("result").$type<Record<string, unknown>>().default({}),
  passed: integer("passed").notNull().default(0), // 0 = false, 1 = true
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertExerciseResultSchema = createInsertSchema(exerciseResults).omit({
  id: true,
  completedAt: true,
});

export type InsertExerciseResult = z.infer<typeof insertExerciseResultSchema>;
export type ExerciseResult = typeof exerciseResults.$inferSelect;

// ==================== TEMPLATES ====================
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  exercises: json("exercises").$type<Array<{ trainingId: string; parameters: Record<string, unknown>; requiredResult: { type: string; minValue?: number } }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
});

export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;

// ==================== ADMIN SETTINGS ====================
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().default("admin"),
  password: text("password").notNull().default("admin"),
});

export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({
  id: true,
});

export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;
export type AdminSettings = typeof adminSettings.$inferSelect;
