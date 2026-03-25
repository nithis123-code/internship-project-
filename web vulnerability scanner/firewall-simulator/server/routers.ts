import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { scanURL } from "./vulnerabilityScanner";
import {
  createScan,
  updateScanStatus,
  addVulnerability,
  getScanById,
  getVulnerabilitiesByScanId,
  getUserScans,
} from "./db";

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

  scanner: router({
    startScan: protectedProcedure
      .input(z.object({ url: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { url } = input;
        const userId = ctx.user.id;

        // Create scan record
        const scan = await createScan(userId, url);

        // Start scanning in background
        (async () => {
          try {
            await updateScanStatus(scan.id, "scanning");

            const result = await scanURL(url);

            // Count vulnerabilities by severity
            const severityCounts = {
              critical: 0,
              high: 0,
              medium: 0,
              low: 0,
              info: 0,
            };

            let maxSeverity: "critical" | "high" | "medium" | "low" | "info" =
              "info";

            for (const finding of result.findings) {
              severityCounts[finding.severity]++;
              const severityOrder = [
                "critical",
                "high",
                "medium",
                "low",
                "info",
              ];
              if (
                severityOrder.indexOf(finding.severity) <
                severityOrder.indexOf(maxSeverity)
              ) {
                maxSeverity = finding.severity;
              }

              // Add vulnerability to database
              await addVulnerability(scan.id, {
                type: finding.type,
                category: finding.category,
                severity: finding.severity,
                title: finding.title,
                description: finding.description,
                remediation: finding.remediation,
                evidence: JSON.stringify(finding.evidence),
              });
            }

            // Update scan with results
            await updateScanStatus(scan.id, "completed", {
              severity: maxSeverity,
              totalVulnerabilities: result.findings.length,
              criticalCount: severityCounts.critical,
              highCount: severityCounts.high,
              mediumCount: severityCounts.medium,
              lowCount: severityCounts.low,
              infoCount: severityCounts.info,
              scanDuration: result.scanDuration,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            await updateScanStatus(scan.id, "failed", {
              errorMessage,
            });
          }
        })();

        return scan;
      }),

    getScan: protectedProcedure
      .input(z.object({ scanId: z.number() }))
      .query(async ({ input, ctx }) => {
        const scan = await getScanById(input.scanId);

        if (!scan) {
          return null;
        }

        // Verify ownership
        if (scan.userId !== ctx.user.id) {
          return null;
        }

        const vulnerabilities = await getVulnerabilitiesByScanId(input.scanId);

        return {
          ...scan,
          vulnerabilities: vulnerabilities.map((v) => ({
            ...v,
            evidence: v.evidence ? JSON.parse(v.evidence) : {},
          })),
        };
      }),

    listScans: protectedProcedure.query(async ({ ctx }) => {
      return getUserScans(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
