import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Loyalty',
      formats: ['iife'],
      fileName: () => 'loyalty.js',
    },
    outDir: 'dist',
    minify: 'esbuild',
  },
});
