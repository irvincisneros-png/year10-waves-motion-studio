import { expect, test, type Page } from '@playwright/test';

const OUTCOME_WORDING =
  'Use the wave model to explain how energy is transferred without the net transfer of particles';

async function enableReducedMotion(page: Page) {
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByTestId('toggle-reduced-motion').check();
  await page.keyboard.press('Escape');
  await page.getByRole('radio', { name: 'Normal speed' }).check();
}

async function stepFrames(page: Page, count: number) {
  const step = page.getByRole('button', { name: 'Step forward one frame' });
  await step.evaluate((element, frames) => {
    for (let index = 0; index < frames; index += 1) {
      (element as HTMLButtonElement).click();
    }
  }, count);
}

async function completeDefaultRelay(page: Page) {
  await enableReducedMotion(page);
  await page.getByRole('button', { name: 'Launch energy pulse' }).click();
  await stepFrames(page, 48);
  await page.getByRole('button', { name: 'Capture peak snapshot' }).click();
  await stepFrames(page, 100);
  await page.getByRole('button', { name: 'Capture return home' }).click();
  await page.getByRole('button', { name: 'Check particle passport' }).click();
}

test.describe('7.1.2 canonical Energy Relay simulator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/simulators/7.1.2');
  });

  test('cold-loads with exact outcome identity and immediate manipulation', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('7.1.2');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Energy Relay');
    await expect(page.getByText(OUTCOME_WORDING, { exact: true })).toBeVisible();
    await expect(page).toHaveTitle('7.1.2 Energy Relay — WaveMotion Studio');
    await expect(page.getByRole('button', { name: 'Launch energy pulse' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Show quick tour' })).toBeVisible();
  });

  test('one pulse transfers energy to the receiver while every particle returns home', async ({ page }) => {
    await enableReducedMotion(page);
    await page.getByRole('button', { name: 'Launch energy pulse' }).click();
    await stepFrames(page, 148);

    const table = page.getByRole('table', { name: 'Live Energy Relay particle and receiver state' });
    await expect(page.getByTestId('outcome-712-receiver')).toHaveText('Energy received');
    for (const particle of ['B', 'D', 'F', 'H']) {
      await expect(table.getByTestId(`outcome-712-particle-${particle}`)).toContainText('returned home');
    }
  });

  test('amplitude and width controls reset the run without changing the fixed speed model', async ({ page }) => {
    await page.getByRole('slider', { name: 'Pulse amplitude' }).press('End');
    await page.getByRole('slider', { name: 'Pulse width' }).press('Home');
    await expect(page.getByRole('slider', { name: 'Pulse amplitude' })).toHaveValue('1');
    await expect(page.getByRole('slider', { name: 'Pulse width' })).toHaveValue('0.35');
    await expect(page.getByText(/fixed 2\.5 m\/s display speed/i)).toBeVisible();
    await expect(page.getByTestId('outcome-712-receiver')).toHaveText('Ready');
  });

  test('challenge is evidence-gated, completes from valid model states and replays a new passport', async ({ page }) => {
    await page.getByRole('button', { name: 'Check particle passport' }).click();
    await expect(page.locator('.outcome-712__challenge-status')).toContainText(/Launch the pulse/i);

    await completeDefaultRelay(page);
    await expect(page.getByText('Energy Relay expert unlocked')).toBeVisible();
    await expect(page.getByText(/100\/100 points/)).toBeVisible();

    await page.getByRole('button', { name: 'New relay challenge' }).click();
    await expect(page.getByText('Energy Relay expert unlocked')).toHaveCount(0);
    await expect(page.getByRole('radio', { name: 'B', exact: true })).toBeChecked();
    await expect(page.getByTestId('outcome-712-receiver')).toHaveText('Ready');
  });

  test('reduced motion never autoplays and deterministic stepping remains available', async ({ page }) => {
    await enableReducedMotion(page);
    await page.getByRole('button', { name: 'Launch energy pulse' }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText('Elapsed').locator('..').locator('strong')).toHaveText('0 s');
    await stepFrames(page, 3);
    await expect(page.getByText('Elapsed').locator('..').locator('strong')).toHaveText('0.1 s');
  });

  test('Canvas denial preserves the complete table and challenge path', async ({ page }) => {
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = () => null;
    });
    await page.reload();
    await expect(page.getByTestId('canvas-unsupported-notice')).toBeVisible();
    await completeDefaultRelay(page);
    await expect(page.getByText('Energy Relay expert unlocked')).toBeVisible();
    await expect(page.getByTestId('outcome-712-receiver')).toHaveText('Energy received');
  });

  test('optional tour and primary launch are keyboard operable', async ({ page }) => {
    const launch = page.getByRole('button', { name: 'Launch energy pulse' });
    await launch.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('outcome-712-receiver')).toHaveText('Waiting for energy');

    await page.getByRole('button', { name: 'Show quick tour' }).click();
    await expect(page.getByText('Quick tour · 1 of 3')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Start experimenting' }).click();
    await expect(page.getByText(/Quick tour/)).toHaveCount(0);
  });

  test('reflows at 200 percent zoom without clipping the simulator', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 400 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('7.1.2');
    await expect(page.getByRole('button', { name: 'Launch energy pulse' })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('primary controls retain 44 pixel targets at 320 pixels', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    for (const name of [
      'Launch energy pulse',
      'Capture peak snapshot',
      'Capture return home',
      'Check particle passport',
    ]) {
      const box = await page.getByRole('button', { name }).boundingBox();
      expect(box, `${name} has a bounding box`).not.toBeNull();
      expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
    }
  });
});
