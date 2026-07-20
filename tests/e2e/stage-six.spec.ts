import { expect, test } from '@playwright/test';
import {
  COMPLETION_ROUTES,
  FORCE_ROUTES,
  LIGHT_ROUTES,
  MOTION_ROUTES,
  SHELL_ROUTES,
  SOUND_ROUTES,
  WAVES_ROUTES,
} from './helpers';

const RELEASE_ROUTES = [
  ...SHELL_ROUTES,
  ...WAVES_ROUTES,
  ...SOUND_ROUTES,
  ...LIGHT_ROUTES,
  ...MOTION_ROUTES,
  ...FORCE_ROUTES,
  ...COMPLETION_ROUTES,
];

test.describe('Stage 6 routes and deferral', () => {
  for (const route of COMPLETION_ROUTES) {
    test(`cold load and refresh work for ${route.path}`, async ({ page }) => {
      await page.goto(route.url);
      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
      await expect(page).toHaveTitle(route.title);
      await page.reload();
      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
    });
  }

  test('deferred cultural outcome appears only in the teacher coverage view', async ({ page }) => {
    await page.goto('/#/sound/cultural-materials');
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Primary' })).not.toContainText('Cultural');
    for (const route of ['/#/', '/#/progress', '/#/about', '/#/mastery']) {
      await page.goto(route);
      await expect(page.locator('main')).not.toContainText(/7\.2\.5|cultural sound|cultural outcome/i);
    }
    await page.goto('/#/teacher');
    await page.getByLabel('Filter coverage').selectOption('deferred');
    await expect(page.getByRole('table')).toContainText('7.2.5');
  });
});

