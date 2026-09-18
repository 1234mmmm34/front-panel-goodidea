import type { NextConfig } from "next";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: "https://api.panel.good-idea.com.mx/api/:path*",
        // destination: "https://localhost:7036/api/:path*",
      },
    ];
  },
};

export default nextConfig;

