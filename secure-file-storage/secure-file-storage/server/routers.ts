import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createFile,
  getUserFiles,
  getFileById,
  deleteFile,
  createEncryptionKey,
  getUserEncryptionKeys,
  getActiveEncryptionKey,
  setActiveEncryptionKey,
  deleteEncryptionKey,
  createFileShare,
  getShareByToken,
  getUserFileShares,
  deleteFileShare,
  logActivity,
  getUserActivityLog,
  getUserStorageQuota,
  updateStorageUsage,
  initializeStorageQuota,
} from "./db";
import {
  generateEncryptionKey,
  hashEncryptionKey,
  generateShareToken,
} from "./encryption";
import { storagePut, storageGet } from "./storage";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ========================================================================
  // File Management
  // ========================================================================
  files: router({
    /**
     * Upload a file: encrypt and store in S3
     * Client sends file as FormData, server encrypts and uploads
     */
    upload: protectedProcedure
      .input(
        z.object({
          fileName: z.string(),
          fileSize: z.number(),
          mimeType: z.string(),
          encryptedData: z.instanceof(Buffer),
          encryptionKeyId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Check storage quota
          const quota = await getUserStorageQuota(ctx.user.id);
          if (!quota) {
            await initializeStorageQuota(ctx.user.id);
          }

          const currentQuota = quota || (await getUserStorageQuota(ctx.user.id));
          if (!currentQuota) throw new Error("Failed to initialize quota");

          const availableSpace =
            currentQuota.totalQuotaBytes - currentQuota.usedBytes;
          if (input.fileSize > availableSpace) {
            throw new TRPCError({
              code: "PAYLOAD_TOO_LARGE",
              message: "Storage quota exceeded",
            });
          }

          // Generate S3 key
          const timestamp = Date.now();
          const s3Key = `${ctx.user.id}/files/${timestamp}-${input.fileName}`;

          // Upload to S3
          const { url: s3Url } = await storagePut(
            s3Key,
            input.encryptedData,
            input.mimeType
          );

          // Create file record
          await createFile(
            ctx.user.id,
            input.fileName,
            input.fileSize,
            input.mimeType,
            s3Key,
            s3Url,
            input.encryptionKeyId
          );

          // Update storage usage
          await updateStorageUsage(ctx.user.id, input.fileSize);

          // Log activity
          await logActivity(ctx.user.id, "upload", undefined, input.fileName);

          return { success: true, s3Url };
        } catch (error) {
          console.error("Upload error:", error);
          throw error;
        }
      }),

    /**
     * List user's files
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserFiles(ctx.user.id);
    }),

    /**
     * Get file metadata
     */
    getMetadata: protectedProcedure
      .input(z.object({ fileId: z.number() }))
      .query(async ({ ctx, input }) => {
        const file = await getFileById(input.fileId, ctx.user.id);
        if (!file) {
          throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
        }
        return file;
      }),

    /**
     * Download file: get S3 URL for decryption on client
     */
    download: protectedProcedure
      .input(z.object({ fileId: z.number() }))
      .query(async ({ ctx, input }) => {
        const file = await getFileById(input.fileId, ctx.user.id);
        if (!file) {
          throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
        }

        // Get presigned URL from S3
        const { url } = await storageGet(file.s3Key);

        // Log activity
        await logActivity(ctx.user.id, "download", file.id, file.fileName);

        return { url, file };
      }),

    /**
     * Delete file
     */
    delete: protectedProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const file = await getFileById(input.fileId, ctx.user.id);
        if (!file) {
          throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
        }

        // Delete from S3 (optional - could implement S3 delete)
        // For now, we just remove the database record

        // Delete from database
        await deleteFile(input.fileId, ctx.user.id);

        // Update storage usage
        await updateStorageUsage(ctx.user.id, -file.fileSize);

        // Log activity
        await logActivity(ctx.user.id, "delete", input.fileId, file.fileName);

        return { success: true };
      }),

    // ====================================================================
    // Encryption Key Management
    // ====================================================================

    /**
     * Generate a new encryption key
     */
    generateKey: protectedProcedure
      .input(z.object({ keyName: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const key = generateEncryptionKey();
        const keyHash = hashEncryptionKey(key);

        await createEncryptionKey(ctx.user.id, input.keyName, keyHash);

        // Log activity
        await logActivity(ctx.user.id, "key_create", undefined, input.keyName);

        // Return the key only once - client must save it
        return { key, keyName: input.keyName };
      }),

    /**
     * List user's encryption keys (hashes only, not actual keys)
     */
    listKeys: protectedProcedure.query(async ({ ctx }) => {
      return await getUserEncryptionKeys(ctx.user.id);
    }),

    /**
     * Get active encryption key info
     */
    getActiveKey: protectedProcedure.query(async ({ ctx }) => {
      return await getActiveEncryptionKey(ctx.user.id);
    }),

    /**
     * Set active encryption key
     */
    setActiveKey: protectedProcedure
      .input(z.object({ keyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await setActiveEncryptionKey(input.keyId, ctx.user.id);
        return { success: true };
      }),

    /**
     * Delete encryption key
     */
    deleteKey: protectedProcedure
      .input(z.object({ keyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteEncryptionKey(input.keyId, ctx.user.id);

        // Log activity
        await logActivity(ctx.user.id, "key_delete", undefined, `Key ${input.keyId}`);

        return { success: true };
      }),

    // ====================================================================
    // File Sharing
    // ====================================================================

    /**
     * Create a shareable link for a file
     */
    createShare: protectedProcedure
      .input(
        z.object({
          fileId: z.number(),
          expiresIn: z.number().optional(), // Minutes until expiration
        })
      )
      .mutation(async ({ ctx, input }) => {
        const file = await getFileById(input.fileId, ctx.user.id);
        if (!file) {
          throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
        }

        const shareToken = generateShareToken();
        const expiresAt = input.expiresIn
          ? new Date(Date.now() + input.expiresIn * 60000)
          : null;

        await createFileShare(
          input.fileId,
          shareToken,
          expiresAt,
          ctx.user.id
        );

        // Log activity
        await logActivity(
          ctx.user.id,
          "share_create",
          input.fileId,
          file.fileName
        );

        return { shareToken, expiresAt };
      }),

    /**
     * Get shared file (no authentication required)
     */
    getShared: publicProcedure
      .input(z.object({ shareToken: z.string() }))
      .query(async ({ input }) => {
        const share = await getShareByToken(input.shareToken);
        if (!share) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Share not found or expired",
          });
        }

        // Get file metadata (don't expose encryption key)
        const file = await getFileById(share.fileId, 0); // This will fail auth check, need to adjust
        // For now, return minimal info
        return { shareToken: share.shareToken, fileId: share.fileId };
      }),

    /**
     * List user's active shares
     */
    listShares: protectedProcedure.query(async ({ ctx }) => {
      return await getUserFileShares(ctx.user.id);
    }),

    /**
     * Delete a share link
     */
    deleteShare: protectedProcedure
      .input(z.object({ shareId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteFileShare(input.shareId, ctx.user.id);

        // Log activity
        await logActivity(ctx.user.id, "share_delete", undefined, `Share ${input.shareId}`);

        return { success: true };
      }),

    // ====================================================================
    // Activity & Quotas
    // ====================================================================

    /**
     * Get user's activity log
     */
    getActivityLog: protectedProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ ctx, input }) => {
        return await getUserActivityLog(ctx.user.id, input.limit);
      }),

    /**
     * Get user's storage quota
     */
    getQuota: protectedProcedure.query(async ({ ctx }) => {
      let quota = await getUserStorageQuota(ctx.user.id);
      if (!quota) {
        await initializeStorageQuota(ctx.user.id);
        quota = await getUserStorageQuota(ctx.user.id);
      }
      return quota;
    }),
  }),
});

export type AppRouter = typeof appRouter;
