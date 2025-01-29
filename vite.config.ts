import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
import { preact } from '@preact/preset-vite';
import glsl from 'vite-plugin-glsl';
// import rawPlugin from 'vite-raw-plugin';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { createHtmlPlugin } from 'vite-plugin-html';
import { checker } from 'vite-plugin-checker';

export default defineConfig({
  plugins: [
    // react(),
    preact(),
    createHtmlPlugin({
      minify: true,
      inject: {
        data: {
          title: 'My Vite App',
        },
      },
    }),
    glsl(),
    wasm(),
    topLevelAwait(),
    checker({
      // e.g. use TypeScript check
      typescript: true,
    }),
    // rawPlugin({
    //   fileRegex: /\.wgsl$/,
    // }),
  ],
  worker: {
    // Not needed with vite-plugin-top-level-await >= 1.3.0
    format: 'es',
    // plugins: [
    //   wasm(),
    //   topLevelAwait()
    // ]
    plugins: () => {
      return [wasm(), topLevelAwait()];
    },
    // rollupOptions: {
    //   output: {
    //     format: 'iife',
    //     inlineDynamicImports: true,
    //   },
    //   // external: ['./src/engine/wasmEngine/wasm/build/asc/engine.wasm'],
    //   // external: [/^.*\.wasm$/],
    // },
    // https://vite.dev/config/worker-options.html#worker-options
    // rollupOptions: {
    // },
  },
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
    },
  },
  build: {
    target: 'esnext',
    // rollupOptions: {
    //   // external: ['./src/engine/wasmEngine/wasm/build/asc/engine.wasm'],
    //   external: [/^.*\.wasm$/],
    // },
  },
  optimizeDeps: {
    exclude: ['assemblyscript-wasm'],
  },
  server: {
    fs: {
      allow: ['.'],
    },
  },
});
