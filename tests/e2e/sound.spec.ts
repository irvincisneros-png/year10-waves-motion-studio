import { test, expect, type Locator, type Page } from '@playwright/test';
import { SOUND_ROUTES, tabKey } from './helpers';

async function pauseAndStep(page: Page, count: number) {
  const pause = page.getByTestId('sim-pause');
  if ((await pause.count()) > 0 && (await pause.getAttribute('aria-pressed')) === 'false') {
    await pause.click();
  }
  for (let index = 0; index < count; index++) await page.getByTestId('sim-step').click();
}

async function focusUntil(page: Page, browserName: string, target: Locator, max = 100) {
  const key = tabKey(browserName);
  for (let index = 0; index < max; index++) {
    if (await target.evaluate((element) => element === document.activeElement).catch(() => false)) return;
    await page.keyboard.press(key);
  }
  await expect(target).toBeFocused();
}

async function readDownload(page: Page, trigger: () => Promise<void>): Promise<string> {
  const pending = page.waitForEvent('download');
  await trigger();
  const download = await pending;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

async function installAudioProbe(page: Page, rejectResume = false, allowGlobalAudio = true) {
  await page.addInitScript(({ reject, allow }) => {
    if (allow) {
      localStorage.setItem(
        'wavemotion.settings.v1',
        JSON.stringify({ state: { audioEnabled: true }, version: 2 }),
      );
    }
    const probe = { constructed: 0, started: 0, closed: 0, targets: [] as number[] };
    class FakeParam {
      value = 0;
      setTargetAtTime(value: number) {
        this.value = value;
        probe.targets.push(value);
      }
    }
    class FakeContext {
      state: AudioContextState = 'suspended';
      currentTime = 0;
      destination = {};
      constructor() {
        probe.constructed += 1;
      }
      createGain() {
        return { gain: new FakeParam(), connect() {} };
      }
      createOscillator() {
        return {
          type: 'sine',
          frequency: new FakeParam(),
          connect() {},
          start() {
            probe.started += 1;
          },
          stop() {},
        };
      }
      async resume() {
        if (reject) throw new Error('denied');
        this.state = 'running';
      }
      async close() {
        probe.closed += 1;
        this.state = 'closed';
      }
    }
    const target = window as unknown as {
      AudioContext: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
      __audioProbe: typeof probe;
    };
    Object.defineProperty(target, 'AudioContext', { configurable: true, value: FakeContext });
    Object.defineProperty(target, 'webkitAudioContext', { configurable: true, value: FakeContext });
    target.__audioProbe = probe;
  }, { reject: rejectResume, allow: allowGlobalAudio });
}

test.describe('sound-lab routing and integration', () => {
  for (const route of SOUND_ROUTES) {
    test(`cold load + refresh works for ${route.path}`, async ({ page }) => {
      await page.goto(route.url);
      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
      await expect(page).toHaveTitle(route.title);
      await page.reload();
      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
    });
  }

  test('outcome gallery reaches the existing sound model and legacy phase routes remain functional', async ({ page }) => {
    await page.goto('/#/');
    const card = page.locator('.outcome-card', { hasText: '7.2.1' });
    await expect(card.locator('.outcome-card__status')).toHaveText('Existing model');
    await card.getByRole('link', { name: /Open existing model for outcome 7\.2\.1/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Compression & rarefaction' })).toBeVisible();
    const nav = page.getByRole('navigation', { name: 'Sound laboratory phases' });
    for (const [label, heading] of [
      ['Compression & rarefaction', 'Compression & rarefaction'],
      ['Pitch & loudness', 'Pitch & loudness'],
      ['Doppler effect', 'Doppler effect'],
      ['Check questions', 'Check questions'],
      ['Claim–evidence–reasoning', 'Explain'],
      ['Sound in the real world', 'Sound in the real world'],
    ] as const) {
      await nav.getByRole('link', { name: label }).click();
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    }
  });
});

test.describe('compression and rarefaction (7.2.1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/sound/compression');
    await pauseAndStep(page, 4);
  });

  test('frequency, medium and microphone controls keep one fixed physical window', async ({ page }) => {
    const micBefore = await page.getByTestId('microphone-probe').getAttribute('aria-valuetext');
    await page.getByTestId('source-vibration-slider').press('End');
    await expect(page.getByTestId('sound-frequency')).toHaveText('2000 Hz');
    await expect(page.getByTestId('sound-wavelength')).toHaveText('0.172 m');
    await expect(page.getByTestId('field-alt')).toContainText(/fixed 3\.12 m window shows 18\.2 wavelengths/i);
    expect(await page.getByTestId('microphone-probe').getAttribute('aria-valuetext')).toBe(micBefore);

    await page.getByTestId('medium-temp-select').selectOption('steel');
    await expect(page.getByTestId('sound-speed')).toHaveText('5960 m/s');
    await expect(page.getByTestId('sound-wavelength')).toHaveText('2.98 m');
    await expect(page.getByTestId('medium-source-note')).toContainText(/reviewed 2026-07-17/);
    await page.getByTestId('microphone-probe').press('End');
    await expect(page.getByTestId('microphone-probe')).toHaveAttribute('aria-valuetext', /3\.12 m/);
  });

  test('particle tags, energy marker and observation evidence all have observable effects', async ({ page }) => {
    await expect(page.getByTestId('tagged-table-body').locator('tr')).toHaveCount(1);
    await page.getByTestId('tag-P').check();
    await expect(page.getByTestId('tagged-table-body').locator('tr')).toHaveCount(2);
    await expect(page.getByTestId('net-P')).toContainText('≈ 0');
    await page.getByTestId('energy-marker-toggle').uncheck();
    await expect(page.getByTestId('field-alt')).toContainText('energy marker is hidden');

    await page.getByTestId('compression-notice-save').click();
    await expect(page.locator('#main-content').getByText('Write what you noticed before saving.')).toBeVisible();
    await page.getByTestId('compression-notice').fill('Compressions line up with pressure maxima; particles only oscillate locally.');
    await page.getByTestId('compression-notice-save').click();
    await expect(page.locator('#main-content').getByText(/Saved to your progress evidence/)).toBeVisible();
  });

  test('reset restores documented defaults and the shared toolbar controls operate', async ({ page }) => {
    await page.getByTestId('source-vibration-slider').press('End');
    await page.getByTestId('sim-presentation').click();
    await expect(page.locator('html')).toHaveAttribute('data-presentation', 'true');
    await page.keyboard.press('Escape');
    await expect(page.locator('html')).toHaveAttribute('data-presentation', 'false');
    await page.getByTestId('sim-reset').click();
    await expect(page.getByTestId('sound-frequency')).toHaveText('440 Hz');
    await expect(page.getByTestId('medium-temp-select')).toHaveValue('air-20');
    await expect(page.getByTestId('energy-marker-toggle')).toBeChecked();
  });
});

