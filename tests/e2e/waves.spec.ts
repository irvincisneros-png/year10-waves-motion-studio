import { test, expect, type Page, type Locator } from '@playwright/test';
import { WAVES_ROUTES, tabKey } from './helpers';

/**
 * Stage 2 gate suite: the wave-foundations vertical slice. Exercises every
 * CONTROL_INVENTORY §2 control, the scientific invariants at the UI level,
 * false-positive regressions, exports, evidence capture, reduced-motion and
 * Canvas-unavailable fallbacks, and deep links.
 */

/** Pause the sim then advance exactly `n` fixed steps (1/30 s each at 1×). */
async function pauseAndStep(page: Page, n: number) {
  const pause = page.getByTestId('sim-pause');
  if ((await pause.count()) > 0) {
    const pressed = await pause.getAttribute('aria-pressed');
    if (pressed === 'false') await pause.click();
  }
  const step = page.getByTestId('sim-step');
  for (let remaining = n; remaining > 0; remaining -= 10) {
    const batch = Math.min(10, remaining);
    await step.evaluate((element, count) => {
      for (let index = 0; index < count; index += 1) {
        (element as HTMLButtonElement).click();
      }
    }, batch);
    await page.waitForTimeout(0);
  }
}

/** Tab (browser-appropriately) until the locator has focus. */
async function focusUntil(page: Page, browserName: string, target: Locator, max = 80) {
  const key = tabKey(browserName);
  for (let i = 0; i < max; i++) {
    if (await target.evaluate((el) => el === document.activeElement).catch(() => false)) {
      return;
    }
    await page.keyboard.press(key);
  }
  expect(
    await target.evaluate((el) => el === document.activeElement),
    `focus reached ${String(target)}`,
  ).toBe(true);
}

// ---------------------------------------------------------------- routing

test.describe('wave-lab routing and deep links', () => {
  for (const route of WAVES_ROUTES) {
    test(`cold load + refresh works for ${route.path}`, async ({ page }) => {
      await page.goto(route.url);
      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
      await expect(page).toHaveTitle(route.title);
      await page.reload();
      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
    });
  }

  test('phase navigation reaches every activity (warm client nav)', async ({ page }) => {
    await page.goto('/#/waves');
    const nav = page.getByRole('navigation', { name: 'Wave laboratory phases' });
    for (const [label, heading] of [
      ['Medium or vacuum?', 'Medium or vacuum?'],
      ['Energy transfer', 'Energy transfer'],
      ['Wave types', 'Wave types'],
      ['Measurement lab', 'Measurement lab'],
      ['Check questions', 'Check questions'],
      ['Claim–evidence–reasoning', 'Explain'],
      ['Waves in the real world', 'Waves in the real world'],
    ] as const) {
      await nav.getByRole('link', { name: label }).click();
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    }
  });

  test('measurement-lab preset deep link cold-loads with that preset', async ({ page }) => {
    await page.goto('/#/waves/measure?preset=em');
    await expect(page.getByTestId('measure-speed')).toHaveText(/3\.00 × 10⁸ m\/s/);
    await page.reload();
    await expect(page.getByTestId('measure-speed')).toHaveText(/3\.00 × 10⁸ m\/s/);
  });

  test('home gallery launches the dedicated 7.1.1 simulator', async ({
    page,
  }) => {
    await page.goto('/#/');
    const card = page.locator('.outcome-card', { hasText: '7.1.1' });
    await expect(card.getByText('New simulator')).toBeVisible();
    await card.getByRole('link', { name: /Launch simulator for outcome 7\.1\.1/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: /7\.1\.1/ })).toBeVisible();
  });
});

// ------------------------------------------------------- medium chambers

