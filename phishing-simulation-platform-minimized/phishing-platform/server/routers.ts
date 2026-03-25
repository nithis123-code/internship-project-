import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  getTemplatesByUserId,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getCampaignsByUserId,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getRecipientsByCampaignId,
  createRecipient,
  createRecipientsBulk,
  updateRecipient,
  deleteRecipient,
  getClickByToken,
  recordClick,
  getClicksByCampaignId,
  getAwarenessPageByCampaignId,
  createAwarenessPage,
  updateAwarenessPage,
  getCampaignAnalytics,
  createCampaignAnalytics,
  updateCampaignAnalytics,
  getCampaignStats,
} from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ TEMPLATES ============
  templates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getTemplatesByUserId(ctx.user.id);
    }),

    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const template = await getTemplateById(input.id);
      if (!template) throw new TRPCError({ code: "NOT_FOUND" });
      return template;
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          subject: z.string().min(1),
          body: z.string().min(1),
          senderName: z.string().min(1),
          senderEmail: z.string().email(),
          description: z.string().optional(),
          category: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await createTemplate({
          userId: ctx.user.id,
          ...input,
        });
        return result;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          subject: z.string().min(1).optional(),
          body: z.string().min(1).optional(),
          senderName: z.string().min(1).optional(),
          senderEmail: z.string().email().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateTemplate(id, data);
        return await getTemplateById(id);
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteTemplate(input.id);
      return { success: true };
    }),
  }),

  // ============ CAMPAIGNS ============
  campaigns: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getCampaignsByUserId(ctx.user.id);
    }),

    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const campaign = await getCampaignById(input.id);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
      return campaign;
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          templateId: z.number(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await createCampaign({
          userId: ctx.user.id,
          ...input,
          status: "draft",
        });
        
        // Create analytics record
        const campaignId = (result as any)?.insertId;
        if (campaignId) {
          await createCampaignAnalytics({
            campaignId: campaignId,
            totalRecipients: 0,
            totalClicks: 0,
            uniqueClicks: 0,
            clickRate: "0.00",
          });
        }

        return result;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          templateId: z.number().optional(),
          status: z.enum(["draft", "scheduled", "active", "completed", "paused"]).optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCampaign(id, data);
        return await getCampaignById(id);
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteCampaign(input.id);
      return { success: true };
    }),

    launch: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await updateCampaign(input.id, {
        status: "active",
        launchedAt: new Date(),
      });
      return await getCampaignById(input.id);
    }),

    complete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await updateCampaign(input.id, {
        status: "completed",
        completedAt: new Date(),
      });
      return await getCampaignById(input.id);
    }),
  }),

  // ============ RECIPIENTS ============
  recipients: router({
    list: protectedProcedure.input(z.object({ campaignId: z.number() })).query(async ({ input }) => {
      return await getRecipientsByCampaignId(input.campaignId);
    }),

    add: protectedProcedure
      .input(
        z.object({
          campaignId: z.number(),
          email: z.string().email(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          department: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await createRecipient({
          campaignId: input.campaignId,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          department: input.department,
          status: "pending",
        });
        return result;
      }),

    bulkAdd: protectedProcedure
      .input(
        z.object({
          campaignId: z.number(),
          recipients: z.array(
            z.object({
              email: z.string().email(),
              firstName: z.string().optional(),
              lastName: z.string().optional(),
              department: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const recipientData = input.recipients.map(r => ({
          campaignId: input.campaignId,
          email: r.email,
          firstName: r.firstName,
          lastName: r.lastName,
          department: r.department,
          status: "pending" as const,
        }));
        return await createRecipientsBulk(recipientData);
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteRecipient(input.id);
      return { success: true };
    }),
  }),

  // ============ CLICK TRACKING ============
  tracking: router({
    generateToken: protectedProcedure
      .input(z.object({ recipientId: z.number(), campaignId: z.number() }))
      .mutation(async ({ input }) => {
        const token = nanoid(32);
        return { token };
      }),

    recordClick: publicProcedure
      .input(
        z.object({
          token: z.string(),
          userAgent: z.string().optional(),
          ipAddress: z.string().optional(),
          referer: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const existingClick = await getClickByToken(input.token);
        if (existingClick) {
          return { success: true, alreadyClicked: true };
        }

        // For now, we'll need to store the token and get the recipient/campaign from the tracking link
        // This will be handled by the public tracking endpoint
        return { success: true, token: input.token };
      }),

    getStats: protectedProcedure.input(z.object({ campaignId: z.number() })).query(async ({ input }) => {
      const stats = await getCampaignStats(input.campaignId);
      return stats;
    }),

    getClicks: protectedProcedure.input(z.object({ campaignId: z.number() })).query(async ({ input }) => {
      return await getClicksByCampaignId(input.campaignId);
    }),
  }),

  // ============ AWARENESS PAGES ============
  awareness: router({
    get: protectedProcedure.input(z.object({ campaignId: z.number() })).query(async ({ input }) => {
      return await getAwarenessPageByCampaignId(input.campaignId);
    }),

    create: protectedProcedure
      .input(
        z.object({
          campaignId: z.number(),
          title: z.string().min(1),
          content: z.string().min(1),
          tips: z.string().optional(),
          resources: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await createAwarenessPage(input);
        return result;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          content: z.string().min(1).optional(),
          tips: z.string().optional(),
          resources: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateAwarenessPage(id, data);
        return await getAwarenessPageByCampaignId(id);
      }),
  }),

  // ============ ANALYTICS ============
  analytics: router({
    getCampaignStats: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        return await getCampaignStats(input.campaignId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
