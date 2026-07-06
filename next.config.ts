import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vnpafurjyexvmghuwemm.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/join',
        destination: 'https://wa.me/message/VOIITMTQW6ZSI1', // Temporarily routing to your WhatsApp
        permanent: false,
      },
      {
        source: '/quick-join',
        destination: 'https://wa.me/message/VOIITMTQW6ZSI1', // Temporarily routing to your WhatsApp
        permanent: false,
      },
    ];
  },
};

export default nextConfig;