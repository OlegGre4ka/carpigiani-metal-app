import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // The browser reaches the API and uploaded photos through the site address:
  // /api/... and /uploads/... are passed on to FastAPI.
  async rewrites() {
    const backend = process.env.BACKEND_URL ?? "http://localhost:8000";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/uploads/:path*", destination: `${backend}/uploads/:path*` },
    ];
  },
  // The old site had a Russian version under /ru. The new site has no Russian,
  // so old /ru links open the same page in Ukrainian.
  async redirects() {
    return [
      { source: "/ru", destination: "/", permanent: true },
      { source: "/ru/:path*", destination: "/:path*", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
