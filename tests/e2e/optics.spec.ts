import { expect, test, type Page } from '@playwright/test';
import { LIGHT_ROUTES } from './helpers';

async function readDownload(page: Page, trigger: () => Promise<void>): Promise<string> {
  const pending = page.waitForEvent('download');
  await trigger();
  const download = await pending;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

test.describe('light and vision routing', () => {
  for (const route of LIGHT_ROUTES) {
    test(`cold load + refresh works for ${route.path}`, async ({ page }) => {
      await page.goto(route.url);
      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
      await expect(page).toHaveTitle(route.title);
      await page.reload();
      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
    });
  }

  test('home cards and the seven-phase path reach all Stage 4 activities', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.locator('.workspace-card', { hasText: 'Light & optics' }).getByText('Available')).toBeVisible();
    await expect(page.locator('.workspace-card', { hasText: 'Vision' }).getByText('Available')).toBeVisible();
    await expect(page.locator('.workspace-card', { hasText: 'Reading starlight' }).getByText('In development')).toBeVisible();
    await page.locator('.workspace-card', { hasText: 'Light & optics' }).getByRole('link').click();
    const nav = page.getByRole('navigation', { name: 'Light and vision phases' });
    for (const [label, heading] of [
      ['Eye response', 'How the eye responds to light'],
      ['Light properties', 'Investigate light properties'],
      ['Everyday applications', 'Everyday applications of light'],
      ['Check questions', 'Check light & vision'],
      ['Evidence reasoning', 'Explain refraction with evidence'],
      ['Light in the real world', 'Light in the real world'],
    ] as const) {
      await nav.getByRole('link', { name: label }).click();
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    }
  });

  test('astronomy is not prematurely exposed and its direct route is a 404', async ({ page }) => {
    await page.goto('/#/light');
    await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Astronomy' })).toHaveCount(0);
    await page.goto('/#/astronomy');
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  });
});

