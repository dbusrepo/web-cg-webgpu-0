// https://gist.github.com/rupeshtiwari/e7235addd5f52dc3e449672c4d8b88d5
// see https://webpack.js.org/configuration/configuration-languages/#typescript
// https://survivejs.com/webpack/building/source-maps/
// const HtmlWebpackPlugin = require('html-webpack-plugin');
// const path = require('path');
import path from 'path';
import * as webpack from 'webpack'; // TODO
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { ProvidePlugin } from 'webpack';
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserPlugin from "terser-webpack-plugin";
// in case you run into any typescript error when configuring `devServer`
import 'webpack-dev-server';
import { argv } from 'process';

let env = process.env['NODE_ENV'];

// const isProduction = process.env.NODE_ENV == 'production';
let isProduction =
    (env && env.match(/production/)) ||
    argv.reduce((prev, cur) => prev || cur === '--production', false);

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
    fallback: {
      stream: require.resolve('stream-browserify')
    }
  },
  performance: {
      hints: false,
      maxEntrypointSize: 51200,
      maxAssetSize: 51200
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
          test: /\.css$/,
          sideEffects: true,
          use: [
              MiniCssExtractPlugin.loader,
              'css-loader'
          ],
          exclude: /node_modules/,
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
      {
        test: /\.res$/i,
        type: 'asset/resource',
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
    // new HtmlWebpackPlugin({
    //   template: './src/index.html',
    // }),
    new CleanWebpackPlugin(),
    new ProvidePlugin({
      process: 'process/browser',
    }),
    new MiniCssExtractPlugin(),
    // to use file-type I add this and the 'fallback' above. See here:
    // https://stackoverflow.com/questions/72133210/react-unhandledschemeerror-nodebuffer-is-not-handled-by-plugins
    // see also https://gist.github.com/ef4/d2cf5672a93cf241fd47c020b9b3066a
    new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
      resource.request = resource.request.replace(/^node:/, "");
    }),
  ],
  optimization: {
      minimize: isProduction ? true : false,
      minimizer: [
          new TerserPlugin({ test: /\.js(\?.*)?$/i }),
          new CssMinimizerPlugin({})
      ]
  }
};

export default config;