test.describe('medium or vacuum? (7.1.1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/waves/medium');
  });

  test('trigger fires all three chambers; vacuum transmits nothing; trigger disabled mid-pulse', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByTestId('toggle-reduced-motion').check();
    await page.getByTestId('trigger-disturbance').click();
    await expect(page.getByTestId('trigger-disturbance')).toBeDisabled();
    await pauseAndStep(page, 15); // 0.5 s
    await expect(page.getByTestId('chamber-mechanical-alt')).toContainText(/front is at/);
    await expect(page.getByTestId('chamber-vacuum-alt')).toContainText(/nothing crosses/i);
    await expect(page.getByTestId('chamber-em-alt')).toContainText(/EM disturbance/);
    // Run the pulse out of the chamber: at ~3.35 m/s it needs ~3.5 s (105 steps).
    await pauseAndStep(page, 115);
    await expect(page.getByTestId('trigger-disturbance')).toBeEnabled();
    await expect(page.getByTestId('chamber-mechanical-alt')).toContainText(
      /energy moved, matter did not/i,
    );
  });

  test('amplitude slider changes nothing but amplitude (invariant 20.3)', async ({ page }) => {
    const speedBefore = await page.getByTestId('mech-speed').textContent();
    const freqBefore = await page.getByTestId('mech-frequency').textContent();
    const amp = page.getByTestId('amplitude-slider');
    await amp.focus();
    await amp.press('PageUp');
    await amp.press('ArrowRight');
    await expect(amp).not.toHaveValue('40'); // amplitude itself changed
    expect(await page.getByTestId('mech-speed').textContent()).toBe(speedBefore);
    expect(await page.getByTestId('mech-frequency').textContent()).toBe(freqBefore);
  });

  test('frequency slider clamps to 0.1–10 Hz via keyboard bounds', async ({ page }) => {
    const freq = page.getByTestId('frequency-slider');
    await freq.focus();
    await freq.press('End');
    await expect(freq).toHaveValue('10');
    await expect(page.getByTestId('mech-frequency')).toHaveText('10 Hz');
    await freq.press('Home');
    await expect(freq).toHaveValue('0.1');
    await expect(page.getByTestId('mech-frequency')).toHaveText('0.1 Hz');
  });

  test('coupling changes propagation speed; density changes it inversely', async ({ page }) => {
    const speedAt = async () => (await page.getByTestId('mech-speed').textContent()) ?? '';
    const before = await speedAt();
    const coupling = page.getByTestId('coupling-slider');
    await coupling.focus();
    await coupling.press('End');
    const afterCoupling = await speedAt();
    expect(afterCoupling).not.toBe(before);
    const density = page.getByTestId('density-slider');
    await density.focus();
    await density.press('End');
    const afterDensity = await speedAt();
    expect(afterDensity).not.toBe(afterCoupling);
  });

  test('medium type, source mode, trails and energy-marker controls all operate', async ({
    page,
  }) => {
    await page.getByRole('radio', { name: 'Spring/rope model' }).check();
    await expect(page.getByRole('radio', { name: 'Spring/rope model' })).toBeChecked();
    await page.getByRole('radio', { name: 'Continuous' }).check();
    await expect(page.getByRole('radio', { name: 'Continuous' })).toBeChecked();
    const trails = page.getByTestId('trails-toggle');
    await trails.check();
    await expect(trails).toBeChecked();
    const marker = page.getByTestId('energy-marker-toggle');
    await expect(marker).toBeChecked(); // default ON — energy transport is the point
    await marker.uncheck();
    await expect(marker).not.toBeChecked();
    // Guardrail text present regardless of toggle state.
    await expect(page.getByText('Energy travels; particles do not.')).toBeVisible();
  });

  test('slow motion scales the step size without touching physics readouts', async ({ page }) => {
    await page.getByRole('radio', { name: 'Half speed' }).check();
    await pauseAndStep(page, 3); // 3 × (1/30 × 0.5) = 0.05 s
    await expect(page.getByTestId('sim-time')).toHaveText('0.05 s');
    await expect(page.getByTestId('mech-frequency')).toHaveText('1 Hz');
  });

  test('reset returns every control to its documented default', async ({ page }) => {
    const freq = page.getByTestId('frequency-slider');
    await freq.focus();
    await freq.press('End');
    await page.getByTestId('trails-toggle').check();
    await page.getByTestId('trigger-disturbance').click();
    await page.getByRole('button', { name: 'Reset medium comparison' }).click();
    await expect(freq).toHaveValue('1');
    await expect(page.getByTestId('trails-toggle')).not.toBeChecked();
    await expect(page.getByTestId('sim-time')).toHaveText('0 s');
    await expect(page.getByTestId('trigger-disturbance')).toBeEnabled();
  });

  test('presentation mode toggles on and Escape exits from anywhere', async ({ page }) => {
    const btn = page.getByTestId('sim-presentation');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-presentation', 'true');
    await page.locator('body').press('Escape');
    await expect(page.locator('html')).toHaveAttribute('data-presentation', 'false');
  });

  test('observation capture rejects empty text and saves real text as evidence', async ({
    page,
  }) => {
    await page.getByTestId('medium-notice-save').click();
    await expect(
      page.locator('.notice-capture__status', {
        hasText: 'Write what you noticed before saving.',
      }),
    ).toBeVisible();
    await page
      .getByTestId('medium-notice')
      .fill('Only the mechanical and EM chambers transmitted; the vacuum did not.');
    await page.getByTestId('medium-notice-save').click();
    await expect(page.getByText(/Saved to your progress evidence/)).toBeVisible();
    // Evidence lands in the progress store.
    await page.goto('/#/progress');
    const row = page.getByRole('row').filter({ hasText: '7.1.1' });
    await expect(row.getByText('Developing')).toBeVisible();
    await expect(page.getByText(/1 evidence entry recorded/)).toBeVisible();
  });
});

