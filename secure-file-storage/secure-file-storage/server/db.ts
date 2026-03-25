import { eq, and, desc, isNull, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  files,
  encryptionKeys,
  fileShares,
  activityLogs,
  storageQuotas,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// File Operations
// ============================================================================

export async function createFile(
  userId: number,
  fileName: string,
  fileSize: number,
  mimeType: string,
  s3Key: string,
  s3Url: string,
  encryptionKeyId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(files).values({
    userId,
    fileName,
    fileSize,
    mimeType,
    s3Key,
    s3Url,
    encryptionKeyId,
  });

  return result;
}

export async function getUserFiles(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(files)
    .where(eq(files.userId, userId))
    .orderBy(desc(files.uploadedAt));
}

export async function getFileById(fileId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function deleteFile(fileId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)));
}

// ============================================================================
// Encryption Key Operations
// ============================================================================

export async function createEncryptionKey(
  userId: number,
  keyName: string,
  keyHash: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(encryptionKeys).values({
    userId,
    keyName,
    keyHash,
    isActive: true, // First key is active by default
  });

  return result;
}

export async function getUserEncryptionKeys(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(encryptionKeys)
    .where(eq(encryptionKeys.userId, userId))
    .orderBy(desc(encryptionKeys.createdAt));
}

export async function getActiveEncryptionKey(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(encryptionKeys)
    .where(and(eq(encryptionKeys.userId, userId), eq(encryptionKeys.isActive, true)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function setActiveEncryptionKey(keyId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Deactivate all keys for this user
  await db
    .update(encryptionKeys)
    .set({ isActive: false })
    .where(eq(encryptionKeys.userId, userId));

  // Activate the specified key
  return await db
    .update(encryptionKeys)
    .set({ isActive: true })
    .where(and(eq(encryptionKeys.id, keyId), eq(encryptionKeys.userId, userId)));
}

export async function deleteEncryptionKey(keyId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(encryptionKeys)
    .where(and(eq(encryptionKeys.id, keyId), eq(encryptionKeys.userId, userId)));
}

// ============================================================================
// File Share Operations
// ============================================================================

export async function createFileShare(
  fileId: number,
  shareToken: string,
  expiresAt: Date | null,
  createdBy: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(fileShares).values({
    fileId,
    shareToken,
    expiresAt,
    createdBy,
  });
}

export async function getShareByToken(shareToken: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(fileShares)
    .where(eq(fileShares.shareToken, shareToken))
    .limit(1);

  if (result.length === 0) return null;

  const share = result[0];

  // Check if share has expired
  if (share.expiresAt && share.expiresAt < new Date()) {
    return null; // Share has expired
  }

  return share;
}

export async function getUserFileShares(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(fileShares)
    .where(eq(fileShares.createdBy, userId))
    .orderBy(desc(fileShares.createdAt));
}

export async function deleteFileShare(shareId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify the share belongs to this user
  const share = await db
    .select()
    .from(fileShares)
    .where(eq(fileShares.id, shareId))
    .limit(1);

  if (share.length === 0 || share[0].createdBy !== userId) {
    throw new Error("Unauthorized");
  }

  return await db.delete(fileShares).where(eq(fileShares.id, shareId));
}

// ============================================================================
// Activity Logging
// ============================================================================

export async function logActivity(
  userId: number,
  action: string,
  fileId?: number,
  details?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(activityLogs).values({
    userId,
    action,
    fileId: fileId || null,
    details: details || null,
  });
}

export async function getUserActivityLog(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.timestamp))
    .limit(limit);
}

// ============================================================================
// Storage Quota Operations
// ============================================================================

export async function initializeStorageQuota(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(storageQuotas).values({
    userId,
    totalQuotaBytes: 5368709120, // 5GB
    usedBytes: 0,
  });
}

export async function getUserStorageQuota(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(storageQuotas)
    .where(eq(storageQuotas.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateStorageUsage(userId: number, bytesAdded: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const quota = await getUserStorageQuota(userId);
  if (!quota) {
    await initializeStorageQuota(userId);
  }

  const newUsedBytes = (quota?.usedBytes || 0) + bytesAdded;

  return await db
    .update(storageQuotas)
    .set({ usedBytes: newUsedBytes })
    .where(eq(storageQuotas.userId, userId));
}
