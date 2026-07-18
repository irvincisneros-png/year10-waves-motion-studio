import { test, expect } from '@playwright/test';
import { SHELL_ROUTES, WAVES_ROUTES } from './helpers';

const WIDTHS = [320, 375, 768, 1024, 1440];

test.describe('responsive layout', () => {
  for (const width of WIDTHS) {
    test(`no horizontal overflow and nav reachable at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });

      for (const route of [...SHELL_ROUTES, ...WAVES_ROUTES]) {
        await page.goto(route.url);
        await expect(
          page.getByRole('heading', { level: 1, name: route.heading }),
        ).toBeVisible();

        // The document itself must not scroll horizontally…
        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        expect(overflow, `${route.path} overflows at ${width}px`).toBeLessThanOrEqual(0);

        // …and that must not be achieved by masking with overflow-x: hidden.
        const masked = await page.evaluate(() => {
          const html = getComputedStyle(document.documentElement).overflowX;
          const body = getComputedStyle(document.body).overflowX;
          return { html, body };
        });
        expect(masked.html).not.toBe('hidden');
        expect(masked.body).not.toBe('hidden');

        // Primary nav stays available at every width (no collapsed dead end).
        const nav = page.getByRole('navigation', { name: 'Primary' });
        await expect(nav.getByRole('link', { name: route.navLabel })).toBeVisible();
      }
    });
  }

  test('interactive targets meet the 44px minimum at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/#/progress');
    for (const name of ['Export progress (JSON)', 'Reset all progress']) {
      const box = await page.getByRole('button', { name }).boundingBox();
      expect(box, `${name} has a bounding box`).not.toBeNull();
      expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
    }
    const settingsBox = await page
      .getByRole('button', { name: 'Settings' })
      .boundingBox();
    expect(settingsBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('wave-lab interactive targets meet the 44px minimum at 320px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/#/waves/measure');
    for (const name of [
      'Add measurement to trial table',
      'Calculate / check with v = fλ',
      'Timer',
      'Reset wave measurement lab',
    ]) {
      const box = await page.getByRole('button', { name }).first().boundingBox();
      expect(box, `${name} has a bounding box`).not.toBeNull();
      expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
    }
    const ruler = await page.getByRole('slider', { name: 'Ruler tool' }).boundingBox();
    expect(ruler!.height).toBeGreaterThanOrEqual(44);
  });
});