// ------------------------------------------------------- energy transfer

test.describe('energy transfer (7.1.2)', () => {
  test('tagged particles show ≈0 net displacement after the pulse crosses', async ({ page }) => {
    await page.goto('/#/waves/energy');
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByTestId('toggle-reduced-motion').check();
    await page.getByTestId('tag-B').check();
    await expect(page.getByTestId('tag-B')).toBeChecked();
    await page.getByTestId('send-pulse').click();
    await expect(page.getByTestId('send-pulse')).toBeDisabled();
    await expect(page.getByTestId('net-D')).toContainText('pulse still crossing');
    // Pulse needs (10 m + 3×0.7 m)/2.5 m/s ≈ 4.9 s → 150 steps.
    await pauseAndStep(page, 155);
    await expect(page.getByTestId('send-pulse')).toBeEnabled();
    await expect(page.getByTestId('net-D')).toContainText('≈ 0');
    await expect(page.getByTestId('net-B')).toContainText('≈ 0');
  });

  test('untagging removes a particle row; empty tag set shows guidance', async ({ page }) => {
    await page.goto('/#/waves/energy');
    await page.getByTestId('tag-D').uncheck();
    await expect(page.getByText('No particles tagged — tick at least one above.')).toBeVisible();
  });
});

// ------------------------------------------------------------ wave types

