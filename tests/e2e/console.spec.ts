import { test, expect } from '@playwright/test';
import { SHELL_ROUTES, SOUND_ROUTES, WAVES_ROUTES } from './helpers';

/**
 * Stage 1+2 gate: zero console errors/warnings and zero unhandled rejections
 * on every route (including the not-found page and the wave laboratory).
 */
const ROUTES = [
  ...SHELL_ROUTES.map((r) => r.url),
  ...WAVES_ROUTES.map((r) => r.url),
  ...SOUND_ROUTES.map((r) => r.url),
  '/#/not-a-real-route',
];

test.describe('console hygiene', () => {
  for (const url of ROUTES) {
    test(`no console errors, warnings or unhandled rejections on ${url}`, async ({
      page,
    }) => {
      const problems: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          problems.push(`console.${msg.type()}: ${msg.text()}`);
        }
      });
      page.on('pageerror', (err) => {
        problems.push(`pageerror: ${err.message}`);
      });

      await page.goto(url);
      await page.waitForLoadState('load');
      // Give the service-worker registration and any lazy effects a moment.
      await page.waitForTimeout(500);

      expect(problems, problems.join('\n')).toEqual([]);
    });
  }

  test('no unexpected network requests to external hosts', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (req) => {
      const url = new URL(req.url());
      if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
        external.push(req.url());
      }
    });
    for (const url of ROUTES) {
      await page.goto(url);
      await page.waitForLoadState('load');
    }
    expect(external, external.join('\n')).toEqual([]);
  });
});
