import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

const headerList = Object.entries(securityHeaders(process.env.NODE_ENV !== "production"))
  .map(([key, value]) => ({ key, value }));

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: headerList,
      },
    ];
  },
};

export default nextConfig;
