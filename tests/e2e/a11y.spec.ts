import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { SHELL_ROUTES, tabKey } from './helpers';

test.describe('accessibility audit', () => {
  for (const route of SHELL_ROUTES) {
    test(`axe reports zero violations on ${route.path}`, async ({ page }) => {
      await page.goto(route.url);
      await expect(
        page.getByRole('heading', { level: 1, name: route.heading }),
      ).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations,
        results.violations
          .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
          .join('\n'),
      ).toEqual([]);
    });
  }

  test('axe reports zero violations on the not-found page and with the settings panel open', async ({
    page,
  }) => {
    await page.goto('/#/nope');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    await page.goto('/#/');
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.getByText('Display & sound')).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });

  test('skip link is the first tab stop and jumps focus to main content', async ({
    page,
    browserName,
  }) => {
    await page.goto('/#/');
    await page.keyboard.press(tabKey(browserName));
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible(); // becomes visible on focus
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('keyboard focus is visible on shell controls', async ({
    page,
    browserName,
  }) => {
    await page.goto('/#/');
    // Walk focus to the Settings button (a control on the dark header).
    const settings = page.getByRole('button', { name: 'Settings', exact: true });
    const key = tabKey(browserName);
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press(key);
      if (await settings.evaluate((el) => el === document.activeElement)) break;
    }
    await expect(settings).toBeFocused();
    const outline = await settings.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: s.outlineWidth };
    });
    expect(outline.style).not.toBe('none');
    expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
  });

  test('200% zoom loses no shell content', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#/');
    // Emulate 200% zoom: content must fit a halved layout viewport (640 px)
    // without horizontal page scrolling.
    await page.setViewportSize({ width: 640, height: 400 });
    await expect(
      page.getByRole('heading', { level: 1, name: 'WaveMotion Studio' }),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
