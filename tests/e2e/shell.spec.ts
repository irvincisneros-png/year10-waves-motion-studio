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

  test('client-side navigation reaches every route, updates the title, and moves focus to the heading', async ({
    page,
  }) => {
    await page.goto('/#/');
    const nav = page.getByRole('navigation', { name: 'Primary' });

    for (const route of SHELL_ROUTES.filter((r) => r.path !== '/')) {
      await nav.getByRole('link', { name: route.navLabel }).click();
      const heading = page.getByRole('heading', { level: 1, name: route.heading });
      await expect(heading).toBeVisible();
      await expect(page).toHaveTitle(route.title);
      // Focus management gate: focus moves to the main heading on route change
      await expect(heading).toBeFocused();
    }

    // And back home
    await nav.getByRole('link', { name: 'Home' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'WaveMotion Studio' }),
    ).toBeFocused();
  });

  test('unknown URL shows the not-found page with working navigation back', async ({
    page,
  }) => {
    await page.goto('/#/definitely-not-a-real-route');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeVisible();
    await expect(page).toHaveTitle('Page not found — WaveMotion Studio');

    await page.getByRole('link', { name: 'Home — the learning map' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'WaveMotion Studio' }),
    ).toBeVisible();
  });

  test('home learning map: available workspaces link, the rest are non-interactive "In development"', async ({
    page,
  }) => {
    await page.goto('/#/');
    // Stage 3: wave foundations + sound are unlocked; the other 9 remain
    // non-interactive "In development" panels (never dead links/buttons).
    await expect(page.getByText('In development')).toHaveCount(9);
    await expect(page.getByText('Available')).toHaveCount(2);
    const cardControls = page.locator(
      'article.workspace-card a, article.workspace-card button',
    );
    await expect(cardControls).toHaveCount(2);
    await expect(cardControls).toHaveText(['Wave foundations', 'Sound laboratory']);
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
        page.getByRole('heading', { level: 1, name: 'WaveMotion Studio' }),
      ).toBeVisible();
      // Client-side navigation to another shell route while offline
      await page
        .getByRole('navigation', { name: 'Primary' })
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
