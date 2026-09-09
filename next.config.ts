import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: "https://api.panel.good-idea.com.mx/api/:path*",
      },
    ];
  },
};

export default nextConfig;