test.describe('wave types (7.1.3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/waves/types');
  });

  test('orientation toggle switches the displacement-direction description', async ({ page }) => {
    await expect(page.getByTestId('orientation-description')).toContainText(/perpendicular/);
    await page.getByTestId('orientation-longitudinal').check();
    await expect(page.getByTestId('orientation-description')).toContainText(/parallel/);
  });

  test('point probe is keyboard-operable and reports position, displacement and time', async ({
    page,
  }) => {
    const probe = page.getByTestId('point-probe');
    await probe.focus();
    await probe.press('Home');
    await expect(page.getByTestId('probe-readout')).toContainText('x = 0 m');
    await probe.press('End');
    await expect(page.getByTestId('probe-readout')).toContainText('x = 6 m');
    await expect(page.getByTestId('probe-readout')).toContainText('displacement =');
    await expect(page.getByTestId('probe-readout')).toContainText('t =');
  });

  test('mark-period accepts two equivalent points and rejects mismatched ones', async ({
    page,
  }) => {
    // Pause at t=0, mark, advance exactly one period (T = 1/1.5 s = 20 steps), mark.
    await pauseAndStep(page, 0);
    await page.getByTestId('mark-period').click();
    await pauseAndStep(page, 20);
    await page.getByTestId('mark-period').click();
    await expect(page.getByTestId('period-readout')).toContainText(/Measured period: 0\.66\d? s/);
    await expect(page.getByTestId('period-readout')).toContainText('expected 0.667 s');
    // Mismatch: mark, advance half a period, mark.
    await page.getByTestId('mark-period').click();
    await pauseAndStep(page, 10);
    await page.getByTestId('mark-period').click();
    await expect(page.getByTestId('period-readout')).toContainText(
      'Not a full period — mark two crests or two troughs.',
    );
  });

  test('each of the five label toggles independently shows/hides its label', async ({ page }) => {
    for (const label of ['crest', 'trough', 'equilibrium', 'amplitude', 'wavelength'] as const) {
      const toggle = page.getByTestId(`label-toggle-${label}`);
      await expect(toggle).toBeChecked();
      await toggle.uncheck();
      if (label === 'equilibrium') {
        await expect(page.locator('[data-testid="wave-anatomy"]')).not.toContainText('equilibrium');
      } else {
        await expect(page.locator(`[data-testid="label-${label}"]`)).toHaveCount(0);
      }
      await toggle.check();
      if (label !== 'equilibrium') {
        await expect(page.locator(`[data-testid="label-${label}"]`)).toHaveCount(1);
      }
    }
  });

  test('representation trap: misconception answer is ALWAYS marked incorrect (false-positive regression)', async ({
    page,
  }) => {
    await page.getByTestId('trap-yes').click();
    const feedback = page.getByTestId('trap-feedback');
    await expect(feedback).toContainText('Not correct');
    await expect(feedback).toContainText(
      /represents.*pressure\/displacement versus position or time, not the physical path/,
    );
    // The correct answer gets confirming feedback + evidence.
    await page.getByTestId('trap-no').click();
    await expect(page.getByTestId('trap-feedback')).toContainText('Correct');
  });
});

// -------------------------------------------------------- measurement lab

