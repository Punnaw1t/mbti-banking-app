/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // "Reset demo data" reads the seed SQL at runtime; bundle it with that
    // function so it exists on Vercel too.
    outputFileTracingIncludes: {
      "/api/demo/reset": ["./db/init/02_seed.sql"],
    },
  },
};

module.exports = nextConfig;
