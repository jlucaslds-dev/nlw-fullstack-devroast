# Leaderboard Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the hardcoded `/leaderboard` page with real DB data — 20 entries with collapsible syntax-highlighted code blocks and live stats.

**Architecture:** Parametrize the existing `getLeaderboard` tRPC procedure to accept a `limit` input. The leaderboard page becomes an async RSC that fetches data via `caller` and renders entries using the same card layout as the homepage (CodeBlock + LeaderboardEntryCode collapsible).

**Tech Stack:** Next.js 16 (App Router, RSC), tRPC v11, Drizzle ORM, Zod, shiki (vesper theme)

---

### Task 1: Parametrize `getLeaderboard` tRPC procedure

**Files:**
- Modify: `src/trpc/routers/roast.ts:20-43`

**Step 1: Add Zod import and input schema to `getLeaderboard`**

Add `z` import and change `getLeaderboard` from a no-input procedure to one with a `limit` parameter:

```typescript
import { z } from "zod";
```

Replace the procedure definition:

```typescript
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
```

**Step 2: Verify build compiles**

Run: `pnpm build` (or `pnpm dev` and check for errors)
Expected: No type errors. The homepage `caller.roast.getLeaderboard()` call still works because `limit` defaults to 3.

**Step 3: Commit**

```
feat: parametrize getLeaderboard with limit input
```

---

### Task 2: Rewrite `/leaderboard/page.tsx` as async RSC with real data

**Files:**
- Modify: `src/app/leaderboard/page.tsx`

**Step 1: Rewrite the page**

Replace the entire file. The page uses `caller` to fetch both `getStats` and `getLeaderboard({ limit: 20 })` via `Promise.all`. It renders the hero with real stats and 20 entries using the same card layout as `home-leaderboard.tsx`.

```typescript
import type { Metadata } from "next";
import type { BundledLanguage } from "shiki";
import { CodeBlock } from "@/components/ui/code-block";
import { caller } from "@/trpc/server";
import { LeaderboardEntryCode } from "../leaderboard-entry-code";

export const metadata: Metadata = {
  title: "Shame Leaderboard — DevRoast",
  description:
    "The most roasted code on the internet. See the worst-scored submissions ranked by shame.",
};

function scoreColor(score: number): string {
  if (score <= 3) return "text-accent-red";
  if (score <= 6) return "text-accent-amber";
  return "text-accent-green";
}

export default async function LeaderboardPage() {
  const [{ totalRoasts, avgScore }, { entries }] = await Promise.all([
    caller.roast.getStats(),
    caller.roast.getLeaderboard({ limit: 20 }),
  ]);

  return (
    <main className="flex flex-col w-full">
      <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto px-10 md:px-20 py-10">
        {/* Hero Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[32px] font-bold text-accent-green">
              {">"}
            </span>
            <h1 className="font-mono text-[28px] font-bold text-text-primary">
              shame_leaderboard
            </h1>
          </div>

          <p className="font-mono text-sm text-text-secondary">
            {"// the most roasted code on the internet"}
          </p>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-text-tertiary">
              {totalRoasts.toLocaleString()} submissions
            </span>
            <span className="font-mono text-xs text-text-tertiary">{"·"}</span>
            <span className="font-mono text-xs text-text-tertiary">
              avg score: {avgScore.toFixed(1)}/10
            </span>
          </div>
        </section>

        {/* Leaderboard Entries */}
        <section className="flex flex-col gap-5">
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="flex flex-col border border-border-primary overflow-hidden"
            >
              {/* Meta Row */}
              <div className="flex items-center justify-between h-12 px-5 border-b border-border-primary">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[13px] text-text-tertiary">
                      #
                    </span>
                    <span className="font-mono text-[13px] font-bold text-accent-amber">
                      {entry.rank}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-text-tertiary">
                      score:
                    </span>
                    <span
                      className={`font-mono text-[13px] font-bold ${scoreColor(entry.score)}`}
                    >
                      {entry.score.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-text-secondary">
                    {entry.language}
                  </span>
                  <span className="font-mono text-xs text-text-tertiary">
                    {entry.lineCount} lines
                  </span>
                </div>
              </div>

              {/* Code Preview with Collapsible */}
              <LeaderboardEntryCode lineCount={entry.lineCount}>
                <CodeBlock
                  code={entry.code}
                  lang={entry.language as BundledLanguage}
                  className="border-0"
                />
              </LeaderboardEntryCode>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
```

Key differences from the current hardcoded page:
- Async RSC with `caller` for data fetching
- `Promise.all` for parallel queries (getStats + getLeaderboard)
- Real stats in the hero (totalRoasts, avgScore)
- Uses `LeaderboardEntryCode` for collapsible code blocks
- Uses `entry.id` as key instead of `entry.rank`
- Language cast to `BundledLanguage` for shiki

**Step 2: Verify the page renders**

Run: `pnpm dev` and navigate to `http://localhost:3000/leaderboard`
Expected: 20 entries from the DB with syntax highlighting and collapsible code blocks. Hero shows real stats.

**Step 3: Commit**

```
feat: leaderboard page with real data, collapsible code blocks
```
