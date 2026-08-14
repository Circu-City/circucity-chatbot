/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: { staticIndicator: false },
  
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Standard next build - cPanel Passenger uses server.js with next start
};

module.exports = nextConfig;
