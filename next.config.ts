import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5014', 
        pathname: '/uploads/**', 
      },
      {
        protocol: 'https',
        hostname: 'avatar.vercel.sh',
        port: '', 
        pathname: '/**', 
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/api/**',
      },
    ],
  },
};

export default nextConfig;
