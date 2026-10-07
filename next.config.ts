import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self)' },
    ] }, ...['/api/admin/:path*', '/api/cron/:path*', '/api/projects/:path*', '/api/provider-opportunities/:path*', '/project/:path*', '/provider-opportunity/:path*'].map(source => ({
      source, headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0' }],
    }))];
  },
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
        source: '/quick-join',
        destination: '/join',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
