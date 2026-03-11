# OG Image for Roast Results — Design

## Problem

Shareable roast result links (`/roast/[id]`) have no OpenGraph image or dynamic metadata. When shared on social media, Discord, or messaging apps, they show a generic title and no preview image.

## Solution

Generate a dynamic OG image per roast using Takumi (`@takumi-rs/image-response`), a Rust-based JSX-to-image renderer. Add `generateMetadata` to produce dynamic titles, descriptions, and Twitter card metadata.

## Architecture

### New files

- `src/app/roast/[id]/opengraph-image/route.ts` — GET route handler returning `new ImageResponse(...)` as PNG
- `src/components/og/roast-og-image.tsx` — JSX component describing the OG image layout (uses Takumi `tw` props)

### Modified files

- `src/app/roast/[id]/page.tsx` — Replace static `metadata` export with `generateMetadata()` function
- `next.config.ts` — Add `serverExternalPackages: ["@takumi-rs/core"]`

### New dependency

- `@takumi-rs/image-response`

## Visual Design

Based on the Pencil design frame "Screen 4 - OG Image" (1200x630):

**Layout:** Flex column, centered, padding 64px, gap 28px, background `#0C0C0C`.

**Elements (top to bottom):**

1. **Logo row** — `>` in green (`#10B981`) + `devroast` in white (`#E5E5E5`), monospace bold
2. **Score row** — Large score number (e.g., `3.5`) in verdict color + `/10` in gray (`#4B5563`). Score at ~160px, denominator at ~56px
3. **Verdict row** — Colored dot (12px circle) + verdict text (e.g., `needs_serious_help`), color matches score
4. **Lang info** — `lang: javascript · 7 lines` in gray (`#4B5563`), monospace, 16px
5. **Roast quote** — Quote in double-quotes, centered, `#E5E5E5`, 22px, line-height 1.5

**Score color mapping:**

| Score Range | Color | Hex |
|---|---|---|
| 0–3 | Red | `#EF4444` |
| 3.1–6 | Amber | `#F59E0B` |
| 6.1–10 | Green | `#10B981` |

**Font:** Geist Mono (Takumi built-in) — close enough to JetBrains Mono used in the app, no custom font loading needed.

## Component Props

```typescript
type RoastOgImageProps = {
  score: number
  verdict: string
  language: string
  lineCount: number
  roastQuote: string | null
}
```

## Route Handler

`GET /roast/[id]/opengraph-image`:

1. Extract `id` from route params
2. Fetch roast via `caller.roast.getById({ id })`
3. If not found, return 404
4. Render `<RoastOgImage />` via `new ImageResponse()` with `width: 1200, height: 630, format: "png"`
5. Set `Cache-Control: public, max-age=31536000, immutable` (roasts are immutable)

## Dynamic Metadata

Replace static `metadata` in `/roast/[id]/page.tsx` with:

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const { id } = await params
  const roast = await caller.roast.getById({ id })

  return {
    title: `${roast.score}/10 — ${roast.language} Roast — DevRoast`,
    description: roast.roastQuote ?? "See how your code scored on DevRoast.",
    openGraph: {
      title: `${roast.score}/10 — ${roast.language} Roast`,
      description: roast.roastQuote ?? "See how your code scored on DevRoast.",
      images: [{ url: `/roast/${id}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${roast.score}/10 — ${roast.language} Roast`,
      description: roast.roastQuote ?? "See how your code scored on DevRoast.",
    },
  }
}
```

Note: `generateMetadata` and the page function both call `getById` — Next.js deduplicates these in the same render pass.

## Out of Scope

- Share button / copy-link UI
- OG images for homepage or leaderboard
- OG image preview during roast creation
- Share analytics
