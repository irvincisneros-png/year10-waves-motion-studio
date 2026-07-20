import { expect, test } from '@playwright/test';

test.describe('release print and destructive-control coverage', () => {
  test('every non-optics print control invokes the browser print surface', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.print = () => {
        const root = document.documentElement;
        const count = Number(root.getAttribute('data-print-count') ?? '0') + 1;
        root.setAttribute('data-print-count', String(count));
      };
    });

    const cases = [
      { url: '/#/progress', control: page.getByRole('button', { name: 'Print anonymous summary' }) },
      { url: '/#/teacher', control: page.getByRole('button', { name: 'Print selected sheet' }) },
      { url: '/#/society', control: page.getByRole('button', { name: 'Print argument' }) },
      { url: '/#/motion/graphs', control: page.getByTestId('motion-print') },
      { url: '/#/forces/cart', control: page.getByTestId('forces-print') },
    ];

    let expectedCount = 0;
    for (const printCase of cases) {
      await page.goto(printCase.url);
      expectedCount += 1;
      await printCase.control.click();
      await expect(page.locator('html')).toHaveAttribute(
        'data-print-count',
        String(expectedCount),
      );
    }
  });

  test('motion and force resets preserve data on dismiss and clear it on accept', async ({
    page,
  }) => {
    const cases = [
      {
        url: '/#/motion/track',
        seed: async () => {
          await page.getByTestId('motion-move-positive').click();
          await page.getByTestId('motion-record-sample').click();
        },
        reset: page.getByTestId('motion-track-reset'),
        table: page.getByTestId('motion-track-log'),
        populated: '1',
        empty: 'No samples yet.',
      },
      {
        url: '/#/motion/graphs',
        seed: async () => page.getByTestId('motion-add-trial').click(),
        reset: page.getByTestId('motion-graph-reset'),
        table: page.getByTestId('motion-graph-trials'),
        populated: '2',
        empty: 'No trials yet.',
      },
      {
        url: '/#/forces/cart',
        seed: async () => page.getByTestId('forces-run-trial').click(),
        reset: page.getByTestId('forces-cart-reset'),
        table: page.getByTestId('forces-cart-trials'),
        populated: '2',
        empty: 'No trials yet.',
      },
    ];

    for (const resetCase of cases) {
      await page.goto(resetCase.url);
      await resetCase.seed();
      await expect(resetCase.table).toContainText(resetCase.populated);

      page.once('dialog', (dialog) => void dialog.dismiss());
      await resetCase.reset.click();
      await expect(resetCase.table).toContainText(resetCase.populated);

      page.once('dialog', (dialog) => void dialog.accept());
      await resetCase.reset.click();
      await expect(resetCase.table).toContainText(resetCase.empty);
    }
  });

  test('teacher module and all-progress resets affect exactly the confirmed scope', async ({
    page,
  }) => {
    await page.goto('/#/progress');
    await page.getByTestId('import-input').setInputFiles({
      name: 'two-strands.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({
          evidence: [
            { id: 'waves', outcomeCode: '7.1.1', kind: 'check', activityId: 'q1', result: 'attempted', summary: 'waves', createdAt: '2026-07-20' },
            { id: 'sound', outcomeCode: '7.2.1', kind: 'check', activityId: 'q2', result: 'attempted', summary: 'sound', createdAt: '2026-07-20' },
          ],
        }),
      ),
    });
    await page.goto('/#/teacher');

    page.once('dialog', (dialog) => void dialog.dismiss());
    await page.locator('[data-control-id="teacher.reset-module-button"]').click();
    await page.goto('/#/progress');
    await expect(page.getByRole('row').filter({ hasText: '7.1.1' })).toContainText(
      'Developing',
    );
    await expect(page.getByRole('row').filter({ hasText: '7.2.1' })).toContainText(
      'Developing',
    );

    await page.goto('/#/teacher');
    page.once('dialog', (dialog) => void dialog.accept());
    await page.locator('[data-control-id="teacher.reset-module-button"]').click();
    await page.goto('/#/progress');
    await expect(page.getByRole('row').filter({ hasText: '7.1.1' })).toContainText(
      'Not attempted',
    );
    await expect(page.getByRole('row').filter({ hasText: '7.2.1' })).toContainText(
      'Developing',
    );

    await page.goto('/#/teacher');
    page.once('dialog', (dialog) => void dialog.accept());
    await page.locator('[data-control-id="teacher.reset-all-button"]').click();
    await page.goto('/#/progress');
    await expect(page.getByRole('row').filter({ hasText: '7.2.1' })).toContainText(
      'Not attempted',
    );
    await page.reload();
    await expect(page.getByRole('row').filter({ hasText: '7.2.1' })).toContainText(
      'Not attempted',
    );
  });
});
