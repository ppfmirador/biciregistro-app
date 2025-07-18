
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
          'https://bike-guardian-hbbg6.firebaseapp.com/__/auth/:path*',
      },
    ];
  },
  webpack(config, { isServer }) {
    if (isServer) {
      // Avoid bundling the Firebase Admin SDK to prevent
      // issues with optional dependencies like WebAssembly modules.
      config.externals = config.externals || [];
      config.externals.push('firebase-admin');
    }
    return config;
  },
};

export default nextConfig;
