/* eslint-disable no-restricted-globals */
import generateWithBundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';
import { NextConfig } from 'next';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: ['.env.local', '.env'].flatMap((filename) => [
    path.join(__dirname, filename),
    path.join(__dirname, '../..', filename),
  ]),
  quiet: true,
});

const env = {
  BACKEND_URL: process.env.BACKEND_URL,
  SENTRY_DSN: process.env.SENTRY_DSN,
  SENTRY_TUNNEL: process.env.SENTRY_TUNNEL,
  SENTRY_ORG: process.env.SENTRY_ORG,
  SENTRY_URL: process.env.SENTRY_URL,
  SENTRY_PROJECT: process.env.SENTRY_PROJECT,
  SENTRY_TOKEN: process.env.SENTRY_TOKEN,
  ANALYZE: process.env.ANALYZE,
};

// console.log(env);

const withBundleAnalyzer = generateWithBundleAnalyzer({
  enabled: env.ANALYZE === 'true',
});

const rewrites = async () => {
  return [
    {
      source: '/api/:path*',
      destination: `${env.BACKEND_URL}/api/:path*`,
    },
  ];
};

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'export',
  productionBrowserSourceMaps: true,
  rewrites: process.env.NODE_ENV === 'development' ? rewrites : undefined,
  turbopack: {
    // Remove the parser from `react-intl` to reduce the bundle size
    // https://formatjs.github.io/docs/guides/advanced-usage#react-intl-without-parser-40-smaller
    // https://github.com/vercel/next.js/issues/30434
    resolveAlias: {
      '@formatjs/icu-messageformat-parser': '@formatjs/icu-messageformat-parser/no-parser',
    },
  },
  experimental: {
    // TODO: Turn off it if the app switched to `app` router.
    externalDir: true,
    swcPlugins: [
      [
        '@swc/plugin-formatjs',
        {
          idInterpolationPattern: '[sha512:contenthash:base64:6]',
          ast: true,
        },
      ],
    ],
  },
  env: {
    BACKEND_URL: env.BACKEND_URL,
    SENTRY_DSN: env.SENTRY_DSN,
    SENTRY_TUNNEL: env.SENTRY_TUNNEL,
  },
  webpack: (config) => {
    // See `config.turbo.resolveAlias`
    config.resolve.alias['@formatjs/icu-messageformat-parser'] =
      '@formatjs/icu-messageformat-parser/no-parser';

    // 添加这一段来修复 findDOMNode 问题
    // config.resolve.alias['react-dom'] = path.resolve('./node_modules/react-dom');

    return config;
  },
};
if (env.SENTRY_DSN) {
  module.exports = withSentryConfig(config, {
    org: env.SENTRY_ORG ?? 'mythal',
    sentryUrl: env.SENTRY_URL ?? 'https://sentry.io/',
    project: process.env.SENTRY_PROJECT ?? 'boluo-spa',
    autoInstrumentServerFunctions: false,
    autoInstrumentMiddleware: false,
    disableLogger: true,
    authToken: process.env.SENTRY_TOKEN,
    widenClientFileUpload: true,
    silent: true,
  });
} else {
  module.exports = withBundleAnalyzer(config);
}
