import { test, expect } from '@playwright/test';
import { tabKey } from './helpers';

test.describe('keyboard-only operation', () => {
  test('minimal primary gallery link is reachable and operable by keyboard', async ({
    page,
    browserName,
  }) => {
    const key = tabKey(browserName);
    await page.goto('/#/simulators/7.1.1');
    const link = page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'All simulators' });
    let reached = false;
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press(key);
      if (await link.evaluate((el) => el === document.activeElement)) {
        reached = true;
        break;
      }
    }
    expect(reached, 'All simulators link reachable by keyboard').toBe(true);
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Choose a science simulator' }),
    ).toBeVisible();
  });

  test('settings disclosure and toggles are fully keyboard operable', async ({
    page,
    browserName,
  }) => {
    const key = tabKey(browserName);
    await page.goto('/#/');
    const settingsButton = page.getByRole('button', { name: 'Settings', exact: true });

    // Reach the settings button by keyboard
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press(key);
      if (await settingsButton.evaluate((el) => el === document.activeElement))
        break;
    }
    await expect(settingsButton).toBeFocused();

    // Open with Enter
    await page.keyboard.press('Enter');
    await expect(settingsButton).toHaveAttribute('aria-expanded', 'true');

    // Tab to the first toggle and operate it with Space
    const reduced = page.getByTestId('toggle-reduced-motion');
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press(key);
      if (await reduced.evaluate((el) => el === document.activeElement)) break;
    }
    await expect(reduced).toBeFocused();
    const before = await reduced.isChecked();
    await page.keyboard.press('Space');
    expect(await reduced.isChecked()).toBe(!before);
    // The manual override reflects to the motion-policy attribute
    await expect(page.locator('html')).toHaveAttribute(
      'data-reduced-motion',
      String(!before),
    );

    // Escape closes the panel and returns focus to the button
    await page.keyboard.press('Escape');
    await expect(settingsButton).toHaveAttribute('aria-expanded', 'false');
    await expect(settingsButton).toBeFocused();
  });

  test('progress-page actions are reachable and operable by keyboard', async ({
    page,
    browserName,
  }) => {
    const key = tabKey(browserName);
    await page.goto('/#/progress');
    const resetButton = page.getByRole('button', { name: 'Reset all progress' });
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press(key);
      if (await resetButton.evaluate((el) => el === document.activeElement))
        break;
    }
    await expect(resetButton).toBeFocused();

    // Operate with Enter; dismiss the confirmation so nothing changes.
    page.once('dialog', (d) => void d.dismiss());
    await page.keyboard.press('Enter');
    // Still on the page, nothing broken
    await expect(
      page.getByRole('heading', { level: 1, name: 'Progress' }),
    ).toBeVisible();
  });

  test('teacher presentation toggle is keyboard operable', async ({
    page,
    browserName,
  }) => {
    const key = tabKey(browserName);
    await page.goto('/#/teacher');
    const toggle = page.getByTestId('toggle-presentation');
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press(key);
      if (await toggle.evaluate((el) => el === document.activeElement)) break;
    }
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.locator('html')).toHaveAttribute(
      'data-presentation',
      'true',
    );
    await page.keyboard.press('Space');
    await expect(page.locator('html')).toHaveAttribute(
      'data-presentation',
      'false',
    );
  });
});
