/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Proxy API calls in dev to avoid CORS dance with LibreChat.
  async rewrites() {
    return [
      {
        source: "/api/librechat/:path*",
        destination: `${process.env.NEXT_PUBLIC_LIBRECHAT_API || "http://localhost:3090/api"}/:path*`,
      },
      {
        source: "/api/ppt/:path*",
        destination: `${process.env.NEXT_PUBLIC_PPT_SERVICE_API || "http://localhost:8200"}/:path*`,
      },
      {
        source: "/api/skills/:path*",
        destination: `${process.env.NEXT_PUBLIC_SKILL_SERVICE_API || "http://localhost:8300"}/:path*`,
      },
      {
        source: "/api/persona/:path*",
        destination: `${process.env.NEXT_PUBLIC_PERSONA_SERVICE_API || "http://localhost:8100"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
