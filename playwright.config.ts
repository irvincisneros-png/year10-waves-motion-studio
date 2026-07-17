import { defineConfig, devices } from '@playwright/test';

/**
 * Browser/e2e/a11y/responsive test config.
 * Runs against the Vite preview server (production build) so tests exercise
 * the real bundle, offline shell, and service worker — not just dev mode.
 *
 * Port 4611 (not the vite-preview default 4173): other simulator projects on
 * this machine also use vite, and `reuseExistingServer` must never latch onto
 * a different app's preview server.
 */
const PORT = 4611;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