test.describe('pitch and loudness investigation (7.2.2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/sound/pitch-loudness');
  });

  test('frequency and output level remain independent and every visual control works without audio', async ({ page }) => {
    await page.getByTestId('frequency-slider').press('End');
    await expect(page.getByTestId('pitch-meter')).toContainText('8000 Hz');
    await expect(page.getByTestId('loudness-meter')).toContainText('20%');
    await page.getByTestId('amplitude-slider').press('End');
    await expect(page.getByTestId('pitch-meter')).toContainText('8000 Hz');
    await expect(page.getByTestId('loudness-meter')).toContainText('100%');

    await page.getByTestId('waveform-select').selectOption('square');
    await page.getByTestId('view-spectrum').check();
    await expect(page.getByTestId('spectrum').locator('tbody tr').nth(1)).toContainText('160000');
    await expect(page.getByTestId('spectrum').locator('tbody tr').nth(2)).toContainText('240000.333');
    await page.getByTestId('view-oscilloscope').check();
    await page.getByTestId('timescale-slider').press('End');
    await expect(page.getByTestId('timescale-slider')).toHaveAttribute('aria-valuetext', 'Window: 100 ms');
  });

  test('classroom visualiser makes frequency, amplitude and wavelength limits explicit', async ({ page }) => {
    await expect(page.getByTestId('live-sound-visualiser')).toBeVisible();
    await expect(page.getByTestId('live-frequency')).toContainText('440 Hz');
    await expect(page.getByTestId('live-amplitude')).toContainText('20%');
    await expect(page.getByTestId('live-wavelength')).toContainText('0.78 m');
    await expect(page.getByText(/does not measure wavelength/i)).toBeVisible();

    await page.getByTestId('frequency-slider').fill('880');
    await page.getByTestId('amplitude-slider').fill('60');
    await expect(page.getByTestId('live-frequency')).toContainText('880 Hz');
    await expect(page.getByTestId('live-amplitude')).toContainText('60%');
  });

  test('microphone denial falls back to a complete demo mode', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () => {
            throw new DOMException('Permission denied for test', 'NotAllowedError');
          },
        },
      });
    });
    await page.reload();
    await page.getByTestId('capture-microphone').check();
    await page.getByTestId('start-microphone').click();
    await expect(page.getByTestId('microphone-fallback')).toContainText(/Demo mode is active/i);
    await expect(page.getByTestId('capture-demo')).toBeChecked();
    await expect(page.getByTestId('live-waveform')).toBeVisible();
  });

  test('guitar connection holds string properties fixed and separates length from pluck strength', async ({ page }) => {
    await expect(page.getByTestId('guitar-connection')).toContainText(/tension and string thickness stay fixed/i);
    const initial = await page.getByTestId('guitar-connection').getByText(/Hz/).first().textContent();
    await page.getByTestId('guitar-length').press('Home');
    const shorter = await page.getByTestId('guitar-connection').getByText(/Hz/).first().textContent();
    expect(Number(shorter?.replace(/[^0-9.]/g, ''))).toBeGreaterThan(Number(initial?.replace(/[^0-9.]/g, '')));
    await page.getByTestId('guitar-pluck').press('End');
    await expect(page.getByTestId('guitar-connection')).toContainText(/larger amplitude.*louder sound/i);
    await page.getByTestId('pluck-string').click();
    await expect(page.getByTestId('guitar-waveform')).toContainText(/current amplitude/i);
    await expect(page.getByTestId('guitar-model').locator('.guitar-model__active-string')).toHaveClass(/is-ringing/);
  });

  test('duration and emission mode have complete visual-only effects and validation', async ({ page }) => {
    await page.getByTestId('duration-input').fill('');
    await page.getByTestId('play-pulse').click();
    await expect(page.getByTestId('duration-error')).toContainText('Enter a duration');
    await page.getByTestId('duration-input').fill('9');
    await page.getByTestId('play-pulse').click();
    await expect(page.getByTestId('duration-error')).toContainText('Capped at the 5 s ceiling');
    await expect(page.getByTestId('pulse-summary')).toContainText('5 s pulse');
    await page.getByTestId('emission-continuous').check();
    await expect(page.getByTestId('continuous-status')).toContainText('visual trace remains complete');
    await page.getByTestId('emission-pulse').check();
    await expect(page.getByTestId('play-pulse')).toBeVisible();
  });

  test('trials graph, exports, fair-test evidence and confirmed reset work', async ({ page }) => {
    await page.getByTestId('add-trial').click();
    await page.getByTestId('frequency-slider').fill('880');
    await page.getByTestId('add-trial').click();
    await page.getByTestId('frequency-slider').fill('440');
    await page.getByTestId('amplitude-slider').fill('40');
    await page.getByTestId('add-trial').click();
    await expect(page.getByTestId('sound-trial-body').locator('tr')).toHaveCount(3);
    await expect(page.getByTestId('trial-graph')).toBeVisible();
    await expect(page.getByTestId('fair-test-status')).toContainText('Fair-test evidence complete');

    const csv = await readDownload(page, () => page.getByTestId('export-csv').click());
    expect(csv).toContain('Frequency (Hz),Output level (%)');
    const json = JSON.parse(await readDownload(page, () => page.getByTestId('export-json').click())) as {
      schema: string;
      trials: unknown[];
    };
    expect(json.schema).toBe('wavemotion.sound-investigation');
    expect(json.trials).toHaveLength(3);

    await page.getByTestId('interpretation-save').click();
    await expect(page.getByText('Write your interpretation before saving.')).toBeVisible();
    await page.getByTestId('interpretation-input').fill('Frequency changed pitch; output level changed amplitude, not pitch.');
    await page.getByTestId('interpretation-save').click();
    await expect(page.getByText('Add a limitation and improvement before saving.')).toBeVisible();
    await page.getByTestId('limitation-input').fill('Relative level is not calibrated; use a calibrated sound meter in supervised practical work.');
    await page.getByTestId('interpretation-save').click();
    await expect(page.getByText(/Saved \(outcome 7\.2\.2\)/)).toBeVisible();

    page.once('dialog', (dialog) => void dialog.dismiss());
    await page.getByTestId('sim-reset').click();
    await expect(page.getByTestId('sound-trial-body').locator('tr')).toHaveCount(3);
    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByTestId('sim-reset').click();
    await expect(page.getByTestId('sound-trial-body')).toContainText('No trials yet');
  });
});