test.describe('measurement lab (7.1.5, 7.1.6)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('wave-practical-test-started')) {
        localStorage.removeItem('wavemotion.wave-practical.v2');
        sessionStorage.setItem('wave-practical-test-started', 'true');
      }
    });
    await page.goto('/#/waves/measure');
  });

  async function guidedTrial(page: Page) {
    await page.getByTestId('place-ruler').click();
    await page.getByTestId('add-trial').click();
    await expect(page.getByTestId('trial-feedback')).toContainText('Valid');
  }

  async function setRange(page: Page, testId: string, value: number) {
    await page.getByTestId(testId).evaluate((element, next) => {
      const input = element as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(input, String(next));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
  }

  async function completeData(page: Page) {
    await guidedTrial(page); // f = 2 Hz
    await setRange(page, 'measure-frequency-slider', 1);
    await guidedTrial(page);
    await setRange(page, 'measure-frequency-slider', 4);
    await guidedTrial(page);
    await page.getByTestId('series-amplitude').click();
    await setRange(page, 'measure-amplitude-slider', 30);
    await guidedTrial(page);
    await setRange(page, 'measure-amplitude-slider', 90);
    await guidedTrial(page);
  }

  async function completeWriting(page: Page) {
    await page.getByTestId('wave-hypothesis').fill(
      'Increasing frequency will shorten wavelength, while amplitude will not change wave speed.',
    );
    await page.getByTestId('analysis-relationship').fill(
      'As frequency increased from 1 Hz to 4 Hz, wavelength became shorter, showing an inverse relationship.',
    );
    await page.getByTestId('analysis-speed').fill(
      'The calculated speed stayed the same because the rope medium conditions were kept constant.',
    );
    await page.getByTestId('analysis-amplitude').fill(
      'Changing amplitude did not change speed; speed stayed constant in the same rope medium.',
    );
    await page.getByTestId('analysis-limitation').fill(
      'The simulator uses an ideal lossless rope, so real waves would lose energy through damping.',
    );
    await page.getByTestId('check-analysis').click();
  }

  test('preset selection re-clamps frequency and locks the medium after the first valid trial', async ({ page }) => {
    await page.getByTestId('sim-preset').selectOption('em');
    await expect(page.getByTestId('measure-speed')).toHaveText(/3\.00 × 10⁸ m\/s/);
    await expect(page.getByTestId('measure-frequency')).toHaveText(/1\.00 × 10⁸ Hz/);
    await page.getByTestId('sim-preset').selectOption('sound');
    await expect(page.getByTestId('measure-speed')).toHaveText('343 m/s');
    await expect(page.getByTestId('measure-frequency')).toHaveText('440 Hz');
    await guidedTrial(page);
    await expect(page.getByTestId('sim-preset')).toBeDisabled();
    await expect(page.getByText(/Locked to Sound in air/)).toBeVisible();
  });

  test('rejects an arbitrary ruler span and accepts a crest-to-crest measurement', async ({ page }) => {
    const ruler = page.getByTestId('ruler-tool');
    await ruler.focus();
    await ruler.press('End'); // 8 m is four wavelengths, not one
    await expect(page.getByTestId('ruler-span')).toContainText('8 m');
    await page.getByTestId('add-trial').click();
    await expect(page.getByTestId('trial-feedback')).toContainText(/from one wavelength/);
    await expect(page.locator('.investigation-screen-only').getByTestId('trial-table-body').locator('tr')).toHaveCount(1);
    await guidedTrial(page);
    const row = page.locator('.investigation-screen-only').getByTestId('trial-table-body').locator('tr');
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('2');
    await expect(row).toContainText('4');
  });

  test('records three distinct frequency trials, calculates speed, and plots λ against 1/f', async ({ page }) => {
    await guidedTrial(page);
    await setRange(page, 'measure-frequency-slider', 1);
    await guidedTrial(page);
    await setRange(page, 'measure-frequency-slider', 4);
    await guidedTrial(page);
    const body = page.locator('.investigation-screen-only').getByTestId('trial-table-body');
    await expect(body.locator('tr')).toHaveCount(3);
    for (const row of await body.locator('tr').all()) await expect(row).toContainText('4');
    const graph = page.getByTestId('lambda-graph');
    await expect(graph).toBeVisible();
    await expect(graph).toContainText('1/frequency (s)');
    await expect(graph.locator('table caption')).toContainText('Data table');
  });

  test('amplitude investigation locks frequency and shows speed is unchanged', async ({ page }) => {
    await page.getByTestId('series-amplitude').click();
    await expect(page.getByTestId('measure-frequency-slider')).toBeDisabled();
    await expect(page.getByTestId('measure-amplitude-slider')).toBeEnabled();
    await setRange(page, 'measure-amplitude-slider', 20);
    await guidedTrial(page);
    await setRange(page, 'measure-amplitude-slider', 100);
    await guidedTrial(page);
    const rows = page.locator('.investigation-screen-only').getByTestId('trial-table-body').locator('tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('20');
    await expect(rows.nth(1)).toContainText('100');
    await expect(rows.nth(0)).toContainText('4');
    await expect(rows.nth(1)).toContainText('4');
  });

  test('completed responses unlock a print-ready report containing all student work', async ({ page }) => {
    await completeData(page);
    await completeWriting(page);
    await expect(page.getByTestId('analysis-feedback')).toContainText('required scientific ideas');
    await page.getByTestId('student-name').fill('Alex Student');
    const print = page.getByTestId('wave-investigation-print');
    await expect(print).toBeEnabled();
    const report = page.getByTestId('wave-report');
    await expect(report).toContainText('Alex Student');
    await expect(report).toContainText('inverse relationship');
    await expect(report.locator('tbody tr')).toHaveCount(5);
    await page.evaluate(() => {
      (window as Window & { printCalled?: boolean }).printCalled = false;
      window.print = () => { (window as Window & { printCalled?: boolean }).printCalled = true; };
    });
    await print.click();
    expect(await page.evaluate(() => (window as Window & { printCalled?: boolean }).printCalled)).toBe(true);
  });

  test('draft survives reload and print media contains only the clean report', async ({ page }) => {
    await guidedTrial(page);
    await page.getByTestId('wave-hypothesis').fill('Frequency should change wavelength but not the fixed medium wave speed.');
    await page.getByTestId('student-name').fill('Sam Learner');
    await page.waitForFunction(() => localStorage.getItem('wavemotion.wave-practical.v2')?.includes('Sam Learner'));
    await page.reload();
    await expect(page.getByTestId('student-name')).toHaveValue('Sam Learner');
    await expect(page.getByTestId('wave-hypothesis')).toContainText('Frequency should change wavelength');
    await expect(page.locator('.investigation-screen-only').getByTestId('trial-table-body').locator('tr')).toHaveCount(1);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.shell__header')).toBeHidden();
    await expect(page.locator('.investigation-screen-only')).toBeHidden();
    await expect(page.getByTestId('wave-report')).toBeVisible();
    await expect(page.getByTestId('wave-report')).toContainText('Sam Learner');
  });
});

// ------------------------------------------------------------- calculator

test.describe('v = fλ calculator validation (false-positive regressions)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/waves/measure');
  });

  test('rejects fewer than two values', async ({ page }) => {
    await page.getByTestId('calc-submit').click();
    await expect(page.getByTestId('calc-result')).toContainText('Enter at least two values.');
  });

  test('computes λ from v and f (worked example 343/440)', async ({ page }) => {
    await page.getByTestId('calc-v').fill('343');
    await page.getByTestId('calc-f').fill('440');
    await page.getByTestId('calc-f-unit').selectOption('Hz');
    await page.getByTestId('calc-submit').click();
    await expect(page.getByTestId('calc-result')).toContainText('λ = 0.78 m');
  });

  test('rejects a missing unit tag ("Select a unit before submitting")', async ({ page }) => {
    await page.getByTestId('calc-v').fill('343');
    await page.getByTestId('calc-f').fill('440'); // no unit chosen
    await page.getByTestId('calc-submit').click();
    await expect(page.getByTestId('calc-f-error')).toHaveText('Select a unit before submitting.');
  });

  test('rejects non-numeric, negative, and zero-frequency input with specific messages', async ({
    page,
  }) => {
    await page.getByTestId('calc-v').fill('fast');
    await page.getByTestId('calc-f').fill('-10');
    await page.getByTestId('calc-f-unit').selectOption('Hz');
    await page.getByTestId('calc-submit').click();
    await expect(page.getByTestId('calc-v-error')).toHaveText('Enter a number.');
    await expect(page.getByTestId('calc-f-error')).toHaveText('Frequency cannot be negative.');
    await page.getByTestId('calc-v').fill('343');
    await page.getByTestId('calc-f').fill('0');
    await page.getByTestId('calc-submit').click();
    await expect(page.getByTestId('calc-f-error')).toHaveText(
      'Frequency cannot be 0 Hz for a travelling wave.',
    );
  });

  test('flags an internally inconsistent v, f, λ triple — never accepts it', async ({ page }) => {
    await page.getByTestId('calc-v').fill('1500');
    await page.getByTestId('calc-f').fill('2');
    await page.getByTestId('calc-f-unit').selectOption('Hz');
    await page.getByTestId('calc-lambda').fill('1');
    await page.getByTestId('calc-lambda-unit').selectOption('m');
    await page.getByTestId('calc-submit').click();
    await expect(page.getByTestId('calc-result')).toContainText(
      "These three values don't satisfy v = fλ — check your working.",
    );
    // A consistent triple (including a unit conversion: 50 cm = 0.5 m) passes.
    await page.getByTestId('calc-v').fill('1');
    await page.getByTestId('calc-f').fill('2');
    await page.getByTestId('calc-lambda').fill('50');
    await page.getByTestId('calc-lambda-unit').selectOption('cm');
    await page.getByTestId('calc-submit').click();
    await expect(page.getByTestId('calc-result')).toContainText('These values satisfy v = fλ.');
  });
});

