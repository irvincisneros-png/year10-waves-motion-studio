import { expect, test } from '@playwright/test';

for (const viewport of [
  { name: 'tablet portrait', width: 768, height: 1024 },
  { name: 'tablet landscape', width: 1024, height: 768 },
]) {
  test.describe(viewport.name, () => {
    test.use({
      hasTouch: true,
      viewport: { width: viewport.width, height: viewport.height },
    });

    test('representative controls respond to touch without horizontal clipping', async ({
      page,
    }) => {
      await page.goto('/#/ultrasound');
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      ).toBeLessThanOrEqual(1);

      await page.getByTestId('ultrasound-pulse').tap();
      await expect(page.getByText(/^Pulse 1 sent/)).toBeVisible();

      await page.getByRole('button', { name: 'Settings' }).tap();
      await page.getByTestId('toggle-low-graphics').tap();
      await expect(page.locator('html')).toHaveAttribute('data-low-graphics', 'true');
    });
  });
}
