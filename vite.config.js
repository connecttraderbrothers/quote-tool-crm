import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In dev, proxy API calls to the local PocketBase so the browser sees a
    // same-origin URL and we avoid CORS entirely. In production the frontend
    // is served from Cloudflare Pages and talks to PocketBase over its own
    // domain, configured via VITE_PB_URL.
    proxy: {
      '/api': { target: 'http://127.0.0.1:8090', changeOrigin: true },
      '/_': { target: 'http://127.0.0.1:8090', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
