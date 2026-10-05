import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { PROJECT_NAME, PROJECT_DESCRIPTION } from './src/config/brand.js';

// Fills %PROJECT_NAME% / %PROJECT_DESCRIPTION% in index.html from src/config/brand.js.
const brandHtml = () => ({
  name: 'brand-html',
  transformIndexHtml: (html) => html.replaceAll('%PROJECT_NAME%', PROJECT_NAME).replaceAll('%PROJECT_DESCRIPTION%', PROJECT_DESCRIPTION),
});

// npm run build        -> static site in dist/ (hash routing, works on any static host)
// npm run build:single -> one self-contained dist-single/index.html for sharing
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), brandHtml(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  base: './',
  build: mode === 'single' ? { outDir: 'dist-single', chunkSizeWarningLimit: 6000 } : { chunkSizeWarningLimit: 1500 },
}));
