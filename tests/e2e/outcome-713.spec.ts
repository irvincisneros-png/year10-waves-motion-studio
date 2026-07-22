import { expect, test, type Page } from '@playwright/test';

const OUTCOME_WORDING =
  'Use models to compare and describe the features of transverse and longitudinal waves';

async function enableReducedMotion(page: Page) {
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByTestId('toggle-reduced-motion').check();
  await page.keyboard.press('Escape');
  await page.getByRole('radio', { name: 'Normal speed' }).check();
}

async function completeDefaultComparison(page: Page) {
  await enableReducedMotion(page);
  await page.getByRole('button', { name: 'Launch linked wave' }).click();
  const probe = page.getByRole('slider', { name: 'Gold feature probe' });
  await probe.fill('0.5');
  await page.getByRole('button', { name: 'Lock crest' }).click();
  await probe.fill('1');
  await page.getByRole('button', { name: 'Lock compression' }).click();
  await page.getByRole('radio', { name: 'Transverse is perpendicular; longitudinal is parallel' }).check();
  await page.getByRole('radio', { name: /A quantity such as displacement or pressure/ }).check();
  await page.getByRole('button', { name: 'Check comparison' }).click();
}

test.describe('7.1.3 canonical Twin Wave Observatory simulator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/simulators/7.1.3');
  });

  test('cold-loads with exact outcome identity and immediate manipulation', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('7.1.3');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Twin Wave Observatory');
    await expect(page.getByText(OUTCOME_WORDING, { exact: true })).toBeVisible();
    await expect(page).toHaveTitle('7.1.3 Twin Wave Observatory — WaveMotion Studio');
    await expect(page.getByRole('button', { name: 'Launch linked wave' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Show quick tour' })).toBeVisible();
  });

  test('one state exposes the defining features and particle directions in both models', async ({ page }) => {
    const table = page.getByRole('table', { name: 'Live comparison of one shared wave state' });
    await expect(table).toContainText('Crests and troughs');
    await expect(table).toContainText('Compressions and rarefactions');
    await expect(table).toContainText('Perpendicular to propagation');
    await expect(table).toContainText('Parallel to propagation');
    await expect(page.locator('.outcome-713__comparison-card').filter({ hasText: /Transverse/ })).toContainText('90°');
    await expect(page.locator('.outcome-713__comparison-card').filter({ hasText: /Longitudinal/ })).toContainText('0°');
  });

  test('shared controls change both-state quantities without changing the medium speed', async ({ page }) => {
    await page.getByRole('slider', { name: 'Shared amplitude' }).press('End');
    await page.getByRole('slider', { name: 'Shared frequency' }).press('End');
    await expect(page.getByRole('slider', { name: 'Shared amplitude' })).toHaveValue('0.8');
    await expect(page.getByRole('slider', { name: 'Shared frequency' })).toHaveValue('2.5');
    await expect(page.getByText('1.2 m', { exact: true })).toBeVisible();
    await expect(page.getByText('3 m/s', { exact: true }).first()).toBeVisible();
  });

  test('challenge is launch-gated, engine-scored and replayable', async ({ page }) => {
    await page.getByRole('button', { name: 'Lock crest' }).click();
    await expect(page.getByText('Launch the linked wave before locking a live feature.')).toBeVisible();

    await completeDefaultComparison(page);
    await expect(page.getByText('Wave comparison expert unlocked')).toBeVisible();
    await expect(page.getByText(/100\/100 points/)).toBeVisible();

    await page.getByRole('button', { name: 'New feature challenge' }).click();
    await expect(page.getByText('Wave comparison expert unlocked')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Lock trough' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lock compression' })).toBeVisible();
  });

  test('the particle-path misconception is never accepted', async ({ page }) => {
    await page.getByRole('radio', { name: 'The physical path travelled by each particle' }).check();
    await page.getByRole('button', { name: 'Check comparison' }).click();
    await expect(page.getByText(/0\/100 points/)).toBeVisible();
    await expect(page.getByText('Wave comparison expert unlocked')).toHaveCount(0);
  });

  test('reduced motion never autoplays and deterministic stepping remains available', async ({ page }) => {
    await enableReducedMotion(page);
    await page.getByRole('button', { name: 'Launch linked wave' }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText('Elapsed').locator('..').locator('strong')).toHaveText('0 s');
    await page.getByRole('button', { name: 'Step forward one frame' }).click();
    await expect(page.getByText('Elapsed').locator('..').locator('strong')).not.toHaveText('0 s');
  });

  test('Canvas denial preserves the full feature-lock challenge', async ({ page }) => {
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = () => null;
    });
    await page.reload();
    await expect(page.getByTestId('canvas-unsupported-notice')).toBeVisible();
    await completeDefaultComparison(page);
    await expect(page.getByText('Wave comparison expert unlocked')).toBeVisible();
    await expect(page.getByRole('table', { name: 'Live comparison of one shared wave state' })).toBeVisible();
  });

  test('optional tour and primary launch are keyboard operable', async ({ page }) => {
    const launch = page.getByRole('button', { name: 'Launch linked wave' });
    await launch.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Restart linked wave' })).toBeVisible();

    await page.getByRole('button', { name: 'Show quick tour' }).click();
    await expect(page.getByText('Quick tour · 1 of 3')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Start comparing' }).click();
    await expect(page.getByText(/Quick tour/)).toHaveCount(0);
  });

  test('reflows at 200 percent zoom without clipping the simulator', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 400 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('7.1.3');
    await expect(page.getByRole('button', { name: 'Launch linked wave' })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('primary controls retain 44 pixel targets at 320 pixels', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    for (const name of ['Launch linked wave', 'Lock crest', 'Lock compression', 'Check comparison']) {
      const box = await page.getByRole('button', { name }).boundingBox();
      expect(box, `${name} has a bounding box`).not.toBeNull();
      expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
    }
  });
});
