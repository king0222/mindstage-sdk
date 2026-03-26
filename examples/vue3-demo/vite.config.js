import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Force Vite to use the built SDK output while keeping the public import path.
      'mindstage-sdk': path.resolve(__dirname, '../../dist/index.js'),
    },
  },
  server: {
    port: 5173,
  },
});
