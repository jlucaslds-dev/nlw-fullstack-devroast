# Spec: tRPC — Camada de API

## Resumo

Adicionar tRPC v11 como camada de API type-safe entre o frontend Next.js e o banco Drizzle/PostgreSQL. A integracao segue o padrao oficial do tRPC com TanStack React Query, usando `createTRPCOptionsProxy` para prefetch em Server Components e `useTRPC` + hooks do React Query em Client Components.

---

## Pesquisa realizada

### Abordagens de API analisadas

| Abordagem | Descricao | Veredicto |
|---|---|---|
| **tRPC v11 + TanStack React Query** | API type-safe end-to-end, integracao nativa com RSC via `createTRPCOptionsProxy`, prefetch com hydration | **Recomendado** |
| **Next.js Server Actions** | Funcoes server-side chamadas diretamente do client. Simples, sem camada extra | Insuficiente — sem cache layer, sem query invalidation, sem staleTime |
| **API Routes manuais + fetch** | Route handlers em `app/api/`, fetch manual com tipos duplicados | Descartado — duplicacao de tipos, sem type-safety end-to-end |

### Integracao com React Server Components

O tRPC v11 oferece duas formas de consumir dados no server:

| Metodo | Uso | Integra com cache do React Query? |
|---|---|---|
| **`createTRPCOptionsProxy`** + `prefetchQuery` | Prefetch em RSC, consume com `useQuery`/`useSuspenseQuery` no client | Sim — hydration via `HydrationBoundary` |
| **`createCallerFactory`** (server caller) | Chamada direta no RSC, retorna dados | Nao — desacoplado do QueryClient |

Decisao: usar `createTRPCOptionsProxy` como padrao para prefetch + hydration. Expor tambem um `caller` para casos onde o dado e consumido apenas no server (ex: metadata dinamica).

---

## Decisao

### Arquitetura

```
Browser (Client Component)
  │
  │  useQuery(trpc.roast.getById.queryOptions({ id }))
  │  useMutation(trpc.roast.create.mutationOptions())
  │
  ▼
TRPCReactProvider (layout.tsx)
  │  QueryClientProvider + TRPCProvider
  │
  ▼
httpBatchLink → /api/trpc/[trpc]/route.ts
  │  fetchRequestHandler
  │
  ▼
appRouter (tRPC router)
  │  procedures com zod validation
  │
  ▼
Drizzle ORM → PostgreSQL


Server Component (RSC)
  │
  │  prefetch(trpc.roast.getById.queryOptions({ id }))
  │  // ou: caller.roast.getById({ id })
  │
  ▼
appRouter.createCaller (direct call, sem HTTP)
  │
  ▼
Drizzle ORM → PostgreSQL
```

### Por que tRPC + TanStack React Query

1. **Type-safety end-to-end** — Input/output tipados automaticamente do router ate o hook no client, sem codegen.
2. **Prefetch em RSC** — `createTRPCOptionsProxy` permite prefetch no server e hydration no client via `HydrationBoundary`, aproveitando streaming do Next.js.
3. **Cache e invalidation** — React Query gerencia staleTime, refetch, optimistic updates e invalidation apos mutations.
4. **Zod validation** — Input validation colocada na procedure, reutilizavel e type-safe.
5. **Drizzle ja esta no projeto** — Procedures importam `db` diretamente de `@/db`, sem adaptador extra.

---

## Especificacao de implementacao

### Estrutura de arquivos

```
src/
  trpc/
    init.ts           # initTRPC, context factory, base procedure
    routers/
      _app.ts         # appRouter (merge de todos os sub-routers)
      roast.ts        # procedures de roast (create, getById, getStats)
      leaderboard.ts  # procedures de leaderboard (list)
    query-client.ts   # makeQueryClient factory (shared server/client)
    client.tsx        # TRPCProvider, useTRPC (client-only)
    server.tsx        # createTRPCOptionsProxy, prefetch helper, caller (server-only)
  app/
    api/
      trpc/
        [trpc]/
          route.ts    # fetchRequestHandler (GET + POST)
    layout.tsx        # wraps children com TRPCReactProvider
```

### 1. `src/trpc/init.ts` — Inicializacao do tRPC

```typescript
import { initTRPC } from "@trpc/server"
import { cache } from "react"
import { db } from "@/db"

export const createTRPCContext = cache(async () => {
  return { db }
})

const t = initTRPC.create()

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const baseProcedure = t.procedure
```

