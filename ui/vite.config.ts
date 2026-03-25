import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/ui/components'),
      '@pages': resolve(__dirname, 'src/ui/pages'),
      '@store': resolve(__dirname, 'src/ui/store'),
      '@i18n': resolve(__dirname, 'src/i18n'),
    },
  },

  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:21982',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:21981',
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
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          lit: ['lit', '@lit/reactive-element', 'lit-html'],
          router: ['@vaadin/router'],
        },
      },
    },
  },

  optimizeDeps: {
    include: ['lit', '@lit/reactive-element', '@vaadin/router'],
  },

  define: {
    // Disable Lit dev mode warnings in development
    'window.litDisableDevModeWarning': true,
  },
  plugins: [
    {
      name: 'lit-hmr',
      handleHotUpdate({ file, server }) {
        if (file.endsWith('.ts') || file.endsWith('.js')) {
          server.ws.send({
            type: 'full-reload',
            path: '*',
          });
        }
      },
    },
  ],
});
