import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  // Set by CI for GitHub Pages project deploys (e.g. '/talaria/'). Defaults
  // to '/' for local dev and for custom-domain deploys.
  base: process.env.VITE_BASE_URL ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      include: ['crypto', 'buffer', 'stream', 'util'],
      globals: { Buffer: true, global: true, process: true },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['talaria.svg'],
      manifest: {
        name: 'Talaria',
        short_name: 'Talaria',
        description: 'EVM browser with clear-signing and trustless re-verification',
        theme_color: '#0a0a0a',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/talaria.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  worker: {
    format: 'es',
  },
});
