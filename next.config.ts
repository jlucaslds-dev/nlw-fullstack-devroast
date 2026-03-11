import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  cacheLife: {
    hourly: {
      stale: 3600,
      revalidate: 3600,
      expire: 86400,
    },
  },
};

export default nextConfig;
