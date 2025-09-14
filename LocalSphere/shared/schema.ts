import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  radius: real("radius").default(2),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  lastSeen: timestamp("last_seen").default(sql`now()`),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  username: text("username").notNull(),
  content: text("content").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  radius: real("radius").default(2),
  createdAt: timestamp("created_at").default(sql`now()`),
  expiresAt: timestamp("expires_at").default(sql`now() + interval '24 hours'`),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id"),
  messageId: varchar("message_id"),
  userId: varchar("user_id"),
  reason: text("reason").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const calls = pgTable("calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  callerId: varchar("caller_id").notNull(),
  callerUsername: text("caller_username").notNull(),
  receiverId: varchar("receiver_id").notNull(),
  receiverUsername: text("receiver_username").notNull(),
  callType: text("call_type").notNull(), // 'audio' | 'video'
  status: text("status").notNull().default("pending"), // 'pending' | 'accepted' | 'declined' | 'ended' | 'missed'
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastSeen: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  expiresAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertCallSchema = createInsertSchema(calls).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  endedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertCall = z.infer<typeof insertCallSchema>;
export type Call = typeof calls.$inferSelect;
