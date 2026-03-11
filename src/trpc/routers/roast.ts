import { asc, avg, count } from "drizzle-orm";
import { z } from "zod";
import { roasts } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";

export const roastRouter = createTRPCRouter({
  getStats: baseProcedure.query(async ({ ctx }) => {
    const [stats] = await ctx.db
      .select({
        totalRoasts: count(),
        avgScore: avg(roasts.score),
      })
      .from(roasts);

    return {
      totalRoasts: stats.totalRoasts,
      avgScore: stats.avgScore ? Number.parseFloat(stats.avgScore) : 0,
    };
  }),

  getLeaderboard: baseProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(3) }))
    .query(async ({ ctx, input }) => {
      const [entries, [{ total }]] = await Promise.all([
        ctx.db
          .select({
            id: roasts.id,
            code: roasts.code,
            score: roasts.score,
            language: roasts.language,
          })
          .from(roasts)
          .orderBy(asc(roasts.score))
          .limit(input.limit),
        ctx.db.select({ total: count() }).from(roasts),
      ]);

      return {
        entries: entries.map((entry, index) => ({
          ...entry,
          rank: index + 1,
          lineCount: entry.code.split("\n").length,
        })),
        totalCount: total,
      };
    }),
});