test.describe('Stage 6 learner interactions', () => {
  test('spectrum explorer controls continuous position, disclosures, evidence and deep links', async ({ page }) => {
    await page.goto('/#/spectrum?region=xray');
    await expect(page.getByTestId('ionising-class')).toContainText(/ionising/i);
    await page.getByLabel('Jump to spectrum region').selectOption('radio');
    await expect(page.getByText('Radio', { exact: true }).first()).toBeVisible();
    await page.getByLabel('Enter position by').selectOption('frequency');
    await page.getByTestId('spectrum-position').press('End');
    await page.getByLabel('Use logarithmic scale').uncheck();
    await expect(page.getByText(/A linear axis compresses/)).toBeVisible();
    await page.getByLabel('Show atmospheric transmission overlay').check();
    for (const summary of ['Sources and detectors for this wavelength', 'Material and atmosphere interactions', 'Applications and risk controls', 'Evidence and review date']) await page.getByText(summary, { exact: true }).click();
    await page.getByRole('button', { name: /Scale comparison:/ }).click();
    await page.getByLabel('Compare applications by').selectOption('risk-control');
    await page.getByTestId('spectrum-save').click();
    await expect(page.getByText(/Cite at least one data point/)).toBeVisible();
    await page.getByLabel('Your evidence for this property').fill('The reviewed dataset links penetration and absorption to a specific use and risk control.');
    await page.getByTestId('spectrum-save').click();
    await expect(page.getByText(/Spectrum comparison saved/)).toBeVisible();
  });

  test('hearing pathway exposes all stages and rejects then saves an explanation', async ({ page }) => {
    await page.goto('/#/hearing');
    for (const name of ['Outer ear', 'Ear canal', 'Eardrum', 'Ossicles', 'Oval window', 'Cochlear fluid', 'Hair cells', 'Auditory nerve']) await page.getByRole('button', { name: new RegExp(name) }).click();
    await page.getByLabel(/Test frequency for cochlear mapping/).press('End');
    await expect(page.getByText(/maps to the simplified high-frequency region/)).toBeVisible();
    await page.getByText('Show signal-type explanation').click();
    await page.getByText('Show hearing protection information').click();
    await page.getByTestId('hearing-save').click();
    await expect(page.getByText(/mechanical, fluid and electrical stages/)).toBeVisible();
    await page.getByTestId('hearing-explanation').fill('Pressure drives mechanical vibration, cochlear fluid motion and hair-cell electrical signals for brain interpretation.');
    await page.getByTestId('hearing-save').click();
    await expect(page.getByText(/Ear-response explanation saved/)).toBeVisible();
  });

  test('ultrasound computes synthetic echoes and enforces pulse evidence', async ({ page }) => {
    await page.goto('/#/ultrasound');
    await page.getByTestId('ultrasound-save').click();
    await expect(page.getByText(/Send at least one pulse/)).toBeVisible();
    await page.getByLabel(/Probe angle/).fill('30');
    await page.getByLabel(/Probe frequency/).fill('12');
    await expect(page.getByText(/higher resolution and lower penetration/)).toBeVisible();
    await page.getByLabel('Tissue phantom scenario').selectOption('small-target');
    await page.getByLabel('Show simplified B-mode image').check();
    await expect(page.getByLabel('Simplified B-mode image with boundary echoes')).toBeVisible();
    await page.getByTestId('ultrasound-pulse').click();
    await expect(page.getByText(/Pulse 1 sent/)).toBeVisible();
    await page.getByTestId('ultrasound-interpretation').fill('The round-trip echo time is divided by two to estimate one-way depth; the synthetic constant-speed model is a limitation.');
    await page.getByTestId('ultrasound-save').click();
    await expect(page.getByText(/Synthetic ultrasound investigation saved/)).toBeVisible();
  });

  test('astronomy controls preserve signed motion and honest line identification', async ({ page }) => {
    await page.goto('/#/astronomy?band=xray');
    await expect(page.getByText(/xray evidence:/i)).toBeVisible();
    await page.getByLabel('Observation band').selectOption('visible');
    await page.getByLabel('Star example').selectOption({ index: 1 });
    await page.getByLabel(/Radial velocity/).press('Home');
    await expect(page.getByText(/Motion:/).locator('..')).toContainText('approaching');
    await page.getByLabel('Show atmospheric windows').check();
    await page.getByLabel(/Spectral line inspector/).fill('600');
    await expect(page.getByTestId('line-identification')).toContainText('No catalogued line');
    await page.getByTestId('astronomy-save').click();
    await expect(page.getByText(/at least 40 characters/)).toBeVisible();
    await page.getByTestId('astronomy-inference').fill('Visible light includes a catalogued line; a negative shift means motion towards us, with a simplified non-relativistic model limitation.');
    await page.getByTestId('astronomy-save').click();
    await expect(page.getByText(/Starlight inference saved/)).toBeVisible();
  });

  test('society argument requires every sourced reasoning component and exports', async ({ page }) => {
    await page.goto('/#/society');
    await page.getByLabel('Case study').selectOption({ index: 1 });
    await page.getByLabel('Evidence pack section').selectOption('quantitative');
    await page.getByRole('button', { name: 'Add criterion' }).click();
    await page.getByRole('button', { name: 'Remove criterion 2' }).click();
    await page.getByRole('button', { name: 'Add evidence row' }).click();
    await page.getByRole('button', { name: 'Delete evidence row 2' }).click();
    await page.getByRole('button', { name: 'Add source' }).click();
    await page.getByRole('button', { name: 'Remove source 2' }).click();
    await page.getByTestId('society-save').click();
    await expect(page.getByText(/Write a contention before saving/)).toBeVisible();
    await page.getByLabel('Your contention').fill('The technology changed access substantially, although the benefit is not distributed equally.');
    await page.getByLabel('Criterion 1').fill('equitable access');
    const evidence = page.locator('[data-control-id="society.evidence-table-entry"]');
    await evidence.getByLabel('Evidence claim 1').fill('The official dataset reports a measurable access change.');
    await evidence.getByLabel('Source 1').fill('Official reviewed evidence pack');
    await evidence.getByLabel('Relevance 1').fill('It measures the access criterion.');
    const cer = page.locator('[data-control-id="society.cer-paragraph-editor"]');
    await cer.getByLabel('Claim').fill('Access changed for many users.');
    await cer.getByLabel('Evidence').fill('The official quantitative measure increased.');
    await cer.getByLabel('Reasoning').fill('The measured increase meets the defined access criterion.');
    await page.getByLabel('Counterclaim and response').fill('Some groups remain excluded, so the benefit is substantial but incomplete.');
    await page.getByLabel('Conclusion proportional to the evidence').fill('Overall the evidence supports a substantial, uneven change rather than an absolute benefit.');
    await page.locator('[data-control-id="society.bibliography-input"]').getByLabel('Source 1').fill('Official evidence pack URL and review date');
    await page.getByTestId('society-save').click();
    await expect(page.getByText(/Argument saved/)).toBeVisible();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export argument' }).click();
    await download;
  });

  test('mastery never accepts an empty response and records a submitted attempt', async ({ page }) => {
    await page.goto('/#/mastery');
    await page.getByRole('button', { name: 'Submit answer' }).click();
    await expect(page.getByTestId('mastery-feedback')).toContainText('Choose an answer');
    await page.getByRole('radio').first().check();
    await page.getByRole('button', { name: 'Submit answer' }).click();
    await expect(page.getByTestId('mastery-feedback')).toBeVisible();
    await page.getByRole('button', { name: 'Show worked reasoning' }).click();
    await expect(page.getByText(/Hint 3:/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next question' })).toBeEnabled();
  });
});

test.describe('Stage 6 teacher, update and offline hardening', () => {
  test('teacher layers, presets, coverage and print templates have observable effects', async ({ page }) => {
    await page.goto('/#/teacher');
    for (const layer of ['labels', 'values', 'equations', 'particles', 'vectors', 'trails', 'answers']) {
      const toggle = page.getByTestId(`teacher-layer-${layer}`);
      await toggle.uncheck();
      await expect(page.locator('html')).toHaveAttribute(`data-layer-${layer}`, 'false');
      await expect(page.locator(`[data-teacher-layer~="${layer}"]`).first()).toBeHidden();
      await toggle.check();
      await expect(page.locator(`[data-teacher-layer~="${layer}"]`).first()).toBeVisible();
    }
    await page.getByTestId('teacher-layer-particles').uncheck();
    await page.goto('/#/waves/medium');
    await expect(page.getByTestId('chamber-mechanical')).toBeHidden();
    await expect(page.getByTestId('chamber-em')).toBeVisible();
    await expect(page.getByTestId('chamber-mechanical-alt')).toBeVisible();
    await page.goto('/#/teacher');
    await page.getByTestId('teacher-layer-particles').check();
    await page.getByTestId('teacher-layer-trails').uncheck();
    await page.goto('/#/sound/doppler');
    await expect(page.getByTestId('doppler-canvas')).toBeHidden();
    await expect(page.getByTestId('doppler-canvas-alt')).toBeVisible();
    await page.goto('/#/teacher');
    await page.getByTestId('teacher-layer-trails').check();
    await page.getByTestId('teacher-layer-vectors').uncheck();
    await page.goto('/#/waves/medium');
    await expect(page.getByTestId('chamber-em')).toBeHidden();
    await expect(page.getByTestId('chamber-mechanical')).toBeVisible();
    await page.goto('/#/teacher');
    await page.getByTestId('teacher-layer-vectors').check();
    await page.getByTestId('teacher-layer-labels').uncheck();
    await page.goto('/#/waves/medium');
    await expect(page.locator('[data-teacher-layer="labels"]').first()).toBeHidden();
    await expect(page.locator('[data-teacher-layer="values"]').first()).toBeVisible();
    await page.goto('/#/teacher');
    await page.getByTestId('teacher-layer-labels').check();
    await page.getByTestId('teacher-layer-values').uncheck();
    await page.goto('/#/waves/medium');
    await expect(page.locator('[data-teacher-layer="values"]').first()).toBeHidden();
    await expect(page.locator('[data-teacher-layer="labels"]').first()).toBeVisible();
    await page.goto('/#/teacher');
    await page.getByTestId('teacher-layer-values').check();
    await page.getByTestId('teacher-layer-equations').uncheck();
    await page.goto('/#/waves/measure');
    await expect(page.locator('[data-teacher-layer="equations"]').first()).toBeHidden();
    await page.goto('/#/teacher');
    await page.getByTestId('teacher-layer-equations').check();
    await page.getByTestId('teacher-layer-answers').uncheck();
    await page.goto('/#/mastery');
    await page.getByRole('radio').first().check();
    await page.getByRole('button', { name: 'Submit answer' }).click();
    await expect(page.getByTestId('mastery-feedback')).toBeHidden();
    await page.goto('/#/teacher');
    await page.getByTestId('teacher-layer-answers').check();
    await page.getByTestId('teacher-preset-select').selectOption('/spectrum?region=xray');
    await expect(page.getByTestId('teacher-deep-link')).toHaveValue(/#\/spectrum\?region=xray$/);
    await page.getByLabel('Filter coverage').selectOption('deferred');
    await expect(page.getByRole('table')).toContainText('7.2.5');
    await page.getByTestId('teacher-sheet-select').selectOption('cer');
    await expect(page.getByTestId('teacher-print-sheet')).toContainText('Claim–Evidence–Reasoning report');
    page.once('dialog', (dialog) => void dialog.dismiss());
    await page.getByRole('button', { name: 'Reset selected module' }).click();
  });

  test('visible update prompt supports defer and refresh actions', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByRole('heading', { level: 1, name: 'WaveMotion Studio' })).toBeVisible();
    await page.waitForTimeout(100);
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('wavemotion:update-available')));
    await expect(page.getByText('A new version of WaveMotion Studio is available.')).toBeVisible();
    await page.getByRole('button', { name: 'Not now' }).click();
    await expect(page.getByText('A new version of WaveMotion Studio is available.')).toBeHidden();
    await page.evaluate(() => {
      (window as typeof window & { __updateCalled?: boolean }).__updateCalled = false;
      window.dispatchEvent(new CustomEvent('wavemotion:update-available', { detail: { update: () => { (window as typeof window & { __updateCalled?: boolean }).__updateCalled = true; } } }));
    });
    await page.getByRole('button', { name: 'Refresh now' }).click();
    expect(await page.evaluate(() => (window as typeof window & { __updateCalled?: boolean }).__updateCalled)).toBe(true);
  });

  test('service-worker registration failure gives a visible online-only fallback', async ({ page }) => {
    await page.goto('/#/');
    await expect.poll(async () => {
      await page.evaluate(() =>
        window.dispatchEvent(new CustomEvent('wavemotion:sw-registration-error')),
      );
      return page.getByTestId('sw-registration-error').count();
    }).toBe(1);
    await expect(page.getByTestId('sw-registration-error')).toContainText(
      'Keep a connection while using the app',
    );
  });

  test('every released route reloads offline after one production-app load', async ({ page, context, browserName }) => {
    test.setTimeout(180_000);
    test.skip(browserName !== 'chromium', 'Service-worker offline emulation is Chromium-only.');
    await page.goto('/#/');
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await context.setOffline(true);
    try {
      for (const route of RELEASE_ROUTES) {
        await page.goto(route.url);
        await page.reload();
        await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
      }
    } finally {
      await context.setOffline(false);
    }
  });
});
