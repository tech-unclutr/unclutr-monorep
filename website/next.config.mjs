import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  ...(process.env.NODE_ENV === 'production' ? { output: "export" } : {}),
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.datocms-assets.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Serve pitch deck SPAs from public/ in dev mode
  // (In production static export, Firebase handles this natively)
  async rewrites() {
    return {
      beforeFiles: [
        // Existing — Vite-built investor deck
        {
          source: '/investors',
          destination: '/investors/index.html',
        },
        {
          source: '/investors/',
          destination: '/investors/index.html',
        },
        // New — Apr 2026 standalone HTML deck
        {
          source: '/pitch-apr-2026',
          destination: '/pitch-apr-2026/index.html',
        },
        {
          source: '/pitch-apr-2026/',
          destination: '/pitch-apr-2026/index.html',
        },
      ],
    };
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
