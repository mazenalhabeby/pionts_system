import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/admin/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@pionts/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-recharts': ['recharts'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/admin/api': 'http://localhost:3000',
      '/admin/login': 'http://localhost:3000',
      '/admin/logout': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
      '/api/v1': 'http://localhost:3000',
    },
  },
});
