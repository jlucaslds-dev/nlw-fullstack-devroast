function HomeLeaderboardSkeleton() {
  return (
    <>
      {/* Leaderboard Card Skeletons */}
      <div className="flex flex-col gap-5">
        {Array.from({ length: 3 }).map((_, index) => (
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
      </div>

      {/* Fade Hint Skeleton */}
      <div className="flex justify-center">
        <span className="inline-block w-56 h-3 bg-bg-elevated animate-pulse rounded-sm" />
      </div>
    </>
  );
}

export { HomeLeaderboardSkeleton };
