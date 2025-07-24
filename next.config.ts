
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
    return [
      {
        source: '/__/auth/:path*',
        destination:
          `${process.env.FIREBASE_AUTH_HOSTING_URL}/__/auth/:path*`,
      },
    ];
  },
  webpack(config, { isServer }) {
    if (isServer) {
      config.externals = config.externals || [];
      // Ensure 'firebase-admin' is treated as an external module on the server.
      config.externals.push('firebase-admin');
    }
    return config;
  },
};

export default nextConfig;
