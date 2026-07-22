import { expect, test, type Page } from '@playwright/test';

const OUTCOME_WORDING = 'Compare the different wave forms of the electromagnetic spectrum';
const REGION_NAMES = ['Radio', 'Microwave', 'Infrared', 'Visible', 'Ultraviolet', 'X-ray', 'Gamma'] as const;

async function completeDefaultCalibration(page: Page) {
  const tuneCard = page.locator('.outcome-714__check').nth(0);
  const tuneText = await tuneCard.innerText();
  const targetRegion = REGION_NAMES.find((name) => tuneText.includes(`Tune to ${name}`));
  expect(targetRegion, 'deterministic tune target is named').toBeTruthy();
  await page.getByRole('button', { name: targetRegion!, exact: true }).click();
  await page.getByRole('button', { name: 'Calibrate current setting' }).click();

  const compareText = await page.locator('.outcome-714__check').nth(1).innerText();
  const wavelengths = [...compareText.matchAll(/λ ([0-9.e+-]+) m/g)].map((match) => Number(match[1]));
  expect(wavelengths).toHaveLength(2);
  let compareAnswer: 'A' | 'B' | 'equal';
  if (wavelengths[0] === wavelengths[1]) compareAnswer = 'equal';
  else if (compareText.includes('longer wavelength')) compareAnswer = wavelengths[0] > wavelengths[1] ? 'A' : 'B';
  else compareAnswer = wavelengths[0] < wavelengths[1] ? 'A' : 'B';
  await page.getByRole('radio', { name: compareAnswer === 'equal' ? 'A and B are equal' : `Pin ${compareAnswer}` }).check();

  const boundaryText = await page.getByTestId('outcome-714-boundary-target').innerText();
  const boundaryWavelength = Number(boundaryText.match(/λ = ([0-9.e+-]+) m/)?.[1]);
  const boundaryRegions = boundaryWavelength > 1e-3
    ? ['Radio', 'Microwave']
    : ['X-ray', 'Gamma'];
  for (const name of boundaryRegions) {
    await page.getByRole('checkbox', { name, exact: true }).check();
  }
  await page.getByRole('button', { name: 'Check all missions' }).click();
}

test.describe('7.1.4 canonical Spectrum Tuner simulator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/simulators/7.1.4');
  });

  test('cold-loads with exact outcome identity and immediate tuning', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('7.1.4');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Spectrum Tuner');
    await expect(page.getByText(OUTCOME_WORDING, { exact: true })).toBeVisible();
    await expect(page).toHaveTitle('7.1.4 Spectrum Tuner — WaveMotion Studio');
    await expect(page.getByRole('slider', { name: 'Continuous spectrum position' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Calibrate current setting' })).toBeVisible();
  });

  test('continuous tuning links wavelength and frequency while vacuum speed stays fixed', async ({ page }) => {
    const slider = page.getByRole('slider', { name: 'Continuous spectrum position' });
    await slider.press('Home');
    await expect(page.getByTestId('outcome-714-candidates')).toContainText('Radio');
    const longFrequency = await page.getByText('Frequency f').locator('..').locator('strong').innerText();
    await slider.press('End');
    await expect(page.getByTestId('outcome-714-candidates')).toContainText('Gamma');
    const shortFrequency = await page.getByText('Frequency f').locator('..').locator('strong').innerText();
    expect(Number(shortFrequency.replace(' Hz', ''))).toBeGreaterThan(Number(longFrequency.replace(' Hz', '')));
    await expect(page.getByText('Vacuum speed c').locator('..').locator('strong')).toHaveText('299,792,458 m/s');
  });

  test('linked numeric entries validate bounds and preserve overlapping candidates', async ({ page }) => {
    const wavelength = page.getByRole('textbox', { name: 'Enter wavelength in metres' });
    await wavelength.fill('0');
    await page.getByRole('button', { name: 'Apply wavelength' }).click();
    await expect(page.getByRole('status').filter({ hasText: /Enter a wavelength/ })).toBeVisible();

    await wavelength.fill(String(Math.sqrt(0.1)));
    await page.getByRole('button', { name: 'Apply wavelength' }).click();
    const candidates = page.getByTestId('outcome-714-candidates');
    await expect(candidates).toContainText('Radio');
    await expect(candidates).toContainText('Microwave');
  });

  test('pin A and B comparison reports inverse wavelength-frequency order', async ({ page }) => {
    await page.getByRole('button', { name: 'Radio', exact: true }).click();
    await page.getByRole('button', { name: 'Pin current as A' }).click();
    await page.getByRole('button', { name: 'Gamma', exact: true }).click();
    await page.getByRole('button', { name: 'Pin current as B' }).click();
    const comparison = page.getByTestId('outcome-714-pin-comparison');
    await expect(comparison).toContainText('shorter wavelength');
    await expect(comparison).toContainText('higher frequency');
    await expect(comparison).toContainText('higher photon energy');
    await expect(comparison).toContainText('299,792,458 m/s');
  });

  test('three-mission challenge completes from scientific evidence and replays', async ({ page }) => {
    await page.getByRole('button', { name: 'Check all missions' }).click();
    await expect(page.getByText('Spectrum calibration expert unlocked')).toHaveCount(0);

    await completeDefaultCalibration(page);
    await expect(page.getByText('Spectrum calibration expert unlocked')).toBeVisible();
    await expect(page.getByText(/300\/300 points/)).toBeVisible();

    await page.getByRole('button', { name: 'New calibration' }).click();
    await expect(page.getByText('Spectrum calibration expert unlocked')).toHaveCount(0);
    await expect(page.getByRole('radio', { name: /Pin A|Pin B|equal/ }).first()).not.toBeChecked();
  });

  test('Canvas denial preserves linked values, pins and calibration', async ({ page }) => {
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = () => null;
    });
    await page.reload();
    await expect(page.getByTestId('canvas-unsupported-notice')).toBeVisible();
    await completeDefaultCalibration(page);
    await expect(page.getByText('Spectrum calibration expert unlocked')).toBeVisible();
    await expect(page.getByRole('table', { name: 'Live linked electromagnetic wave state' })).toBeVisible();
  });

  test('optional tour and tuner controls are keyboard operable', async ({ page }) => {
    const slider = page.getByRole('slider', { name: 'Continuous spectrum position' });
    await slider.focus();
    await slider.press('End');
    await expect(page.getByTestId('outcome-714-candidates')).toContainText('Gamma');

    await page.getByRole('button', { name: 'Show quick tour' }).click();
    await expect(page.getByText('Quick tour · 1 of 3')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Start tuning' }).click();
    await expect(page.getByText(/Quick tour/)).toHaveCount(0);
  });

  test('reflows at 200 percent zoom without clipping the simulator', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 400 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('7.1.4');
    await expect(page.getByRole('button', { name: 'Calibrate current setting' })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('primary controls retain 44 pixel targets at 320 pixels', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    for (const name of [
      'Calibrate current setting',
      'Pin current as A',
      'Pin current as B',
      'Check all missions',
    ]) {
      const box = await page.getByRole('button', { name }).boundingBox();
      expect(box, `${name} has a bounding box`).not.toBeNull();
      expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
    }
  });
});
