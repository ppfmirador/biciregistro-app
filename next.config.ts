
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    // This rewrite is only needed for production Firebase Hosting environments
    // to handle Firebase Authentication redirects correctly. In local development,
    // the variable is undefined, and returning an empty array prevents server start-up issues.
    if (process.env.FIREBASE_AUTH_HOSTING_URL) {
      return [
        {
          source: '/__/auth/:path*',
          destination:
            `${process.env.FIREBASE_AUTH_HOSTING_URL}/__/auth/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