Notas:
- Sem `superjson` — os dados do Drizzle sao serializaveis nativamente (sem Date objects custom, UUIDs sao strings)
- O context expoe `db` para todas as procedures
- `cache()` do React garante que o contexto e criado uma unica vez por request no server

### 2. `src/trpc/routers/_app.ts` — Root router

```typescript
import { createTRPCRouter } from "../init"
import { roastRouter } from "./roast"
import { leaderboardRouter } from "./leaderboard"

export const appRouter = createTRPCRouter({
  roast: roastRouter,
  leaderboard: leaderboardRouter,
})

export type AppRouter = typeof appRouter
```

### 3. `src/trpc/routers/roast.ts` — Procedures de roast

```typescript
import { z } from "zod"
import { eq, asc, count, avg } from "drizzle-orm"
import { roasts, analysisItems } from "@/db/schema"
import { createTRPCRouter, baseProcedure } from "../init"

export const roastRouter = createTRPCRouter({
  getById: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [roast] = await ctx.db
        .select()
        .from(roasts)
        .where(eq(roasts.id, input.id))

      if (!roast) throw new Error("Roast not found")

      const items = await ctx.db
        .select()
        .from(analysisItems)
        .where(eq(analysisItems.roastId, input.id))
        .orderBy(asc(analysisItems.order))

      return { ...roast, analysisItems: items }
    }),

  getStats: baseProcedure.query(async ({ ctx }) => {
    const [stats] = await ctx.db
      .select({
        totalRoasts: count(),
        avgScore: avg(roasts.score),
      })
      .from(roasts)

    return stats
  }),

  create: baseProcedure
    .input(z.object({
      code: z.string().min(1).max(10000),
      language: z.string(),
      roastMode: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: integrar com Vercel AI SDK para gerar analise
      // Por ora, placeholder para a estrutura da mutation
      return { id: "placeholder" }
    }),
})
```

### 4. `src/trpc/routers/leaderboard.ts` — Procedures de leaderboard

```typescript
import { z } from "zod"
import { asc } from "drizzle-orm"
import { roasts } from "@/db/schema"
import { createTRPCRouter, baseProcedure } from "../init"

export const leaderboardRouter = createTRPCRouter({
  list: baseProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20
      const offset = input?.offset ?? 0

      const entries = await ctx.db
        .select()
        .from(roasts)
        .orderBy(asc(roasts.score))
        .limit(limit)
        .offset(offset)

      return entries
    }),
})
```

### 5. `src/trpc/query-client.ts` — QueryClient factory

```typescript
import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query"

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  })
}
```

Notas:
- `staleTime: 30s` evita refetch imediato no client apos hydration do server
- `shouldDehydrateQuery` inclui queries pendentes para suportar streaming (prefetch sem await)

### 6. `src/trpc/client.tsx` — Client provider

```typescript
"use client"

import type { QueryClient } from "@tanstack/react-query"
import { QueryClientProvider } from "@tanstack/react-query"
import { createTRPCClient, httpBatchLink } from "@trpc/client"
import { createTRPCContext } from "@trpc/tanstack-react-query"
import { useState } from "react"
import { makeQueryClient } from "./query-client"
import type { AppRouter } from "./routers/_app"

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()

let browserQueryClient: QueryClient

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient()
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

function getUrl() {
  const base = (() => {
    if (typeof window !== "undefined") return ""
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    return "http://localhost:3000"
  })()
  return `${base}/api/trpc`
}

export function TRPCReactProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const queryClient = getQueryClient()
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: getUrl() })],
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}
```

### 7. `src/trpc/server.tsx` — Server-side helpers

```typescript
import "server-only"

import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query"
import type { TRPCQueryOptions } from "@trpc/tanstack-react-query"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { cache } from "react"
import { createTRPCContext } from "./init"
import { makeQueryClient } from "./query-client"
import { appRouter } from "./routers/_app"

export const getQueryClient = cache(makeQueryClient)

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
})

export const caller = appRouter.createCaller(createTRPCContext)

// Helper: hydration wrapper
export function HydrateClient({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  )
}

// Helper: prefetch generico
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient()
  if (queryOptions.queryKey[1]?.type === "infinite") {
    void queryClient.prefetchInfiniteQuery(queryOptions as any)
  } else {
    void queryClient.prefetchQuery(queryOptions)
  }
}
```

### 8. `src/app/api/trpc/[trpc]/route.ts` — HTTP handler

```typescript
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { createTRPCContext } from "@/trpc/init"
import { appRouter } from "@/trpc/routers/_app"

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  })

export { handler as GET, handler as POST }
```

### 9. `src/app/layout.tsx` — Adicionar provider

