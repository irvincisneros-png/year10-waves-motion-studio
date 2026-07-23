import { expect, test } from '@playwright/test';

test.describe('Wave Rider mastery run', () => {
  test('starts a steerable arcade run with lives, score and boost controls', async ({ page }) => {
    await page.goto('/#/bonus/wave-rider');
    await expect(page.getByRole('heading', { level: 1, name: 'Wave Rider' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: "Let's ride waves" })).toBeVisible();
    await page.getByRole('radio', { name: /Orbit/ }).check();
    await page.getByLabel('Board colour').selectOption({ label: 'Violet pulse' });
    await page.getByLabel('Trail style').selectOption({ label: 'Spectrum' });
    await page.getByLabel('Call sign').fill('Vector');
    await page.getByRole('button', { name: 'Start Stage 1' }).click();

    await expect(page.getByLabel('3 hearts remaining')).toBeVisible();
    await expect(page.getByText('Stage 1 of 5')).toBeVisible();
    await expect(page.locator('.wave-rider__question')).toContainText('A pulse crosses a rope');
    const course = page.getByLabel(/Wave Rider course/);
    await expect(course).toHaveAttribute('data-player-lane', '1');

    await page.getByRole('button', { name: 'Steer left' }).click();
    await expect(course).toHaveAttribute('data-player-lane', '0');
    await page.getByRole('button', { name: 'Steer right' }).click();
    await expect(course).toHaveAttribute('data-player-lane', '1');

    await expect(page.getByRole('button', { name: 'Use speed boost. 1 remaining' })).toBeVisible();
  });

  test('awards a power-up only after a correct syllabus answer', async ({ page }) => {
    await page.goto('/#/bonus/wave-rider');
    await page.getByRole('button', { name: 'Start Stage 1' }).click();
    await expect(page.getByRole('heading', { level: 3, name: 'Power-up challenge' })).toBeVisible({ timeout: 6_000 });
    await expect(page.getByText('win a speed boost')).toBeVisible();
    await page.getByRole('button', { name: 'Energy', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Use speed boost. 2 remaining' })).toBeVisible();
    await expect(page.locator('.wave-rider__message')).toContainText('speed boost awarded');
  });

  test('supports keyboard steering, pause and accessible speed options', async ({ page }) => {
    await page.goto('/#/bonus/wave-rider');
    await page.getByRole('button', { name: 'Start Stage 1' }).click();
    const course = page.getByLabel(/Wave Rider course/);
    await course.press('ArrowRight');
    await expect(course).toHaveAttribute('data-player-lane', '2');
    await course.press('Space');
    await expect(page.getByRole('heading', { level: 3, name: 'Run paused' })).toBeVisible();
    await page.getByRole('button', { name: 'Resume run' }).click();
    await expect(page.getByLabel('Calm speed')).toBeVisible();
    await page.getByLabel('High visibility').check();
    await expect(course).toHaveAttribute('data-high-visibility', 'true');
  });

  test('explains the syllabus mapping and remains overflow-free at 320 pixels', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/#/bonus/wave-rider');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    const startBox = await page.getByRole('button', { name: 'Start Stage 1' }).boundingBox();
    expect(startBox?.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByText('Every stage raises both the game and science challenge.')).toBeVisible();
    await expect(page.getByText(/numerical and proportional reasoning with λ = v\/f/)).toBeVisible();
  });
});
