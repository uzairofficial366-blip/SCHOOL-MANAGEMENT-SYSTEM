import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  // Packages that use native Node.js modules must not be bundled by the Edge runtime
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs", "speakeasy", "bullmq", "ioredis", "socket.io"],
};

export default nextConfig;
