import { bigint, int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

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
 * Files table: stores file metadata and S3 references
 * Actual file bytes are stored in S3, this table only holds metadata
 */
export const files = mysqlTable("files", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: bigint("fileSize", { mode: "number" }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  s3Key: varchar("s3Key", { length: 500 }).notNull().unique(),
  s3Url: text("s3Url").notNull(),
  encryptionKeyId: int("encryptionKeyId").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type File = typeof files.$inferSelect;
export type InsertFile = typeof files.$inferInsert;

/**
 * Encryption keys table: stores user's encryption keys
 * Each user can have multiple keys; one is marked as active
 */
export const encryptionKeys = mysqlTable("encryption_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  keyName: varchar("keyName", { length: 255 }).notNull(),
  keyHash: varchar("keyHash", { length: 255 }).notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EncryptionKey = typeof encryptionKeys.$inferSelect;
export type InsertEncryptionKey = typeof encryptionKeys.$inferInsert;

/**
 * File shares table: tracks shareable encrypted links
 * Each share has a unique token and optional expiration
 */
export const fileShares = mysqlTable("file_shares", {
  id: int("id").autoincrement().primaryKey(),
  fileId: int("fileId").notNull(),
  shareToken: varchar("shareToken", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy").notNull(),
});

export type FileShare = typeof fileShares.$inferSelect;
export type InsertFileShare = typeof fileShares.$inferInsert;

/**
 * Activity logs table: audit trail for file operations
 * Tracks uploads, downloads, deletions, and key operations
 */
export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 50 }).notNull(), // 'upload', 'download', 'delete', 'share', 'key_create', etc.
  fileId: int("fileId"),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

/**
 * Storage quotas table: tracks storage usage per user
 * Helps enforce storage limits and display usage
 */
export const storageQuotas = mysqlTable("storage_quotas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalQuotaBytes: bigint("totalQuotaBytes", { mode: "number" }).default(5368709120).notNull(), // 5GB default
  usedBytes: bigint("usedBytes", { mode: "number" }).default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StorageQuota = typeof storageQuotas.$inferSelect;
export type InsertStorageQuota = typeof storageQuotas.$inferInsert;

// Relations
export const filesRelations = relations(files, ({ one }) => ({
  user: one(users, { fields: [files.userId], references: [users.id] }),
  encryptionKey: one(encryptionKeys, { fields: [files.encryptionKeyId], references: [encryptionKeys.id] }),
}));

export const encryptionKeysRelations = relations(encryptionKeys, ({ one }) => ({
  user: one(users, { fields: [encryptionKeys.userId], references: [users.id] }),
}));

export const fileSharesRelations = relations(fileShares, ({ one }) => ({
  file: one(files, { fields: [fileShares.fileId], references: [files.id] }),
  createdByUser: one(users, { fields: [fileShares.createdBy], references: [users.id] }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, { fields: [activityLogs.userId], references: [users.id] }),
  file: one(files, { fields: [activityLogs.fileId], references: [files.id] }),
}));

export const storageQuotasRelations = relations(storageQuotas, ({ one }) => ({
  user: one(users, { fields: [storageQuotas.userId], references: [users.id] }),
}));