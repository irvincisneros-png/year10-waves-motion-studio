import { expect, test, type Page } from '@playwright/test';

const OUTCOME_WORDING =
  'Demonstrate that a mechanical wave requires a medium to travel through, while an electromagnetic (EM) wave does not';

async function enableReducedMotion(page: Page) {
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByTestId('toggle-reduced-motion').check();
  await page.keyboard.press('Escape');
}

async function stepFrames(page: Page, count: number) {
  const step = page.getByRole('button', { name: 'Step forward one frame' });
  await step.evaluate((element, frames) => {
    for (let index = 0; index < frames; index += 1) {
      (element as HTMLButtonElement).click();
    }
  }, count);
}

async function chooseCorrectPredictions(page: Page) {
  await page.getByRole('group', { name: 'Mechanical + material' }).getByLabel('Receives').check();
  await page.getByRole('group', { name: 'Mechanical + vacuum' }).getByLabel('Blocked').check();
  await page.getByRole('group', { name: 'EM + vacuum' }).getByLabel('Receives').check();
}

test.describe('7.1.1 gold-standard outcome simulator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/simulators/7.1.1');
  });

  test('cold-loads directly with exact identity and an immediate primary manipulation', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('7.1.1');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Medium or vacuum?');
    await expect(page.getByText(OUTCOME_WORDING, { exact: true })).toBeVisible();
    await expect(page).toHaveTitle('7.1.1 Transmission Lab — WaveMotion Studio');
    await expect(page.getByRole('button', { name: 'Launch all pulses' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Show quick tour' })).toBeVisible();
  });

  test('one launch produces the required material, vacuum and EM detector states', async ({ page }) => {
    await enableReducedMotion(page);
    await page.getByRole('button', { name: 'Launch all pulses' }).click();
    await stepFrames(page, 15);

    const table = page.getByRole('table', { name: 'Live detector status for all three transmission bays' });
    await expect(table.getByRole('row', { name: /Mechanical \+ material/ })).toContainText('Pulse travelling');
    await expect(table.getByRole('row', { name: /Mechanical \+ vacuum/ })).toContainText('Blocked — no medium');
    await expect(table.getByRole('row', { name: /EM \+ vacuum/ })).toContainText('Pulse travelling');

    await stepFrames(page, 100);
    await expect(table.getByRole('row', { name: /Mechanical \+ material/ })).toContainText('Signal received');
    await expect(table.getByRole('row', { name: /Mechanical \+ vacuum/ })).toContainText('Blocked — no medium');
    await expect(table.getByRole('row', { name: /EM \+ vacuum/ })).toContainText('Signal received');
  });

  test('amplitude changes pulse size without changing speed or source frequency', async ({ page }) => {
    const speed = page.getByText('Mechanical model speed').locator('..').locator('strong');
    const frequency = page.getByText('Source frequency').locator('..').locator('strong');
    const speedBefore = await speed.textContent();
    const frequencyBefore = await frequency.textContent();
    const amplitude = page.getByRole('slider', { name: 'Pulse amplitude' });
    await amplitude.press('End');
    await expect(amplitude).toHaveValue('100');
    await expect(speed).toHaveText(speedBefore ?? '');
    await expect(frequency).toHaveText(frequencyBefore ?? '');
  });

  test('challenge requires simulated evidence, scores mastery and replays cleanly', async ({ page }) => {
    await chooseCorrectPredictions(page);
    await page.getByRole('button', { name: 'Check predictions' }).click();
    await expect(page.locator('.outcome-711__challenge-status')).toContainText(/Launch the pulses/i);

    await page.getByRole('button', { name: 'Launch all pulses' }).click();
    await page.getByRole('button', { name: 'Check predictions' }).click();
    await expect(page.getByText('Transmission expert unlocked')).toBeVisible();
    await expect(page.getByText(/300\/300 points/)).toBeVisible();

    await page.getByRole('button', { name: 'Replay challenge' }).click();
    await expect(page.getByText('Transmission expert unlocked')).toHaveCount(0);
    await expect(
      page.getByRole('group', { name: 'Mechanical + material' }).getByLabel('Receives'),
    ).not.toBeChecked();
  });

  test('reduced motion does not autoplay and deterministic stepping remains available', async ({ page }) => {
    await enableReducedMotion(page);
    await page.getByRole('button', { name: 'Launch all pulses' }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText('Elapsed').locator('..').locator('strong')).toHaveText('0 s');
    await stepFrames(page, 3);
    await expect(page.getByText('Elapsed').locator('..').locator('strong')).toHaveText('0.1 s');
  });

  test('Canvas denial keeps the complete text-state and challenge path', async ({ page }) => {
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = () => null;
    });
    await page.reload();
    await expect(page.getByTestId('canvas-unsupported-notice')).toBeVisible();
    await page.getByRole('button', { name: 'Launch all pulses' }).click();
    const table = page.getByRole('table', { name: 'Live detector status for all three transmission bays' });
    await expect(table.getByRole('row', { name: /Mechanical \+ vacuum/ })).toContainText('Blocked — no medium');
    await chooseCorrectPredictions(page);
    await page.getByRole('button', { name: 'Check predictions' }).click();
    await expect(page.getByText('Transmission expert unlocked')).toBeVisible();
  });

  test('optional onboarding is keyboard-operable and never required', async ({ page }) => {
    const launch = page.getByRole('button', { name: 'Launch all pulses' });
    await launch.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('table', { name: 'Live detector status for all three transmission bays' })).toContainText('Blocked — no medium');

    await page.getByRole('button', { name: 'Show quick tour' }).click();
    await expect(page.getByText('Quick tour · 1 of 3')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Start experimenting' }).click();
    await expect(page.getByText(/Quick tour/)).toHaveCount(0);
  });

  test('reflows at 200 percent zoom without clipping the simulator', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 400 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('7.1.1');
    await expect(page.getByRole('button', { name: 'Launch all pulses' })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('primary controls retain 44 pixel targets at 320 pixels', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    for (const name of ['Launch all pulses', 'Reset transmission lab', 'Show quick tour']) {
      const box = await page.getByRole('button', { name }).boundingBox();
      expect(box, `${name} has a bounding box`).not.toBeNull();
      expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
    }
  });
});
