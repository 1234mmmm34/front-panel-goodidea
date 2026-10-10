process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

/** @type {import('next').NextConfig} */
const nextConfig = {
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