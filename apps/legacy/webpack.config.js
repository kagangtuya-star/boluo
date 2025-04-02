'use strict';
// https://webpack.js.org/guides/

require('dotenv').config();
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const SpriteLoaderPlugin = require('svg-sprite-loader/plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');

const rootPath = path.resolve(__dirname);
const PRODUCTION = process.env.NODE_ENV === 'production';

module.exports = {
  entry: './src/index.tsx',

  // https://webpack.js.org/configuration/devtool/
  devtool: PRODUCTION ? false : 'source-map',
  mode: PRODUCTION ? 'production' : 'development',

  output: {
    filename: 'main.[contenthash].js',
    chunkFilename: '[id].[contenthash].js',
    path: path.resolve(rootPath, 'dist'),
    publicPath: '/',
  },

  plugins: [
    new CopyPlugin({
      patterns: [{ from: 'public/_redirects', to: '.' }],
    }),
    new webpack.DefinePlugin({
      'process.env.PUBLIC_BACKEND_URL': JSON.stringify(process.env.PUBLIC_BACKEND_URL),
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(rootPath, PRODUCTION ? 'public/index.html' : 'public/index.dev.html'),
      inject: true,
      favicon: PRODUCTION
        ? path.resolve(rootPath, 'src/assets/logo.svg')
        : path.resolve(rootPath, 'src/assets/logo-dev.svg'),
    }),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css',
    }),
    new SpriteLoaderPlugin(),
    ...(process.env.ANALYZE ? [new BundleAnalyzerPlugin()] : []),
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
  ],

  devServer: {
    static: {
      directory: path.resolve(__dirname, 'public'),
    },
    proxy: [
      {
        context: ['/api'],
        target: process.env.BACKEND_URL || 'https://boluo-net.kagangtuya.top',
        secure: false,
        changeOrigin: true,
        ws: true,
      },
    ],
    hot: true,
    compress: true,
    historyApiFallback: true,
    port: 3300,
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json', '.wasm'],
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [{ loader: 'babel-loader' }],
      },
      {
        test: /\.css$/,
        use: [
          PRODUCTION ? MiniCssExtractPlugin.loader : { loader: 'style-loader' },
          { loader: 'css-loader' },
        ],
      },
      { test: /\.(png|jpe?g|gif|woff2)$/, use: ['file-loader'] },
      {
        test: /\.svg$/,
        loader: 'svg-sprite-loader',
        options: {
          extract: true,
          spriteFilename: '[contenthash].svg',
          esModule: false,
        },
      },
    ],
  },

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8,
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true,
          },
        },
        parallel: true,
      }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 20000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            return `npm.${packageName.replace('@', '')}`;
          },
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-redux)[\\/]/,
          name: 'react-vendor',
          priority: 20,
        },
      },
    },
    runtimeChunk: 'single',
  },

  performance: {
    hints: PRODUCTION ? 'warning' : false,
    maxAssetSize: 300000,
    maxEntrypointSize: 500000,
  },
};
