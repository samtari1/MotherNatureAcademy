/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
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
