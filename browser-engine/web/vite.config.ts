import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@routex/shared': path.resolve(__dirname, '../shared'),
      '@routex/engine': path.resolve(__dirname, '../engine'),
      '@routex/worker': path.resolve(__dirname, '../worker'),
    },
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2022',
  },
});