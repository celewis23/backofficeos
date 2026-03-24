import path from "node:path"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../.."),
  serverExternalPackages: ["@prisma/client", "prisma", "@backoffice-os/database"],
  outputFileTracingIncludes: {
    "/*": [
      "../../node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/**/*",
      "../../node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/**/*",
      "../../node_modules/.prisma/client/**/*",
      "../../packages/database/prisma/**/*",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.googleapis.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "@radix-ui/react-icons"],
  },
}

export default nextConfig
