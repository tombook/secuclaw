import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'esnext',
    lib: {
      entry: resolve(__dirname, 'src/bootstrap.ts'),
      formats: ['es'],
      fileName: () => 'secuclaw.js',
    },
  },
  server: {
    port: 3200,
    open: true,
  },
});
