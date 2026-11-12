/** @type {import('next').NextConfig} */
const nextConfig = {
  // Email-link tokens must not appear in development request logs.
  logging: { incomingRequests: false },
  allowedDevOrigins: ["localhost", "127.0.0.1", "0.0.0.0", "*.e2b.app"],
  turbopack: { root: process.cwd() },
  outputFileTracingExcludes: { "/*": ["./data/**/*", "./.env*"] },
  
  // 👇 ADD THIS SECTION TO FIX SERVER ACTIONS
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3000', '127.0.0.1:3000'],
    },
  },
  
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;