test.describe('Web Audio safety and fallbacks', () => {
  test('the header sound preference is a real master opt-out for activity audio', async ({ page }) => {
    await installAudioProbe(page, false, false);
    await page.goto('/#/sound/pitch-loudness');
    await expect(page.getByTestId('audio-unavailable-notice')).toContainText(
      'disabled in the header Settings',
    );

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByTestId('toggle-audio').check();
    await page.getByRole('button', { name: 'Close settings' }).click();
    await page.getByRole('button', { name: 'Acknowledge headphone safety warning' }).click();
    await page.getByTestId('enable-sound').click();
    await expect(page.getByTestId('sound-enabled-status')).toContainText('muted');

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByTestId('toggle-audio').uncheck();
    await expect(page.getByTestId('audio-unavailable-notice')).toContainText(
      'disabled in the header Settings',
    );
    const targets = await page.evaluate(
      () => (window as unknown as { __audioProbe: { targets: number[] } }).__audioProbe.targets,
    );
    expect(targets.at(-1)).toBe(0);
  });

  test('explicit acknowledgement then enable starts muted, capped, and visual-only can never unmute', async ({ page }) => {
    await installAudioProbe(page);
    await page.goto('/#/sound/pitch-loudness');
    expect(await page.evaluate(() => (window as unknown as { __audioProbe: { constructed: number } }).__audioProbe.constructed)).toBe(0);
    await page.getByRole('button', { name: 'Acknowledge headphone safety warning' }).click();
    await page.getByTestId('enable-sound').click();
    await expect(page.getByTestId('sound-enabled-status')).toContainText('muted');
    await page.getByTestId('mute-sound').click();
    await page.getByTestId('amplitude-slider').press('End');
    let targets = await page.evaluate(() => (window as unknown as { __audioProbe: { targets: number[] } }).__audioProbe.targets);
    expect(targets.at(-1)).toBeCloseTo(0.15, 8);

    await page.getByTestId('visual-only-toggle').check();
    await expect(page.getByTestId('mute-sound')).toBeDisabled();
    targets = await page.evaluate(() => (window as unknown as { __audioProbe: { targets: number[] } }).__audioProbe.targets);
    expect(targets.at(-1)).toBe(0);
    await page.getByTestId('play-pulse').click();
    const afterPulse = await page.evaluate(() => (window as unknown as { __audioProbe: { targets: number[] } }).__audioProbe.targets);
    expect(afterPulse.at(-1)).toBe(0);

    await page.goto('/#/sound/doppler');
    await expect(page.getByTestId('headphone-ack')).toHaveCount(0);
    await expect(page.getByTestId('enable-sound')).toBeVisible();
  });

  test('unsupported and denied audio both fall back to a complete visual-only activity', async ({ page }) => {
    await page.addInitScript(() => {
      Reflect.deleteProperty(window, 'AudioContext');
      Reflect.deleteProperty(window as unknown as { webkitAudioContext?: unknown }, 'webkitAudioContext');
    });
    await page.goto('/#/sound/pitch-loudness');
    await expect(page.getByTestId('audio-unavailable-notice')).toContainText('visual mode only');
    await expect(page.getByTestId('visual-only-toggle')).toBeChecked();
    await expect(page.getByTestId('visual-only-toggle')).toBeDisabled();
    await page.getByTestId('view-spectrum').check();
    await expect(page.getByTestId('spectrum')).toBeVisible();
  });

  test('resume denial is caught and changes the panel to visual-only without a page error', async ({ page }) => {
    await installAudioProbe(page, true);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/#/sound/doppler');
    await page.getByRole('button', { name: 'Acknowledge headphone safety warning' }).click();
    await page.getByTestId('enable-sound').click();
    await expect(page.getByTestId('audio-unavailable-notice')).toContainText('visual mode only');
    expect(errors).toEqual([]);
  });
});

