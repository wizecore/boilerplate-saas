/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  // Avoid ERR_MODULE_NOT_FOUND by transpiling motion, or framer-motion
  transpilePackages: ["motion", "framer-motion"],
  // Keep the Prisma client, its Postgres driver adapter and pg out of the bundle so the
  // generated query compiler and node-postgres resolve from node_modules at runtime.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  experimental: {
    scrollRestoration: true,
    webVitalsAttribution: ["CLS", "LCP"],
    serverSourceMaps: true,
    webpackBuildWorker: true,
    webpackMemoryOptimizations: true
  },
  allowedDevOrigins: process.env.NEXT_PUBLIC_APP_URL
    ? [new URL(process.env.NEXT_PUBLIC_APP_URL).hostname]
    : undefined,
  devIndicators: false,
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/logging
  logging: {
    incomingRequests: false,
    fetches: {
      fullUrl: true
    }
  },
  async headers() {
    return [
      {
        source: "/api/:everything*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, max-age=0"
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400"
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*"
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true"
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "content-type,authorization"
          },
          {
            key: "Access-Control-Expose-Headers",
            value: "content-type,authorization"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
