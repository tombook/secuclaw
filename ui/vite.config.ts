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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lit') || id.includes('@lit') || id.includes('lit-html')) return 'lit';
            if (id.includes('@vaadin')) return 'router';
            return 'vendor';
          }
          if (id.includes('/pages/tools/')) return 'pages-tools';
          if (id.includes('/pages/settings/')) return 'pages-settings';
          if (id.includes('/pages/sc-secops-center')) return 'pages-secops';
          if (id.includes('/pages/sc-datacenter')) return 'pages-data';
          if (id.includes('/pages/sc-channels')) return 'pages-channels';
          if (id.includes('/pages/sc-ai-experts')) return 'pages-ai';
          if (id.includes('/pages/sc-war-room')) return 'pages-warroom';
          if (id.includes('/pages/sc-dashboard')) return 'pages-core';
          if (id.includes('/pages/sc-incidents')) return 'pages-incidents';
          if (id.includes('/pages/sc-vulnerabilities')) return 'pages-vulns';
          if (id.includes('/pages/sc-threats')) return 'pages-threats';
          if (id.includes('/pages/sc-compliance')) return 'pages-compliance';
          if (id.includes('/pages/sc-reports')) return 'pages-reports';
          if (id.includes('/pages/sc-risk')) return 'pages-risk';
          if (id.includes('/pages/sc-knowledge')) return 'pages-knowledge';
          if (id.includes('/pages/sc-skills')) return 'pages-knowledge';
          if (id.includes('/pages/sc-login')) return 'pages-auth';
          if (id.includes('/pages/capabilities/')) return 'pages-caps';
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