// ------------------------------------------------------------ check phase

test.describe('check questions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/waves/check');
  });

  test('empty submission is never scored; hints are progressive; wrong answers get specific feedback', async ({
    page,
  }) => {
    await page.getByTestId('check-submit').click();
    await expect(page.getByTestId('check-feedback')).toContainText('Choose an answer.');
    await page.getByTestId('check-hint').click();
    await expect(page.getByTestId('check-hints').locator('li')).toHaveCount(1);
    await page.getByTestId('check-hint').click();
    await expect(page.getByTestId('check-hints').locator('li')).toHaveCount(2);
    await page.getByTestId('check-hint').click();
    await expect(page.getByTestId('check-hints').locator('li')).toHaveCount(3);
    // The "space is empty" misconception distractor is scored incorrect with
    // its explained-distractor feedback.
    await page.getByTestId('option-b').check();
    await page.getByTestId('check-submit').click();
    await expect(page.getByTestId('check-feedback')).toContainText('Not correct');
    await expect(page.getByTestId('check-feedback')).toContainText(
      /EM waves do not need a medium/,
    );
    await expect(page.getByTestId('check-next')).toBeVisible();
  });

  test('numeric question rejects malformed input and accepts the rounded correct value', async ({
    page,
  }) => {
    // Walk to the first numeric question (wq-716-lambda, index 5).
    for (let i = 0; i < 5; i++) {
      const mcqOption = page.locator('.question-option input').first();
      await mcqOption.check();
      await page.getByTestId('check-submit').click();
      await page.getByTestId('check-next').click();
    }
    await expect(page.getByTestId('check-prompt')).toContainText('Calculate its wavelength');
    await page.getByTestId('check-numeric-input').fill('abc');
    await page.getByTestId('check-submit').click();
    await expect(page.getByTestId('check-feedback')).toContainText('Enter a number.');
    // Invalid input does not lock the question — fix and resubmit.
    await page.getByTestId('check-numeric-input').fill('0.780');
    await page.getByTestId('check-submit').click();
    await expect(page.getByTestId('check-feedback')).toContainText('Correct');
  });

  test('unit-selection question refuses the right number with the wrong unit', async ({ page }) => {
    for (let i = 0; i < 7; i++) {
      const input = page.getByTestId('check-numeric-input');
      if ((await input.count()) > 0 && (await input.isVisible())) {
        // numeric questions 6+7: answer correctly to advance
        const prompt = (await page.getByTestId('check-prompt').textContent()) ?? '';
        await input.fill(prompt.includes('wavelength') ? '0.78' : '3');
        await page.getByTestId('check-submit').click();
      } else {
        await page.locator('.question-option input').first().check();
        await page.getByTestId('check-submit').click();
      }
      await page.getByTestId('check-next').click();
    }
    await expect(page.getByTestId('check-prompt')).toContainText('FM radio');
    await page.getByTestId('check-numeric-input').fill('100');
    await page.getByTestId('check-unit-select').selectOption('kHz');
    await page.getByTestId('check-submit').click();
    await expect(page.getByTestId('check-feedback')).toContainText('check the unit');
    await expect(page.getByTestId('check-feedback')).not.toContainText(/^Correct/);
  });
});