Wrapping `{children}` com `TRPCReactProvider`:

```typescript
import { TRPCReactProvider } from "@/trpc/client"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body className="font-sans antialiased">
        <TRPCReactProvider>
          <Navbar />
          {children}
        </TRPCReactProvider>
      </body>
    </html>
  )
}
```

### Exemplo de uso: pagina de resultado (RSC + prefetch)

```typescript
// src/app/roast/[id]/page.tsx
import { HydrateClient, prefetch, trpc } from "@/trpc/server"
import { RoastResult } from "./roast-result" // client component

export default async function RoastResultPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  prefetch(trpc.roast.getById.queryOptions({ id }))

  return (
    <HydrateClient>
      <RoastResult id={id} />
    </HydrateClient>
  )
}
```

```typescript
// src/app/roast/[id]/roast-result.tsx
"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"

export function RoastResult({ id }: { id: string }) {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery(trpc.roast.getById.queryOptions({ id }))

  return <div>{data.roastQuote}</div>
}
```

---

## Dependencias novas

| Pacote | Motivo | Tipo |
|---|---|---|
| `@trpc/server` | Core do tRPC (router, procedures, adapters) | producao |
| `@trpc/client` | Client HTTP (httpBatchLink) | producao |
| `@trpc/tanstack-react-query` | Integracao TanStack React Query (createTRPCContext, createTRPCOptionsProxy) | producao |
| `@tanstack/react-query` | Cache layer, hooks (useQuery, useMutation, useSuspenseQuery) | producao |
| `zod` | Validacao de input nas procedures | producao |
| `server-only` | Garante que `trpc/server.tsx` nao e importado no client | producao |
| `client-only` | Garante que modulos client nao sao importados no server (opcional) | producao |

---

## Riscos e consideracoes

1. **Compatibilidade tRPC v11 + Next.js 16** — tRPC v11 e relativamente novo. Testar que o fetch adapter funciona corretamente com o App Router do Next.js 16. A documentacao oficial ja cobre esse cenario.

2. **React Compiler + tRPC hooks** — O projeto usa `reactCompiler: true`. Os hooks do React Query (`useQuery`, `useMutation`) devem funcionar normalmente, mas testar que o `useState` usado para criar o `trpcClient` nao e otimizado incorretamente pelo compiler.

3. **Hydration mismatch** — Se o `staleTime` for muito baixo, o client pode refetch imediatamente apos hydration, causando flash. Os 30s configurados devem ser suficientes.

4. **Bundle size** — tRPC client + React Query adicionam ~30-40 KB gzip ao client bundle. Aceitavel para a funcionalidade que entregam.

5. **Mutation `roast.create` depende da IA** — A procedure `create` e um placeholder ate a integracao com Vercel AI SDK ser implementada. A estrutura do tRPC ja estara pronta para receber essa logica.

---

## TODOs de implementacao

- [x] Instalar dependencias: `pnpm add @trpc/server @trpc/client @trpc/tanstack-react-query @tanstack/react-query zod server-only client-only`
- [x] Criar `src/trpc/init.ts` — initTRPC, context com `db`, baseProcedure
- [x] Criar `src/trpc/routers/roast.ts` — procedure getStats (getById e create pendentes)
- [ ] Criar `src/trpc/routers/leaderboard.ts` — procedure list com paginacao
- [x] Criar `src/trpc/routers/_app.ts` — appRouter mergeando sub-routers
- [x] Criar `src/trpc/query-client.ts` — makeQueryClient factory
- [x] Criar `src/trpc/client.tsx` — TRPCReactProvider, useTRPC
- [x] Criar `src/trpc/server.tsx` — createTRPCOptionsProxy, HydrateClient, prefetch, caller
- [x] Criar `src/app/api/trpc/[trpc]/route.ts` — fetch adapter handler
- [x] Modificar `src/app/layout.tsx` — adicionar TRPCReactProvider envolvendo children
- [x] Substituir dados hardcoded de stats em `src/app/page.tsx` por prefetch de roast.getStats
- [ ] Substituir dados hardcoded em `src/app/page.tsx` por prefetch de leaderboard.list
- [ ] Substituir dados hardcoded em `src/app/leaderboard/page.tsx` por prefetch de leaderboard.list
- [ ] Substituir dados hardcoded em `src/app/roast/[id]/page.tsx` por prefetch de roast.getById
- [x] Rodar Biome (lint + format) em todos os arquivos criados/modificados
- [x] Testar build completo: prefetch no RSC → hydration no client → dados renderizados
