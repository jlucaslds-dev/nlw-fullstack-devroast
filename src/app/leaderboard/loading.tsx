export default function LeaderboardLoading() {
  return (
    <main className="flex flex-col w-full">
      <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto px-10 md:px-20 py-10">
        {/* Hero Section Skeleton */}
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
            <span className="inline-block w-28 h-3 bg-bg-elevated animate-pulse rounded-sm" />
            <span className="font-mono text-xs text-text-tertiary">{"·"}</span>
            <span className="inline-block w-24 h-3 bg-bg-elevated animate-pulse rounded-sm" />
          </div>
        </section>

        {/* Leaderboard Card Skeletons */}
        <section className="flex flex-col gap-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`skeleton-card-${index.toString()}`}
              className="flex flex-col border border-border-primary overflow-hidden"
            >
              {/* Meta Row Skeleton */}
              <div className="flex items-center justify-between h-12 px-5 border-b border-border-primary">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 bg-bg-elevated animate-pulse rounded-sm" />
                    <span className="inline-block w-4 h-3 bg-bg-elevated animate-pulse rounded-sm" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-10 h-3 bg-bg-elevated animate-pulse rounded-sm" />
                    <span className="inline-block w-6 h-3 bg-bg-elevated animate-pulse rounded-sm" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-block w-16 h-3 bg-bg-elevated animate-pulse rounded-sm" />
                  <span className="inline-block w-14 h-3 bg-bg-elevated animate-pulse rounded-sm" />
                </div>
              </div>

              {/* Code Area Skeleton */}
              <div className="flex flex-col gap-2 p-4">
                <span className="inline-block w-4/5 h-3 bg-bg-elevated animate-pulse rounded-sm" />
                <span className="inline-block w-3/5 h-3 bg-bg-elevated animate-pulse rounded-sm" />
                <span className="inline-block w-2/3 h-3 bg-bg-elevated animate-pulse rounded-sm" />
                <span className="inline-block w-1/2 h-3 bg-bg-elevated animate-pulse rounded-sm" />
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