// -------------------------------------------------------------- explain

test.describe('explain (CER scaffold)', () => {
  test('names the specific missing part and saves a complete argument as evidence', async ({
    page,
  }) => {
    await page.goto('/#/waves/explain');
    await page.getByTestId('cer-claim').fill('Sound cannot cross a vacuum; light can.');
    await page.getByTestId('cer-submit').click();
    await expect(page.getByTestId('cer-error')).toHaveText(
      'Evidence is missing — fill it in before submitting.',
    );
    await page.getByTestId('cer-evidence').fill('The vacuum chamber transmitted nothing.');
    await page.getByTestId('cer-submit').click();
    await expect(page.getByTestId('cer-error')).toHaveText(
      'Reasoning is missing — fill it in before submitting.',
    );
    await page
      .getByTestId('cer-reasoning')
      .fill('Mechanical waves need medium particles to pass energy on; EM waves do not.');
    await page.getByTestId('cer-submit').click();
    await expect(page.getByTestId('cer-saved')).toContainText('Saved to your evidence');
    await page.goto('/#/progress');
    await expect(page.getByText(/1 evidence entry recorded/)).toBeVisible();
  });
});

// ------------------------------------------------- reduced motion + fallbacks

test.describe('reduced motion and degraded capability', () => {
  test('reduced-motion mode never autoplays; step buttons advance frames', async ({ page }) => {
    await page.goto('/#/');
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByTestId('toggle-reduced-motion').check();
    await page.goto('/#/waves/types');
    // No pause control in reduced-motion mode; the step button is always live.
    await expect(page.getByTestId('sim-pause')).toHaveCount(0);
    await expect(page.getByTestId('sim-step')).toBeEnabled();
    await expect(page.getByTestId('sim-time')).toHaveText('0 s');
    await page.waitForTimeout(600);
    await expect(page.getByTestId('sim-time')).toHaveText('0 s'); // no autoplay
    await page.getByTestId('sim-step').click();
    await page.getByTestId('sim-step').click();
    await page.getByTestId('sim-step').click();
    await expect(page.getByTestId('sim-time')).toHaveText('0.1 s');
  });

  test('Canvas unavailable: chambers fall back to the text alternative with a notice', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (HTMLCanvasElement.prototype as any).getContext = () => null;
    });
    await page.goto('/#/waves/medium');
    await expect(page.getByTestId('canvas-unsupported-notice').first()).toBeVisible();
    await expect(page.getByTestId('canvas-unsupported-notice')).toHaveCount(3);
    // The alternatives still carry the full state and controls still work.
    await page.getByTestId('trigger-disturbance').click();
    await pauseAndStep(page, 10);
    await expect(page.getByTestId('chamber-mechanical-alt')).toContainText(/front is at/);
    await expect(page.getByTestId('chamber-vacuum-alt')).toContainText(/nothing crosses/i);
  });

  test('low-graphics mode never changes the physics readouts', async ({ page }) => {
    await page.goto('/#/waves/medium');
    const speed = await page.getByTestId('mech-speed').textContent();
    const freq = await page.getByTestId('mech-frequency').textContent();
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByTestId('toggle-low-graphics').check();
    expect(await page.getByTestId('mech-speed').textContent()).toBe(speed);
    expect(await page.getByTestId('mech-frequency').textContent()).toBe(freq);
  });
});