test.describe('light properties investigation (7.3.2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/light/properties');
  });

  test('reflection controls, challenge feedback and keyboard bounds are observable', async ({ page }) => {
    await expect(page.getByTestId('reflection-readout')).toHaveText('θᵢ = 30.0°; θᵣ = 30.0° from the normal');
    await page.getByTestId('reflection-source').press('End');
    await expect(page.getByTestId('reflection-source')).toHaveAttribute('aria-valuetext', 'Source at x = 100 cm');
    await page.getByTestId('mirror-position').press('Home');
    await expect(page.getByText('100 cm / 0 cm (geometry placement only)')).toBeVisible();

    const reflectionSection = page.locator('section[aria-labelledby="reflection-heading"]');
    await page.getByTestId('normal-toggle').uncheck();
    await expect(reflectionSection.locator('.light-diagram__normal')).toHaveCount(0);
    await page.getByTestId('protractor-toggle').check();
    await expect(page.getByText(/Measured incident 30\.0°; reflected 30\.0°/)).toBeVisible();

    await page.getByTestId('mirror-type').selectOption('concave');
    await expect(page.getByText(/Concave mirror extension/)).toBeVisible();
    await page.getByTestId('mirror-type').selectOption('convex');
    await expect(page.getByText(/Convex mirror extension/)).toBeVisible();

    await page.getByTestId('reflection-challenge').selectOption('periscope');
    await expect(page.getByTestId('challenge-feedback')).toContainText('misses the target direction by 15°');
    await page.getByTestId('mirror-angle').fill('45');
    await expect(page.getByTestId('challenge-feedback')).toContainText('Target reached');
    await expect(page.getByTestId('reflection-readout')).toHaveText('θᵢ = 45.0°; θᵣ = 45.0° from the normal');
  });

  test('refraction preserves frequency, changes speed/wavelength and represents TIR without a false ray', async ({ page }) => {
    await expect(page.getByTestId('first-medium')).toHaveValue('air');
    await expect(page.getByTestId('second-medium')).toHaveValue('water');
    await expect(page.getByTestId('refraction-readout')).toHaveText('Refracted angle 22.1° from normal.');
    await expect(page.getByTestId('frequency-constant')).toHaveText('5.00e+14 Hz — unchanged across boundary');

    await page.getByTestId('snell-toggle').click();
    await expect(page.getByTestId('snell-worked')).toContainText('θ₂ = 22.1°');
    await page.getByTestId('refraction-angle').press('End');
    await expect(page.getByTestId('refraction-angle')).toHaveAttribute('aria-valuetext', 'Incident: 89° from normal');

    await page.getByTestId('tir-toggle').check();
    await expect(page.getByTestId('first-medium')).toHaveValue('crown-glass');
    await expect(page.getByTestId('second-medium')).toHaveValue('air');
    await expect(page.getByTestId('refraction-readout')).toContainText('Total internal reflection');
    await expect(page.locator('.light-diagram__refracted')).toHaveCount(0);
    await page.getByTestId('fibre-toggle').click();
    await expect(page.getByText(/repeated TIR and remain guided/)).toBeVisible();
  });

  test('energy ledger conserves 100 percent and all scattering regimes are reachable', async ({ page }) => {
    const ledger = page.getByLabel('Energy ledger: transmitted, reflected, absorbed');
    await expect(ledger.getByRole('cell', { name: '100%' })).toBeVisible();
    await expect(ledger).toContainText('10%8%82%100%');
    await page.getByTestId('surface-select').selectOption('uv-screen');
    await page.getByTestId('illuminant-select').selectOption('uv-rich');
    await expect(ledger).toContainText('6%14%80%100%');

    await page.getByTestId('particle-size').press('Home');
    await expect(page.getByTestId('scattering-regime')).toContainText('Small particles');
    await page.getByTestId('particle-size').fill('34');
    await expect(page.getByTestId('scattering-regime')).toContainText('Comparable-size particles');
    await page.getByTestId('particle-size').press('End');
    await expect(page.getByTestId('scattering-regime')).toContainText('Large particles');
  });

  test('complete controlled investigation graphs, exports, prints and saves evidence', async ({ page }) => {
    await page.getByTestId('optics-save-evidence').click();
    await expect(page.getByText('Complete the hypothesis;', { exact: false })).toBeVisible();
    await page.getByTestId('optics-hypothesis').fill('If incident angle increases, reflected angle will increase equally because both are measured from the normal.');

    await page.getByTestId('record-reflection').click();
    await page.getByTestId('mirror-angle').fill('45');
    await page.getByTestId('record-reflection').click();
    await expect(page.getByTestId('reflection-graph')).toBeVisible();
    await page.getByTestId('record-refraction').click();
    await page.getByTestId('record-energy').click();
    await expect(page.getByTestId('optics-trials').locator('tbody tr')).toHaveCount(4);
    await page.getByRole('button', { name: 'Delete trial 4' }).click();
    await expect(page.getByTestId('optics-trials').locator('tbody tr')).toHaveCount(3);
    await page.getByTestId('record-energy').click();

    const csv = await readDownload(page, () => page.getByTestId('optics-export-csv').click());
    expect(csv).toContain('Trial type,Inputs with units,Result with units');
    expect(csv.match(/reflection/g)).toHaveLength(2);
    const json = JSON.parse(await readDownload(page, () => page.getByTestId('optics-export-json').click())) as { schema: string; trials: unknown[] };
    expect(json.schema).toBe('wavemotion.optics-investigation');
    expect(json.trials).toHaveLength(4);

    await page.evaluate(() => { window.print = () => document.documentElement.setAttribute('data-print-invoked', 'true'); });
    await page.getByTestId('optics-print').click();
    await expect(page.locator('html')).toHaveAttribute('data-print-invoked', 'true');

    await page.getByTestId('optics-interpretation').fill('At both measured angles, reflected angle equalled incident angle.');
    await page.getByTestId('optics-conclusion').fill('The measurements supported the hypothesis and the law of reflection.');
    await page.getByTestId('optics-limitation').fill('The ray model is ideal; compare with repeated protractor measurements and uncertainty in a supervised practical.');
    await page.getByTestId('optics-save-evidence').click();
    await expect(page.getByText('Saved for outcome 7.3.2', { exact: false })).toBeVisible();

    page.once('dialog', (dialog) => void dialog.dismiss());
    await page.getByTestId('optics-reset').click();
    await expect(page.getByTestId('optics-trials').locator('tbody tr')).toHaveCount(4);
    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByTestId('optics-reset').click();
    await expect(page.getByTestId('optics-trials')).toContainText('No trials yet');
    await expect(page.getByTestId('reflection-readout')).toHaveText('θᵢ = 30.0°; θᵣ = 30.0° from the normal');
  });
});