test.describe('Doppler effect (7.2.3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/sound/doppler');
    await pauseAndStep(page, 1);
  });

  test('preset, velocity and view controls preserve source frequency and change only detected timing', async ({ page }) => {
    await expect(page.getByTestId('detected-frequency')).toHaveText(/^(—|500 Hz)$/);
    await expect(page.getByTestId('detected-interval')).toHaveText(
      /^(waiting for wavefronts|Detected period.*|\d+(?:\.\d+)? ms)$/,
    );
    const preset = page.getByTestId('sim-preset');
    await preset.selectOption('approach');
    await expect(page.getByTestId('source-velocity-slider')).toHaveAttribute('aria-valuetext', /\+25 m\/s.*moving right/);
    await pauseAndStep(page, 18);
    await expect(page.getByTestId('source-frequency')).toHaveText('500 Hz');
    await expect(page.getByTestId('detected-frequency')).not.toHaveText('500 Hz');

    const detected = await page.getByTestId('detected-frequency').textContent();
    await page.getByTestId('view-2d').check();
    await expect(page.getByText(/exactly the same physics as the 1D model/)).toBeVisible();
    expect(await page.getByTestId('detected-frequency').textContent()).toBe(detected);
    await page.getByTestId('source-velocity-slider').press('Home');
    await expect(preset).toHaveValue('custom');
    await expect(page.getByTestId('source-velocity-slider')).toHaveAttribute('aria-valuetext', /-120 m\/s.*moving left/);
  });

  test('all six presets resolve and approach/stationary/recession have the expected frequency direction', async ({ page }) => {
    const preset = page.getByTestId('sim-preset');
    for (const id of ['stationary', 'approach', 'pass', 'recede', 'moving-observer', 'both-moving']) {
      await preset.selectOption(id);
      await expect(preset).toHaveValue(id);
    }
    for (const [id, relation] of [
      ['stationary', 'equal'],
      ['approach', 'high'],
      ['recede', 'low'],
    ] as const) {
      await preset.selectOption(id);
      await pauseAndStep(page, 18);
      const numeric = Number((await page.getByTestId('detected-frequency').textContent())?.replace(/[^0-9.]/g, ''));
      if (relation === 'equal') expect(numeric).toBe(500);
      if (relation === 'high') expect(numeric).toBeGreaterThan(500);
      if (relation === 'low') expect(numeric).toBeLessThan(500);
    }
  });

  test('detected pitch stays opt-in and Doppler explanation evidence rejects empty text', async ({ page }) => {
    await expect(page.getByTestId('pitch-audio-toggle')).toBeDisabled();
    await expect(page.getByTestId('detected-graph')).toBeVisible();
    await page.getByTestId('doppler-notice-save').click();
    await expect(page.locator('#main-content').getByText('Write what you noticed before saving.')).toBeVisible();
    await page.getByTestId('doppler-notice').fill('Approaching wavefronts arrive at shorter intervals, so detected frequency rises.');
    await page.getByTestId('doppler-notice-save').click();
    await expect(page.locator('#main-content').getByText(/Saved to your progress evidence/)).toBeVisible();
    await page.getByTestId('sim-reset').click();
    await expect(page.getByTestId('sim-preset')).toHaveValue('stationary');
    await expect(page.getByTestId('view-1d')).toBeChecked();
  });
});

