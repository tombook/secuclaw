import { defineConfig } from 'vite';
import { resolve } from 'path';
import { mockApiPlugin } from './src/plugins/adapters/mock-api-server';

export default defineConfig({
  plugins: [mockApiPlugin()],
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
