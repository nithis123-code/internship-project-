import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Phishing email templates
 */
export const templates = mysqlTable("templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  senderName: varchar("senderName", { length: 255 }).notNull(),
  senderEmail: varchar("senderEmail", { length: 320 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

/**
 * Phishing simulation campaigns
 */
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  templateId: int("templateId").notNull(),
  status: mysqlEnum("status", ["draft", "scheduled", "active", "completed", "paused"]).default("draft").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  launchedAt: timestamp("launchedAt"),
  completedAt: timestamp("completedAt"),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

/**
 * Email recipients/targets for campaigns
 */
export const recipients = mysqlTable("recipients", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  firstName: varchar("firstName", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  department: varchar("department", { length: 255 }),
  status: mysqlEnum("status", ["pending", "sent", "clicked", "reported"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Recipient = typeof recipients.$inferSelect;
export type InsertRecipient = typeof recipients.$inferInsert;

/**
 * Click tracking and interaction data
 */
export const clicks = mysqlTable("clicks", {
  id: int("id").autoincrement().primaryKey(),
  recipientId: int("recipientId").notNull(),
  campaignId: int("campaignId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  clickedAt: timestamp("clickedAt").defaultNow().notNull(),
  userAgent: text("userAgent"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  referer: text("referer"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Click = typeof clicks.$inferSelect;
export type InsertClick = typeof clicks.$inferInsert;

/**
 * Educational awareness pages shown after clicking phishing links
 */
export const awarenessPages = mysqlTable("awarenessPages", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  tips: text("tips"),
  resources: text("resources"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AwarenessPage = typeof awarenessPages.$inferSelect;
export type InsertAwarenessPage = typeof awarenessPages.$inferInsert;

/**
 * Campaign analytics snapshot (for performance - pre-calculated metrics)
 */
export const campaignAnalytics = mysqlTable("campaignAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull().unique(),
  totalRecipients: int("totalRecipients").default(0).notNull(),
  totalClicks: int("totalClicks").default(0).notNull(),
  uniqueClicks: int("uniqueClicks").default(0).notNull(),
  clickRate: decimal("clickRate", { precision: 5, scale: 2 }).default("0.00").notNull(),
  lastUpdatedAt: timestamp("lastUpdatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CampaignAnalytics = typeof campaignAnalytics.$inferSelect;
export type InsertCampaignAnalytics = typeof campaignAnalytics.$inferInsert;

// ---- relations (merged from relations.ts) ----
import {} from "./schema";
