import { expect, test } from '@playwright/test';

test.describe('Wave Rider bonus challenge', () => {
  test('scores all three science checkpoints and supports deterministic replay', async ({ page }) => {
    await page.goto('/#/bonus/wave-rider');
    await expect(page.getByRole('heading', { level: 1, name: 'Wave Rider' })).toBeVisible();
    await expect(page.getByText('0/3')).toBeVisible();

    await page.getByRole('radio', { name: 'Oscillate near a fixed home position' }).check();
    await page.getByRole('button', { name: 'Ride checkpoint' }).click();
    await expect(page.getByText('1/3')).toBeVisible();

    const amplitude = page.getByRole('slider', { name: 'Wave Rider amplitude' });
    await amplitude.evaluate((element) => {
      const input = element as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(input, '1.5');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(amplitude).toHaveValue('1.5');
    await page.getByRole('button', { name: 'Ride checkpoint' }).click();
    await expect(page.getByText('2/3')).toBeVisible();

    await page.getByRole('slider', { name: 'Wave Rider wavelength' }).evaluate((element) => {
      const input = element as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(input, '5');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.getByRole('button', { name: 'Ride checkpoint' }).click();
    await expect(page.getByRole('heading', { level: 3, name: 'Wave Rider patch earned' })).toBeVisible();
    await expect(page.getByText('3/3')).toBeVisible();

    await page.getByRole('button', { name: 'Ride again' }).click();
    await expect(page.getByText('0/3')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Oscillate near a fixed home position' })).not.toBeChecked();
  });

  test('rejects the matter-transport misconception with corrective feedback', async ({ page }) => {
    await page.goto('/#/bonus/wave-rider');
    await page.getByRole('radio', { name: 'Travel across the course with Pulse' }).check();
    await page.getByRole('button', { name: 'Ride checkpoint' }).click();
    await expect(page.locator('.wave-rider__message')).toContainText('particles travelled away');
    await expect(page.getByText('0/3')).toBeVisible();
  });

  test('remains playable and overflow-free at 320 pixels', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/#/bonus/wave-rider');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    const rideBox = await page.getByRole('button', { name: 'Ride checkpoint' }).boundingBox();
    expect(rideBox?.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByText('The surfing is a metaphor. The physics is real.')).toBeVisible();
  });
});
