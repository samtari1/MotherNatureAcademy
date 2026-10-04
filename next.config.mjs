/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    // Keep browser API/media requests on the site origin so the admin session
    // cookie works consistently in local development and reverse-proxy setups.
    const apiTarget = process.env.API_PROXY_TARGET || "http://127.0.0.1:8000";
    return [
      { source: "/api/:path*", destination: `${apiTarget}/api/:path*` },
      { source: "/health", destination: `${apiTarget}/health` },
      { source: "/media/:path*", destination: `${apiTarget}/media/:path*` },
    ];
  },
  async redirects() {
    return [
      { source: "/preschoolprogram.html", destination: "/program", permanent: true },
      { source: "/curriculum.html", destination: "/curriculum", permanent: true },
      { source: "/campus.html", destination: "/campus", permanent: true },
      { source: "/hours.html", destination: "/hours", permanent: true },
      { source: "/contact.html", destination: "/contact", permanent: true },
    ];
  },
};

export default nextConfig;
