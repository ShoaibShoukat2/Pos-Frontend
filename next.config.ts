import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "shoaibahmad.pythonanywhere.com",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;
