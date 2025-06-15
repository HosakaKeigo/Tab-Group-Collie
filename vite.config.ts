import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: 'popup.html',
        options: 'options.html',
        search: 'search.html',
      },
      output: {
        entryFileNames: 'src/[name].js',
        chunkFileNames: 'assets/js/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
