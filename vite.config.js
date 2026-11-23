import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { imagetools } from 'vite-imagetools';

// Relative base so the build works on GitHub Pages project URLs
// (https://<user>.github.io/<repo>/) and on a custom domain alike.
// The build-time (SSR) render needs absolute asset paths, e.g. /max/assets/…, because its
// HTML is served from the site root path; the browser bundle stays relative.
export default defineConfig(({ isSsrBuild, mode }) => ({
  base: isSsrBuild ? new URL(loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL || 'http://x/').pathname : './',
  plugins: [react(), imagetools()],
  build: {
    rollupOptions: {
      // PREVIEW_BUILD=1: public site only (used for review previews before deploying).
      input: isSsrBuild ? undefined : process.env.PREVIEW_BUILD ? { main: 'index.html' } : { main: 'index.html', admin: 'admin/index.html' },
    },
  },
}));