test.describe('Check, Explain, reduced motion and fallbacks', () => {
  test('empty Check input is unscored; hints progress; misconception feedback is specific', async ({ page }) => {
    await page.goto('/#/sound/check');
    await page.getByTestId('sound-check-submit').click();
    await expect(page.getByTestId('sound-check-feedback')).toContainText('Choose an answer');
    for (let level = 1; level <= 3; level++) {
      await page.getByTestId('sound-check-hint').click();
      await expect(page.getByTestId('sound-check-hints').locator('li')).toHaveCount(level);
    }
    await page.getByLabel(/They travel all the way from the source to your ear/).check();
    await page.getByTestId('sound-check-submit').click();
    await expect(page.getByTestId('sound-check-feedback')).toContainText(/only oscillates about its home position/i);
  });

  test('sound CER names each missing field and saves a complete explanation', async ({ page }) => {
    await page.goto('/#/sound/explain');
    await page.getByTestId('sound-cer-submit').click();
    await expect(page.getByTestId('sound-cer-error')).toContainText('Claim is missing');
    await page.getByTestId('sound-cer-claim').fill('Detected pitch changes because arrival timing changes.');
    await page.getByTestId('sound-cer-submit').click();
    await expect(page.getByTestId('sound-cer-error')).toContainText('Evidence is missing');
    await page.getByTestId('sound-cer-evidence').fill('The graph changed while source frequency stayed at 500 Hz.');
    await page.getByTestId('sound-cer-submit').click();
    await expect(page.getByTestId('sound-cer-error')).toContainText('Reasoning is missing');
    await page.getByTestId('sound-cer-reasoning').fill('Bunched wavefronts have shorter arrival intervals and therefore higher detected frequency.');
    await page.getByTestId('sound-cer-submit').click();
    await expect(page.getByTestId('sound-cer-saved')).toContainText('Saved to your evidence');
  });

  test('reduced motion steps without autoplay and Canvas absence keeps text alternatives', async ({ page }) => {
    await page.goto('/#/');
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByTestId('toggle-reduced-motion').check();
    await page.goto('/#/sound/compression');
    await expect(page.getByTestId('sim-pause')).toHaveCount(0);
    await expect(page.getByTestId('sim-time')).toHaveText('0 s');
    await page.waitForTimeout(400);
    await expect(page.getByTestId('sim-time')).toHaveText('0 s');
    for (let index = 0; index < 8; index++) await page.getByTestId('sim-step').click();
    await expect(page.getByTestId('sim-time')).not.toHaveText('0 s');

    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = () => null;
    });
    await page.reload();
    await expect(page.getByTestId('canvas-unsupported-notice')).toHaveCount(2);
    await expect(page.getByTestId('source-alt')).toBeVisible();
    await expect(page.getByTestId('field-alt')).toContainText('fixed');
  });

  test('sound controls are operable in a keyboard-only path', async ({ page, browserName }) => {
    await page.goto('/#/sound/pitch-loudness');
    const frequency = page.getByTestId('frequency-slider');
    await focusUntil(page, browserName, frequency);
    await page.keyboard.press('Home');
    await expect(frequency).toHaveAttribute('aria-valuetext', 'Frequency: 85 Hz');
    const addTrial = page.getByTestId('add-trial');
    await focusUntil(page, browserName, addTrial);
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('sound-trial-body').locator('tr')).toHaveCount(1);
    await page.goto('/#/sound/check');
    const option = page.getByTestId('sound-option-a');
    await focusUntil(page, browserName, option);
    await page.keyboard.press('Space');
    const submit = page.getByTestId('sound-check-submit');
    await focusUntil(page, browserName, submit);
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('sound-check-feedback')).toContainText('Correct');
  });
});
