import { test, expect } from '@playwright/test';

test.describe('settings persistence', () => {
  test('reduced-motion and audio toggles persist across reload', async ({
    page,
  }) => {
    await page.goto('/#/');
    await page.getByRole('button', { name: 'Settings' }).click();

    const reduced = page.getByTestId('toggle-reduced-motion');
    const audio = page.getByTestId('toggle-audio');
    // Defaults: audio strictly off; reduced motion follows the OS (off in
    // these test browsers).
    await expect(audio).not.toBeChecked();
    await expect(reduced).not.toBeChecked();

    await reduced.check();
    await audio.check();
    await expect(page.locator('html')).toHaveAttribute(
      'data-reduced-motion',
      'true',
    );

    await page.reload();
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByTestId('toggle-reduced-motion')).toBeChecked();
    await expect(page.getByTestId('toggle-audio')).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute(
      'data-reduced-motion',
      'true',
    );
  });

  test('low-graphics toggle persists and reflects to the document', async ({
    page,
  }) => {
    await page.goto('/#/');
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByTestId('toggle-low-graphics').check();
    await expect(page.locator('html')).toHaveAttribute(
      'data-low-graphics',
      'true',
    );
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute(
      'data-low-graphics',
      'true',
    );
  });
});

test.describe('settings environmental fallbacks', () => {
  test('denied localStorage falls back to a usable memory-only session', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      for (const method of ['getItem', 'setItem', 'removeItem'] as const) {
        Object.defineProperty(Storage.prototype, method, {
          configurable: true,
          value: () => {
            throw new DOMException('Storage denied', 'QuotaExceededError');
          },
        });
      }
    });

    await page.goto('/#/');
    await expect(page.locator('.notice--warn[role="status"]')).toContainText(
      'settings and progress will work for this session but will not be kept',
    );
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByTestId('toggle-low-graphics').check();
    await expect(page.locator('html')).toHaveAttribute('data-low-graphics', 'true');
    await page.goto('/#/progress');
    await expect(page.getByText('0 of 24 outcomes attempted')).toBeVisible();
  });

  test.describe('when the OS requests reduced motion', () => {
    test('the first load is static and manual stepping remains available', async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/#/waves/types');
      await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
      await expect(page.getByTestId('sim-pause')).toHaveCount(0);
      await expect(page.getByTestId('sim-step')).toBeEnabled();

      const before = await page.getByTestId('probe-readout').textContent();
      await page.getByTestId('sim-step').click();
      await expect(page.getByTestId('probe-readout')).not.toHaveText(before ?? '');

      await page.getByRole('button', { name: 'Settings' }).click();
      await expect(page.getByTestId('toggle-reduced-motion')).toBeChecked();
      await page.getByTestId('toggle-reduced-motion').uncheck();
      await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'false');
    });
  });
});

test.describe('progress export / import / reset', () => {
  test('export downloads valid schema-wrapped JSON', async ({ page }) => {
    await page.goto('/#/progress');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export local backup (includes written evidence)' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('wavemotion-local-backup.json');

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    expect(parsed.schema).toBe('wavemotion.progress');
    expect(parsed.version).toBe(2);
    expect(parsed.data).toHaveProperty('outcomes');
    expect(parsed.data).toHaveProperty('evidence');
  });

  test('import of a valid file updates the outcome table', async ({ page }) => {
    await page.goto('/#/progress');
    const row = page.getByRole('row').filter({ hasText: '7.1.1' });
    await expect(row.getByText('Not attempted')).toBeVisible();

    await page.getByTestId('import-input').setInputFiles({
      name: 'progress.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({ evidence: [
          { id: 'a', outcomeCode: '7.1.1', kind: 'check', activityId: 'q1', result: 'successful', summary: 'correct', createdAt: '2026-07-20' },
          { id: 'b', outcomeCode: '7.1.1', kind: 'explanation', activityId: 'cer1', result: 'successful', summary: 'complete', createdAt: '2026-07-20' },
        ] }),
      ),
    });
    await expect(page.getByTestId('progress-feedback')).toContainText(
      'imported successfully',
    );
    await expect(row.getByText('Secure')).toBeVisible();
    await expect(page.getByText('1 of 24 outcomes attempted')).toBeVisible();
  });

  test('oversized import (> 1 MB) is rejected gracefully', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/#/progress');
    const big = JSON.stringify({
      outcomes: {},
      evidence: [],
      padding: 'x'.repeat(1_200_000),
    });
    await page.getByTestId('import-input').setInputFiles({
      name: 'huge.json',
      mimeType: 'application/json',
      buffer: Buffer.from(big),
    });
    await expect(page.getByTestId('progress-feedback')).toContainText(
      /rejected/i,
    );
    // Table unchanged
    await expect(page.getByText('0 of 24 outcomes attempted')).toBeVisible();
  });

  test('malformed import is rejected gracefully', async ({ page }) => {
    await page.goto('/#/progress');
    await page.getByTestId('import-input').setInputFiles({
      name: 'broken.json',
      mimeType: 'application/json',
      buffer: Buffer.from('this is {{{ not json'),
    });
    await expect(page.getByTestId('progress-feedback')).toContainText(
      /rejected/i,
    );
    await expect(page.getByText('0 of 24 outcomes attempted')).toBeVisible();
  });

  test('reset-all asks for confirmation and clears progress', async ({
    page,
  }) => {
    await page.goto('/#/progress');
    // Seed some progress first via import
    await page.getByTestId('import-input').setInputFiles({
      name: 'progress.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({ evidence: [{ id: 'a', outcomeCode: '7.2.1', kind: 'check', activityId: 'q1', result: 'attempted', summary: 'incorrect', createdAt: '2026-07-20' }] }),
      ),
    });
    await expect(page.getByText('1 of 24 outcomes attempted')).toBeVisible();

    // Dismissing the confirm leaves progress untouched
    page.once('dialog', (d) => void d.dismiss());
    await page.getByRole('button', { name: 'Reset all progress' }).click();
    await expect(page.getByText('1 of 24 outcomes attempted')).toBeVisible();

    // Accepting the confirm clears it
    page.once('dialog', (d) => void d.accept());
    await page.getByRole('button', { name: 'Reset all progress' }).click();
    await expect(page.getByText('0 of 24 outcomes attempted')).toBeVisible();

    // …and the reset persists across reload
    await page.reload();
    await expect(page.getByText('0 of 24 outcomes attempted')).toBeVisible();
  });
});
