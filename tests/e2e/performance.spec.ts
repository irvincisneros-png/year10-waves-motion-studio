import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const TWO_MIB = 2 * 1024 * 1024;

function releaseFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('._')) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? releaseFiles(path) : [path];
  });
}

test.describe('production performance and memory budgets', () => {
  test('the complete static app is below the 2 MiB compressed initial-route budget', () => {
    const dist = join(process.cwd(), 'dist');
    const files = releaseFiles(dist);
    const compressedBytes = files.reduce(
      (sum, file) => sum + gzipSync(readFileSync(file)).byteLength,
      0,
    );
    const largestFileBytes = Math.max(...files.map((file) => statSync(file).size));

    // This is intentionally stronger than the shared target: the complete
    // precached application, not merely the first route, must fit under 2 MiB.
    expect(compressedBytes).toBeLessThan(TWO_MIB);
    expect(largestFileBytes).toBeLessThan(TWO_MIB);
  });

  test('a warm-cache route reaches a useful interaction within 3 seconds', async ({
    page,
  }) => {
    await page.goto('/#/waves/types');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Wave types' }),
    ).toBeVisible();
    await page.goto('/#/');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Choose a science simulator' }),
    ).toBeVisible();

    const startedAt = Date.now();
    await page.goto('/#/waves/types');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Wave types' }),
    ).toBeVisible();
    const pause = page.getByTestId('sim-pause');
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    expect(Date.now() - startedAt).toBeLessThan(3_000);
  });

  test('animated controls remain responsive in normal and low-graphics modes', async ({
    page,
  }) => {
    await page.goto('/#/waves/types');
    await expect(page.getByTestId('types-canvas')).toBeVisible();

    const sampleFramesPerSecond = () =>
      page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            let frames = 0;
            const startedAt = performance.now();
            const sample = (now: number) => {
              frames += 1;
              if (now - startedAt >= 1_000) {
                resolve((frames * 1_000) / (now - startedAt));
                return;
              }
              requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
          }),
      );

    expect(await sampleFramesPerSecond()).toBeGreaterThanOrEqual(28);

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByTestId('toggle-low-graphics').check();
    await expect(page.getByTestId('toggle-low-graphics')).toBeChecked();
    expect(await sampleFramesPerSecond()).toBeGreaterThanOrEqual(20);
  });

  test('repeated animated-route mounts do not retain material heap', async ({
    browserName,
    page,
  }) => {
    test.skip(browserName !== 'chromium', 'Chromium CDP heap metrics are required');
    test.setTimeout(90_000);
    const cdp = await page.context().newCDPSession(page);

    const visitAnimatedRoute = async () => {
      await page.goto('/#/waves/types');
      await expect(
        page.getByRole('heading', { level: 1, name: 'Wave types' }),
      ).toBeVisible();
      await page.goto('/#/about');
      await expect(
        page.getByRole('heading', { level: 1, name: 'About' }),
      ).toBeVisible();
    };

    for (let index = 0; index < 5; index += 1) await visitAnimatedRoute();
    await cdp.send('HeapProfiler.collectGarbage');
    const baseline = await page.evaluate(
      () =>
        (performance as Performance & { memory: { usedJSHeapSize: number } })
          .memory.usedJSHeapSize,
    );

    for (let index = 0; index < 25; index += 1) await visitAnimatedRoute();
    await cdp.send('HeapProfiler.collectGarbage');
    const after = await page.evaluate(
      () =>
        (performance as Performance & { memory: { usedJSHeapSize: number } })
          .memory.usedJSHeapSize,
    );

    expect(after - baseline).toBeLessThan(5 * 1024 * 1024);
    await cdp.detach();
  });
});

test.describe('high-density Canvas budget', () => {
  test.use({ deviceScaleFactor: 3, viewport: { width: 1024, height: 800 } });

  test('Canvas backing stores cap device pixel ratio at 2', async ({ page }) => {
    await page.goto('/#/waves/types');
    const canvas = page.getByTestId('types-canvas');
    await expect(canvas).toBeVisible();
    const dimensions = await canvas.evaluate((element) => {
      const canvasElement = element as HTMLCanvasElement;
      const cssWidth = canvasElement.getBoundingClientRect().width;
      const cssHeight = canvasElement.getBoundingClientRect().height;
      return {
        cssHeight,
        cssWidth,
        pixelHeight: canvasElement.height,
        pixelWidth: canvasElement.width,
      };
    });

    expect(dimensions.pixelWidth).toBeLessThanOrEqual(
      Math.ceil(dimensions.cssWidth * 2),
    );
    expect(dimensions.pixelHeight).toBeLessThanOrEqual(
      Math.ceil(dimensions.cssHeight * 2),
    );
  });
});
