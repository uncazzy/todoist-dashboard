/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app does no server-side image processing. Disabling the optimizer makes
  // /_next/image return 404 outright, so sharp/libvips is never handed
  // request-reachable bytes (GHSA-f88m-g3jw-g9cj). Global switch: it holds even if
  // an <Image> is added later, which would then render unoptimized rather than break.
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://umami.azzy.cloud; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.todoist.com https://umami.azzy.cloud; frame-ancestors 'none';"
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
