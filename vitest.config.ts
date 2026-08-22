import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@routex/core': path.resolve(__dirname, 'src/core'),
      '@routex/workers': path.resolve(__dirname, 'src/workers'),
      '@routex/types': path.resolve(__dirname, 'src/types'),
      '@routex/components': path.resolve(__dirname, 'src/components'),
      '@routex/hooks': path.resolve(__dirname, 'src/hooks'),
      '@routex/scenarios': path.resolve(__dirname, 'src/scenarios'),
      '@routex/stores': path.resolve(__dirname, 'src/stores'),
      '@routex/db': path.resolve(__dirname, 'src/db'),
      '@routex/lib': path.resolve(__dirname, 'src/lib'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});