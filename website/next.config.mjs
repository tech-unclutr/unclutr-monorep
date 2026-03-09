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
  // Serve pitch deck SPA from public/investors/ in dev mode
  // (In production static export, Firebase handles this natively)
  async rewrites() {
    return [
      {
        source: '/investors',
        destination: '/investors/index.html',
      },
      {
        source: '/investors/',
        destination: '/investors/index.html',
      },
    ];
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
