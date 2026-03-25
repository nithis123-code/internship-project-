import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, scans, vulnerabilities, InsertScan, InsertVulnerability, Scan, Vulnerability } from "../drizzle/schema";
import { ENV } from './_core/env';

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
      values.role = 'admin';
      updateSet.role = 'admin';
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

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Scan database functions
export async function createScan(userId: number, url: string): Promise<Scan> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(scans).values({
    userId,
    url,
    status: "pending",
  });

  const scanId = (result as any).insertId;
  const createdScans = await db.select().from(scans).where(eq(scans.id, scanId)).limit(1);
  return createdScans[0]!;
}

export async function updateScanStatus(
  scanId: number,
  status: "pending" | "scanning" | "completed" | "failed",
  data?: {
    severity?: "critical" | "high" | "medium" | "low" | "info";
    totalVulnerabilities?: number;
    criticalCount?: number;
    highCount?: number;
    mediumCount?: number;
    lowCount?: number;
    infoCount?: number;
    scanDuration?: number;
    errorMessage?: string;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const updateData: Record<string, unknown> = { status };
  if (data) {
    Object.assign(updateData, data);
  }

  await db.update(scans).set(updateData).where(eq(scans.id, scanId));
}

export async function addVulnerability(
  scanId: number,
  vulnerability: Omit<InsertVulnerability, "scanId">
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(vulnerabilities).values({
    ...vulnerability,
    scanId,
  });
}

export async function getScanById(scanId: number): Promise<Scan | undefined> {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select().from(scans).where(eq(scans.id, scanId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getVulnerabilitiesByScanId(scanId: number): Promise<Vulnerability[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db.select().from(vulnerabilities).where(eq(vulnerabilities.scanId, scanId));
}

export async function getUserScans(userId: number, limit = 20): Promise<Scan[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db
    .select()
    .from(scans)
    .where(eq(scans.userId, userId))
    .orderBy(desc(scans.createdAt))
    .limit(limit);
}
