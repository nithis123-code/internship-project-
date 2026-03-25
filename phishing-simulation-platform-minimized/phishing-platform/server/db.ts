import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, templates, campaigns, recipients, clicks, awarenessPages, campaignAnalytics } from "../drizzle/schema";
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

// ============ TEMPLATES ============

export async function getTemplatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(templates).where(eq(templates.userId, userId)).orderBy(desc(templates.createdAt));
}

export async function getTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createTemplate(data: typeof templates.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(templates).values(data);
  return result;
}

export async function updateTemplate(id: number, data: Partial<typeof templates.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(templates).set(data).where(eq(templates.id, id));
}

export async function deleteTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(templates).where(eq(templates.id, id));
}

// ============ CAMPAIGNS ============

export async function getCampaignsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(campaigns).where(eq(campaigns.userId, userId)).orderBy(desc(campaigns.createdAt));
}

export async function getCampaignById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCampaign(data: typeof campaigns.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(campaigns).values(data);
  return result;
}

export async function updateCampaign(id: number, data: Partial<typeof campaigns.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(campaigns).set(data).where(eq(campaigns.id, id));
}

export async function deleteCampaign(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(campaigns).where(eq(campaigns.id, id));
}

// ============ RECIPIENTS ============

export async function getRecipientsByCampaignId(campaignId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(recipients).where(eq(recipients.campaignId, campaignId)).orderBy(desc(recipients.createdAt));
}

export async function getRecipientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(recipients).where(eq(recipients.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createRecipient(data: typeof recipients.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(recipients).values(data);
  return result;
}

export async function createRecipientsBulk(data: (typeof recipients.$inferInsert)[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(recipients).values(data);
}

export async function updateRecipient(id: number, data: Partial<typeof recipients.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(recipients).set(data).where(eq(recipients.id, id));
}

export async function deleteRecipient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(recipients).where(eq(recipients.id, id));
}

// ============ CLICKS ============

export async function getClicksByCampaignId(campaignId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(clicks).where(eq(clicks.campaignId, campaignId)).orderBy(desc(clicks.clickedAt));
}

export async function getClickByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(clicks).where(eq(clicks.token, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function recordClick(data: typeof clicks.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(clicks).values(data);
  return result;
}

// ============ AWARENESS PAGES ============

export async function getAwarenessPageByCampaignId(campaignId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(awarenessPages).where(eq(awarenessPages.campaignId, campaignId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAwarenessPage(data: typeof awarenessPages.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(awarenessPages).values(data);
  return result;
}

export async function updateAwarenessPage(id: number, data: Partial<typeof awarenessPages.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(awarenessPages).set(data).where(eq(awarenessPages.id, id));
}

// ============ ANALYTICS ============

export async function getCampaignAnalytics(campaignId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(campaignAnalytics).where(eq(campaignAnalytics.campaignId, campaignId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCampaignAnalytics(data: typeof campaignAnalytics.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(campaignAnalytics).values(data);
}

export async function updateCampaignAnalytics(campaignId: number, data: Partial<typeof campaignAnalytics.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(campaignAnalytics).set(data).where(eq(campaignAnalytics.campaignId, campaignId));
}

export async function getCampaignStats(campaignId: number) {
  const db = await getDb();
  if (!db) return null;

  const totalRecipientsResult = await db.select({ count: sql<number>`COUNT(*)` }).from(recipients).where(eq(recipients.campaignId, campaignId));
  const totalClicks = await db.select({ count: sql<number>`COUNT(*)` }).from(clicks).where(eq(clicks.campaignId, campaignId));
  const uniqueClicks = await db.select({ count: sql<number>`COUNT(DISTINCT recipientId)` }).from(clicks).where(eq(clicks.campaignId, campaignId));

  const totalRecipients = totalRecipientsResult[0]?.count || 0;
  const totalClicksCount = totalClicks[0]?.count || 0;
  const uniqueClicksCount = uniqueClicks[0]?.count || 0;
  const clickRate = totalRecipients > 0 ? ((uniqueClicksCount / totalRecipients) * 100) : 0;

  return {
    totalRecipients,
    totalClicks: totalClicksCount,
    uniqueClicks: uniqueClicksCount,
    clickRate: parseFloat(clickRate.toFixed(2)),
  };
}
