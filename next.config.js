/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,

  images: {
    domains: ['images.unsplash.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  experimental: {
    serverComponentsExternalPackages: ['@vercel/blob', 'undici'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, undici: false }
    }
    return config
  },

  // ── HTTP Security Headers ────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control',  value: 'on' },
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' blob: https://www.geogebra.org https://geogebra.org https://www.desmos.com https://desmos.com; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.desmos.com https://www.googletagmanager.com; worker-src 'self' blob:;",
          },
        ],
      },
      {
        source: '/(.*)\\.(ico|png|jpg|jpeg|svg|css|js|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

// ── PWA ─────────────────────────────────────────────────────────────────────
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*(\/api\/)/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 },
      },
    },
    {
      urlPattern: /^https?.*\/_next\/static\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: { maxEntries: 200, maxAgeSeconds: 86400 * 30 },
      },
    },
    {
      urlPattern: /^https?.*\/_next\/image\?.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-image',
        expiration: { maxEntries: 100, maxAgeSeconds: 86400 * 7 },
      },
    },
    {
      urlPattern: /^https?.*\.(woff|woff2|eot|ttf|otf)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'font-cache',
        expiration: { maxEntries: 20, maxAgeSeconds: 86400 * 365 },
      },
    },
  ],
  fallbacks: {
    document: '/offline.html',
  },
})

// ── Sentry (injected by wizard) ──────────────────────────────────────────────
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(withPWA(nextConfig), {
  org: "schoolproai",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
