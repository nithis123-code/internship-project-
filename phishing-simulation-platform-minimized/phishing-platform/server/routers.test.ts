import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("templates router", () => {
  it("should create a template", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.templates.create({
      name: "Test Template",
      subject: "Test Subject",
      body: "Test Body",
      senderName: "Test Sender",
      senderEmail: "sender@example.com",
      description: "Test Description",
    });

    expect(result).toBeDefined();
  });

  it("should list templates for user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.templates.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("campaigns router", () => {
  it("should create a campaign", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a template
    const templateResult = await caller.templates.create({
      name: "Campaign Template",
      subject: "Campaign Subject",
      body: "Campaign Body",
      senderName: "Campaign Sender",
      senderEmail: "campaign@example.com",
    });

    // Get the template ID (assuming it's returned in the result)
    // For now, we'll use a placeholder
    const templateId = 1;

    const result = await caller.campaigns.create({
      name: "Test Campaign",
      description: "Test Campaign Description",
      templateId: templateId,
    });

    expect(result).toBeDefined();
  });

  it("should list campaigns for user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.campaigns.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("recipients router", () => {
  it("should add a single recipient", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.recipients.add({
      campaignId: 1,
      email: "recipient@example.com",
      firstName: "John",
      lastName: "Doe",
      department: "IT",
    });

    expect(result).toBeDefined();
  });

  it("should bulk add recipients", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.recipients.bulkAdd({
      campaignId: 1,
      recipients: [
        {
          email: "user1@example.com",
          firstName: "User",
          lastName: "One",
          department: "Sales",
        },
        {
          email: "user2@example.com",
          firstName: "User",
          lastName: "Two",
          department: "Marketing",
        },
      ],
    });

    expect(result).toBeDefined();
  });

  it("should list recipients for campaign", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.recipients.list({ campaignId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("tracking router", () => {
  it("should generate a tracking token", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tracking.generateToken({
      recipientId: 1,
      campaignId: 1,
    });

    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe("string");
    expect(result.token.length).toBeGreaterThan(0);
  });

  it("should get campaign stats", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tracking.getStats({ campaignId: 1 });
    expect(result).toBeDefined();
    expect(result?.totalRecipients).toBeDefined();
    expect(result?.totalClicks).toBeDefined();
    expect(result?.uniqueClicks).toBeDefined();
    expect(result?.clickRate).toBeDefined();
  });
});

describe("awareness router", () => {
  it("should create an awareness page", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.awareness.create({
      campaignId: 1,
      title: "Phishing Awareness",
      content: "Learn about phishing attacks",
      tips: "Never click suspicious links",
      resources: "https://example.com/resources",
    });

    expect(result).toBeDefined();
  });
});

describe("analytics router", () => {
  it("should get campaign stats", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analytics.getCampaignStats({ campaignId: 1 });
    expect(result).toBeDefined();
    expect(result?.totalRecipients).toBeDefined();
    expect(result?.clickRate).toBeDefined();
  });
});
