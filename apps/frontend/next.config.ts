import type { NextConfig } from 'next';
import path from 'node:path';

const isVercel = Boolean(process.env.VERCEL || process.env.NOW_BUILDER);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isVercel
    ? {}
    : {
        output: 'standalone',
        outputFileTracingRoot: path.join(__dirname, '../..'),
      }),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' }
    ]
  }
};

export default nextConfig;
