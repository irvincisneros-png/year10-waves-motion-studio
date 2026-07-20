import { expect, test } from '@playwright/test';

test.describe('eye response and vision evidence (7.3.1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/vision');
  });

  test('brightness response is monotonic, relative and keyboard operable', async ({ page }) => {
    await expect(page.getByTestId('vision-pupil')).toHaveText('55% — teaching model, not millimetres');
    await page.getByTestId('vision-brightness').press('Home');
    await expect(page.getByTestId('vision-pupil')).toHaveText('100% — teaching model, not millimetres');
    await page.getByTestId('vision-brightness').press('End');
    await expect(page.getByTestId('vision-pupil')).toHaveText('25% — teaching model, not millimetres');
    await expect(page.getByTestId('vision-brightness')).toHaveAttribute('aria-valuetext', 'Brightness: 100%');
  });

  test('distance, accommodation and focusing-problem controls change stated optical outputs', async ({ page }) => {
    await expect(page.getByTestId('vision-focus')).toContainText('in focus');
    const nearSize = await page.getByTestId('vision-image-size').textContent();
    await page.getByTestId('vision-distance').press('End');
    await expect(page.getByTestId('vision-distance')).toHaveAttribute('aria-valuetext', 'Distance: 10.00 m');
    expect(await page.getByTestId('vision-image-size').textContent()).not.toBe(nearSize);
    await page.getByTestId('vision-accommodation').press('End');
    await expect(page.getByTestId('vision-focus')).toContainText('focus falls in front of the retina');

    await page.getByTestId('vision-problem').selectOption('short-sighted');
    await expect(page.getByText(/cannot assess anyone’s eyesight/)).toBeVisible();
    await expect(page.getByTestId('vision-focus')).toContainText('in focus');
    await page.getByTestId('vision-problem').selectOption('long-sighted');
    await expect(page.getByText(/not medical advice or a diagnostic test/)).toBeVisible();
  });

  test('labelled optical/neural pathway and blind-spot instructions remain text complete', async ({ page }) => {
    for (const structure of ['cornea', 'iris', 'pupil', 'lens', 'retina', 'fovea', 'optic nerve']) {
      await expect(page.locator('.eye-structure-list dt', { hasText: structure }).filter({ hasText: new RegExp(`^${structure}$`, 'i') })).toBeVisible();
    }
    const pathway = page.locator('section[aria-labelledby="eye-pathway-heading"] p');
    await expect(pathway).toContainText('Optical stage: cornea and lens');
    await expect(pathway).toContainText('Neural stage: retinal receptors');
    await expect(pathway).toContainText('optic nerve');
    for (let step = 2; step <= 4; step++) {
      await page.getByTestId('vision-blind-spot').click();
      await expect(page.getByTestId('blind-step')).toContainText(`Step ${step} of 4`);
    }
    await expect(page.getByTestId('blind-step')).toContainText('does not diagnose vision or eye health');
  });

  test('empty evidence is rejected, complete evidence saves and reset restores defaults', async ({ page }) => {
    await page.getByTestId('vision-save').click();
    await expect(page.getByText('empty evidence is not accepted', { exact: false })).toBeVisible();
    await page.getByTestId('vision-explanation').fill('The cornea and lens refract light to form an optical image on the retina; receptors convert light into neural signals and the optic nerve carries them for brain interpretation.');
    await page.getByTestId('vision-save').click();
    await expect(page.getByText('Saved for outcome 7.3.1', { exact: false })).toBeVisible();

    await page.getByTestId('vision-brightness').press('End');
    await page.getByTestId('vision-distance').press('End');
    await page.getByTestId('vision-blind-spot').click();
    await page.getByTestId('vision-reset').click();
    await expect(page.getByTestId('vision-brightness')).toHaveAttribute('aria-valuetext', 'Brightness: 60%');
    await expect(page.getByTestId('vision-distance')).toHaveAttribute('aria-valuetext', 'Distance: 50 cm');
    await expect(page.getByTestId('blind-step')).toContainText('Step 1 of 4');
    await expect(page.getByTestId('vision-explanation')).toHaveValue('');
  });
});
