import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@pionts/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  build: {
    lib: {
      entry: 'src/main-sdk.tsx',
      name: 'PiontsWidget',
      formats: ['umd'],
      fileName: () => 'pionts-widget.umd.js',
    },
    outDir: 'dist-umd',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        assetFileNames: 'pionts-widget.[ext]',
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
