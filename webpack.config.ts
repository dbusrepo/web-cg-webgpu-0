// see https://webpack.js.org/configuration/configuration-languages/#typescript
// https://survivejs.com/webpack/building/source-maps/
// const HtmlWebpackPlugin = require('html-webpack-plugin');
// const path = require('path');
import * as path from 'path';
import * as webpack from 'webpack'; // TODO
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { ProvidePlugin } from 'webpack';
// in case you run into any typescript error when configuring `devServer`
import 'webpack-dev-server';

const config: webpack.Configuration = {
  entry: './src/main.ts',
  mode: 'development',
  // devtool: 'eval',
  // devtool: 'source-map',
  // devtool: 'inline-source-map',
  devtool: 'eval-source-map',
  // devtool: 'hidden-source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      progress: false,
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    compress: true,
    port: 9091,
    hot: true,
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      images: path.resolve(__dirname, 'src/asset/images/'),
      react: 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat', // Must be below test-utils
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
      },
      {
        test: /\.?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.wasm$/,
        exclude: /node_modules/,
        loader: 'wasm-loader',
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[hash][ext][query]',
        },
      },
      // {
      //   test: /\.wasm$/,
      //   type: 'asset/resource',
      // },
      // {
      //   test: /\.wasm$/,
      //   exclude: /node_modules/,
      //   loader: 'file-loader',
      // },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    new ProvidePlugin({
      process: 'process/browser',
    }),
  ],
};

export default config;

