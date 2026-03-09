"use client";

import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

function HomeStats() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.roast.getStats.queryOptions());

  return (
    <div className="flex items-center gap-6 justify-center pt-8">
      <span className="font-mono text-xs text-text-tertiary">
        <NumberFlow
          value={data?.totalRoasts ?? 0}
          format={{ useGrouping: true }}
          className="font-mono tabular-nums"
        />{" "}
        codes roasted
      </span>
      <span className="font-mono text-xs text-text-tertiary">·</span>
      <span className="font-mono text-xs text-text-tertiary">
        avg score:{" "}
        <NumberFlow
          value={data?.avgScore ?? 0}
          format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
          className="font-mono tabular-nums"
        />
        /10
      </span>
    </div>
  );
}

export { HomeStats };
