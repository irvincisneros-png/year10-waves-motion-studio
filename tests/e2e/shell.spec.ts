import { test, expect } from '@playwright/test';
import { SHELL_ROUTES } from './helpers';

test.describe('shell routes', () => {
  for (const route of SHELL_ROUTES) {
    test(`cold deep link to ${route.path} renders and survives refresh`, async ({
      page,
    }) => {
      // Cold load (direct URL)
      await page.goto(route.url);
      await expect(
        page.getByRole('heading', { level: 1, name: route.heading }),
      ).toBeVisible();
      await expect(page).toHaveTitle(route.title);

      // Refresh keeps the same route
      await page.reload();
      await expect(
        page.getByRole('heading', { level: 1, name: route.heading }),
      ).toBeVisible();
      await expect(page).toHaveTitle(route.title);
    });
  }

  test('minimal primary navigation and secondary utilities reach their destinations', async ({
    page,
  }) => {
    await page.goto('/#/simulators/7.1.1');
    const primary = page.getByRole('navigation', { name: 'Primary' });
    await expect(primary.getByRole('link')).toHaveCount(1);
    await primary.getByRole('link', { name: 'All simulators' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Choose a science simulator' }),
    ).toBeFocused();

    const utilities = page.getByRole('navigation', { name: 'Utilities' });
    for (const route of SHELL_ROUTES.filter((r) => r.path !== '/')) {
      await utilities.getByRole('link', { name: route.heading }).click();
      const heading = page.getByRole('heading', { level: 1, name: route.heading });
      await expect(heading).toBeVisible();
      await expect(page).toHaveTitle(route.title);
      await expect(heading).toBeFocused();
    }
  });

  test('unknown URL shows the not-found page with working navigation back', async ({
    page,
  }) => {
    await page.goto('/#/definitely-not-a-real-route');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeVisible();
    await expect(page).toHaveTitle('Page not found — WaveMotion Studio');

    await page.getByRole('link', { name: 'All outcome simulators' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Choose a science simulator' }),
    ).toBeVisible();
  });

  test('home gallery exposes one launcher per active outcome', async ({
    page,
  }) => {
    await page.goto('/#/');
    await expect(page.locator('article.outcome-card')).toHaveCount(24);
    await expect(page.locator('article.outcome-card a')).toHaveCount(24);
    await expect(page.getByText('7.2.5', { exact: true })).toHaveCount(0);
    const prototype = page.locator('article.outcome-card', { hasText: '7.1.1' });
    await expect(prototype.getByText('New simulator')).toBeVisible();
    await expect(prototype.getByRole('link', { name: /Launch simulator for outcome 7\.1\.1/ })).toHaveAttribute('href', '#/simulators/7.1.1');
  });

  test('offline: shell and visited routes still work after first load', async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'Network-condition simulation is only supported in Chromium',
    );
    await page.goto('/#/');
    // Wait for the service worker to activate (precache completes on install).
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    // Reload so the page is controlled by the service worker, then kill the
    // network and verify the shell still renders.
    await page.reload();
    await context.setOffline(true);
    try {
      await page.reload();
      await expect(
        page.getByRole('heading', { level: 1, name: 'Choose a science simulator' }),
      ).toBeVisible();
      // Secondary utility navigation remains available while offline.
      await page
        .getByRole('navigation', { name: 'Utilities' })
        .getByRole('link', { name: 'Glossary' })
        .click();
      await expect(
        page.getByRole('heading', { level: 1, name: 'Glossary' }),
      ).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });
});
