import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The demo uses the built package (through "file:.." in package.json), so it runs exactly what's
// published, including the inline worker. Run `npm run build` in the repository root first.
export default defineConfig({
  // Relative asset paths, so the build works under the /api-poller-worker/ subpath on GitHub Pages.
  base: './',
  plugins: [react()],
});
