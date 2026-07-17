import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      // 'prompt': a new deploy shows a visible refresh banner (UpdatePrompt)
      // instead of silently swapping versions mid-lesson.
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webp,avif,woff2}'],
        // Hash-router SPA: every navigation request serves the shell.
        navigateFallback: 'index.html',
      },
      manifest: {
        name: 'WaveMotion Studio',
        short_name: 'WaveMotion',
        description:
          'Interactive laboratories for the NSW Year 10 Waves and Motion topic.',
        lang: 'en-AU',
        theme_color: '#141b2e',
        background_color: '#f7f4ee',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    // Keep Vitest away from the Playwright specs in tests/e2e, and from the
    // macOS AppleDouble (._*) sidecar files the external SSD accumulates.
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/._*'],
  },
});