// --------------------------------------------------- keyboard-only walkthrough

test.describe('keyboard-only walkthrough', () => {
  test('operate the lab, record a valid trial, and answer a check question with keys alone', async ({
    page,
    browserName,
  }) => {
    await page.goto('/#/waves/measure');

    // 1. Operate the frequency slider by keyboard.
    const freq = page.getByTestId('measure-frequency-slider');
    await focusUntil(page, browserName, freq);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('measure-frequency')).toHaveText('2.1 Hz');

    // 2. Use the guided crest-to-crest measurement by keyboard.
    const placeRuler = page.getByTestId('place-ruler');
    await focusUntil(page, browserName, placeRuler);
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('ruler-span')).toContainText(/1\.9/);

    // 3. Record the trial by keyboard.
    const addTrial = page.getByTestId('add-trial');
    await focusUntil(page, browserName, addTrial);
    await page.keyboard.press('Enter');
    await expect(page.locator('.investigation-screen-only').getByTestId('trial-table-body').locator('tr')).toHaveCount(1);
    await expect(page.getByTestId('trial-feedback')).toContainText('Valid');

    // 4. Answer a check question by keyboard.
    await page.goto('/#/waves/check');
    const firstOption = page.getByTestId('option-a');
    await focusUntil(page, browserName, firstOption);
    await page.keyboard.press('Space');
    await expect(firstOption).toBeChecked();
    const submit = page.getByTestId('check-submit');
    await focusUntil(page, browserName, submit);
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('check-feedback')).toContainText('Correct');
  });
});
