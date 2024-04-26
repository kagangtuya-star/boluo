const ANALYZE = Boolean(process.env.ANALYZE);

const rewrites = async () => [
  {
    source: '/api/:path*',
    destination: `${process.env.BACKEND_URL}/api/:path*`, // Proxy to Backend
  },
];

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: process.env.NODE_ENV === 'development' ? undefined : 'export',
  swcMinify: false,
  transpilePackages: ['@boluo/ui', '@boluo/chat', '@boluo/common'],
  rewrites: process.env.NODE_ENV === 'development' ? rewrites : undefined,
  env: {
    PUBLIC_MEDIA_URL: process.env.PUBLIC_MEDIA_URL,
    PUBLIC_BACKEND_URL: process.env.PUBLIC_BACKEND_URL,
  },
  webpack: (config) => {
    if (ANALYZE) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      const plugin = new BundleAnalyzerPlugin({
        analyzerMode: 'static',
      });
      config.plugins.push(plugin);
    }

    // `react-intl` without parser
    // https://formatjs.io/docs/guides/advanced-usage#react-intl-without-parser-40-smaller
    // https://github.com/vercel/next.js/issues/30434
    config.resolve.alias['@formatjs/icu-messageformat-parser'] = '@formatjs/icu-messageformat-parser/no-parser';

    return config;
  },
};
