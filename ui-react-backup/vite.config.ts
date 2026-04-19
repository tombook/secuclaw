import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:21982',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://127.0.0.1:21981',
        ws: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            if (id.includes('@radix-ui')) return 'radix';
            if (id.includes('lucide')) return 'lucide';
            if (id.includes('zustand') || id.includes('immer')) return 'state';
            return 'vendor';
          }
        },
      },
    },
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
