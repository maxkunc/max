import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { imagetools } from 'vite-imagetools';

// Relative base so the build works on GitHub Pages project URLs
// (https://<user>.github.io/<repo>/) and on a custom domain alike.
export default defineConfig({
  base: './',
  plugins: [react(), imagetools()],
  build: {
    rollupOptions: {
      input: { main: 'index.html', admin: 'admin/index.html' },
    },
  },
});