test.describe('applications, checks and explanation', () => {
  test('mirror, lens, fibre and conditional application evidence are complete', async ({ page }) => {
    await page.goto('/#/light/applications');
    await expect(page.getByTestId('lens-outcome')).toContainText('upright, enlarged, virtual');
    await page.getByTestId('lens-type').selectOption('diverging');
    await expect(page.getByTestId('lens-outcome')).toContainText('upright, reduced, virtual');
    await page.getByTestId('lens-type').selectOption('converging');
    await page.getByRole('radio', { name: 'Far' }).check();
    await expect(page.getByTestId('lens-outcome')).toContainText('inverted, real image');

    await page.getByTestId('application-save').click();
    await expect(page.getByText('empty evidence is not accepted', { exact: false })).toBeVisible();
    await page.getByTestId('application-select').selectOption('thermal');
    await expect(page.getByTestId('application-context')).toContainText('does not calculate temperature');
    await page.getByTestId('application-justification').fill('The selected high-absorption model allocates more incoming optical energy to absorption under the stated source.');
    await page.getByTestId('application-assumption').fill('Heating also depends on duration, heat capacity and surroundings, which this model omits.');
    await page.getByTestId('application-save').click();
    await expect(page.getByText('Saved for outcome 7.3.3', { exact: false })).toBeVisible();
    await page.getByTestId('applications-reset').click();
    await expect(page.getByTestId('application-select')).toHaveValue('none');
  });

  test('check questions reject empty input and give graduated, misconception-specific feedback', async ({ page }) => {
    await page.goto('/#/light/check');
    await page.getByTestId('light-check-hint').click();
    await expect(page.getByText(/Separate what happens to light/)).toBeVisible();
    await page.getByTestId('light-check-hint').click();
    await expect(page.getByText(/lens focuses light/)).toBeVisible();
    await page.getByRole('radio', { name: /retina takes a photograph/i }).check();
    await page.getByTestId('light-check-submit').click();
    await expect(page.getByTestId('light-check-feedback')).toContainText('not a single “flip” step');
    await page.getByTestId('light-check-next').click();
    await page.getByRole('radio', { name: /narrows, reducing/i }).check();
    await page.getByTestId('light-check-submit').click();
    await expect(page.getByTestId('light-check-feedback')).toContainText('Correct');
    await page.getByTestId('light-check-next').click();
    await page.getByTestId('light-check-submit').click();
    await expect(page.getByTestId('light-check-feedback')).toContainText('Enter a numeric value');
    await page.getByTestId('light-check-answer').fill('37');
    await page.getByTestId('light-check-submit').click();
    await expect(page.getByTestId('light-check-feedback')).toContainText('Correct');
  });

  test('the complete validated question bank can finish and restart', async ({ page }) => {
    await page.goto('/#/light/check');
    const answers = [
      { option: /cornea and lens focus/i },
      { option: /narrows, reducing/i },
      { raw: '37' },
      { option: /speed and wavelength decrease/i },
      { option: /higher-index to a lower-index/i },
      { raw: '82' },
      { option: /under the stated illuminant/i },
      { option: /higher-index core and lower-index cladding/i },
    ];
    for (const answer of answers) {
      if ('raw' in answer) await page.getByTestId('light-check-answer').fill(answer.raw);
      else await page.getByRole('radio', { name: answer.option }).check();
      await page.getByTestId('light-check-submit').click();
      await expect(page.getByTestId('light-check-feedback')).toContainText('Correct');
      await page.getByTestId('light-check-next').click();
    }
    await expect(page.getByTestId('light-check-summary')).toHaveText('You answered 8 of 8 scored questions correctly.');
    await page.getByRole('button', { name: 'Start again' }).click();
    await expect(page.getByTestId('light-check-prompt')).toContainText('eye and brain');
  });

  test('CER evidence identifies each missing field before accepting a complete explanation', async ({ page }) => {
    await page.goto('/#/light/explain');
    await page.getByTestId('light-cer-save').click();
    await expect(page.getByText('Claim is missing — fill it in before submitting.')).toBeVisible();
    await page.getByTestId('light-cer-claim').fill('The ray bends towards the normal because light slows at the air–water boundary.');
    await page.getByTestId('light-cer-save').click();
    await expect(page.getByText('Evidence is missing — fill it in before submitting.')).toBeVisible();
    await page.getByTestId('light-cer-evidence').fill('Frequency remained 5.00e+14 Hz while speed and wavelength decreased and 30° became 22.1°.');
    await page.getByTestId('light-cer-reasoning').fill('At fixed frequency, the lower speed gives a shorter wavelength, so the wavefront turns and the ray changes direction.');
    await page.getByTestId('light-cer-save').click();
    await expect(page.getByText('Saved for outcome 7.3.2', { exact: false })).toBeVisible();
  });
});
