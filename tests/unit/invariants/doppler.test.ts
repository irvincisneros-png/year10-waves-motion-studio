import { describe, it, expect } from 'vitest';
import { createRng } from '../../../src/science/rng';
import {
  detectedFrequencyClosedForm,
  detectedFrequencyModel,
  detectedIntervalModel,
  detectedFrequencySeries,
  emissionTimes,
  arrivalTime,
  isSubsonic,
  DOPPLER_PRESETS,
  type DopplerConfig,
} from '../../../src/science/doppler';

/**
 * Doppler-engine invariants (TEST_PLAN §1, SCIENCE_REVIEW §12.3, §20.5). The
 * arrival-timing model must agree with the closed-form Doppler result; the
 * source frequency must never change; supersonic input must be rejected.
 */

const SEED = 0xd0;
const CASES = 60;

describe('invariant 20.5 — arrival-timing model matches the closed-form Doppler result', () => {
  it('detected frequency from arrival intervals ≈ f·(v−v_o)/(v−v_s) within 0.5% for seeded subsonic cases', () => {
    const rng = createRng(SEED);
    for (let i = 0; i < CASES; i++) {
      const v = rng.range(300, 360);
      const cfg: DopplerConfig = {
        sourceFreqHz: rng.range(200, 1200),
        soundSpeedMps: v,
        sourceVelMps: rng.range(-0.7 * v, 0.7 * v),
        observerVelMps: rng.range(-0.5 * v, 0.5 * v),
      };
      const closed = detectedFrequencyClosedForm(cfg);
      const model = detectedFrequencyModel(cfg);
      expect(closed.ok && model.ok).toBe(true);
      if (closed.ok && model.ok) {
        expect(Math.abs(model.value - closed.value) / closed.value).toBeLessThan(0.005);
      }
    }
  });

  it('worked numeric cases (f = 500 Hz, v = 343 m/s)', () => {
    const base = { sourceFreqHz: 500, soundSpeedMps: 343, observerVelMps: 0 };
    // Source approaching at +20 m/s → f' = 500·343/(343−20) = 531.0 Hz.
    const approach = detectedFrequencyClosedForm({ ...base, sourceVelMps: 20 });
    expect(approach.ok && approach.value).toBeCloseTo((500 * 343) / 323, 6);
    expect(approach.ok && approach.value).toBeGreaterThan(500);
    // Source receding at −20 m/s → f' = 500·343/(343+20) = 472.5 Hz.
    const recede = detectedFrequencyClosedForm({ ...base, sourceVelMps: -20 });
    expect(recede.ok && recede.value).toBeCloseTo((500 * 343) / 363, 6);
    expect(recede.ok && recede.value).toBeLessThan(500);
    // Observer moving towards a still source at 20 m/s (−x, leftward) →
    // f' = 500·(343+20)/343 = 529.2 Hz.
    const obs = detectedFrequencyClosedForm({ ...base, sourceVelMps: 0, observerVelMps: -20 });
    expect(obs.ok && obs.value).toBeCloseTo((500 * 363) / 343, 6);
    expect(obs.ok && obs.value).toBeGreaterThan(500);
  });

  it('stationary source and observer detect exactly the source frequency', () => {
    const r = detectedFrequencyClosedForm({
      sourceFreqHz: 440,
      soundSpeedMps: 343,
      sourceVelMps: 0,
      observerVelMps: 0,
    });
    expect(r.ok && r.value).toBe(440);
  });
});

describe('guardrails — source frequency fixed, subsonic only', () => {
  it('the detected-frequency series never implies the source frequency changed (it stays a config input)', () => {
    const cfg: DopplerConfig = { sourceFreqHz: 600, soundSpeedMps: 343, sourceVelMps: 30, observerVelMps: 0 };
    // Emission cadence is exactly 1/f regardless of motion.
    const times = emissionTimes(cfg.sourceFreqHz, 5);
    for (let n = 1; n < times.length; n++) {
      expect(times[n] - times[n - 1]).toBeCloseTo(1 / cfg.sourceFreqHz, 12);
    }
  });

  it('supersonic source or observer is rejected — never a faked number', () => {
    const v = 343;
    const superSource = detectedFrequencyClosedForm({
      sourceFreqHz: 500,
      soundSpeedMps: v,
      sourceVelMps: v + 10,
      observerVelMps: 0,
    });
    expect(superSource.ok).toBe(false);
    if (!superSource.ok) expect(superSource.code).toBe('supersonic');

    const superObs = detectedFrequencyModel({
      sourceFreqHz: 500,
      soundSpeedMps: v,
      sourceVelMps: 0,
      observerVelMps: -v - 5,
    });
    expect(superObs.ok).toBe(false);

    expect(isSubsonic({ sourceFreqHz: 500, soundSpeedMps: v, sourceVelMps: 340, observerVelMps: 0 })).toBe(true);
    expect(isSubsonic({ sourceFreqHz: 500, soundSpeedMps: v, sourceVelMps: 350, observerVelMps: 0 })).toBe(false);
  });

  it('rejects non-finite, non-positive speed and non-positive frequency', () => {
    expect(detectedFrequencyClosedForm({ sourceFreqHz: 0, soundSpeedMps: 343, sourceVelMps: 0, observerVelMps: 0 }).ok).toBe(false);
    expect(detectedFrequencyClosedForm({ sourceFreqHz: 500, soundSpeedMps: 0, sourceVelMps: 0, observerVelMps: 0 }).ok).toBe(false);
    expect(detectedFrequencyClosedForm({ sourceFreqHz: 500, soundSpeedMps: 343, sourceVelMps: Number.NaN, observerVelMps: 0 }).ok).toBe(false);
  });
});

describe('arrival timing and detected-frequency series', () => {
  it('arrival time is monotonic in emission time and never before emission', () => {
    const cfg: DopplerConfig = { sourceFreqHz: 400, soundSpeedMps: 343, sourceVelMps: 25, observerVelMps: 0 };
    let prev = -Infinity;
    for (const tau of emissionTimes(cfg.sourceFreqHz, 40)) {
      const a = arrivalTime(cfg, tau);
      expect(a).not.toBeNull();
      if (a !== null) {
        expect(a).toBeGreaterThanOrEqual(tau - 1e-9);
        expect(a).toBeGreaterThan(prev);
        prev = a;
      }
    }
  });

  it('approaching source gives a detected frequency above the source frequency throughout the approach', () => {
    const cfg: DopplerConfig = { sourceFreqHz: 500, soundSpeedMps: 343, sourceVelMps: 20, observerVelMps: 0 };
    const series = detectedFrequencySeries(cfg, 1.0);
    expect(series.length).toBeGreaterThan(5);
    // Observer at +40 m, source approaching at 20 m/s never reaches it within 1 s,
    // so every detected sample is a raised pitch.
    expect(series.every((s) => s.value > 500)).toBe(true);
  });

  it('a passing source produces a high-then-low detected frequency (arrival-timing drop)', () => {
    // Fast source crosses the observer at +40 m within the window.
    const cfg: DopplerConfig = { sourceFreqHz: 500, soundSpeedMps: 343, sourceVelMps: 34, observerVelMps: 0 };
    const series = detectedFrequencySeries(cfg, 3.0);
    expect(series.length).toBeGreaterThan(10);
    const first = series[0].value;
    const last = series[series.length - 1].value;
    expect(first).toBeGreaterThan(500); // approaching
    expect(last).toBeLessThan(500); // receding after passing
    expect(first).toBeGreaterThan(last);
  });
});

describe('presets', () => {
  it('every preset is subsonic and resolves to a finite detected frequency', () => {
    for (const preset of DOPPLER_PRESETS) {
      const cfg: DopplerConfig = {
        sourceFreqHz: 500,
        soundSpeedMps: 343,
        sourceVelMps: preset.sourceVelMps,
        observerVelMps: preset.observerVelMps,
      };
      expect(isSubsonic(cfg)).toBe(true);
      const r = detectedFrequencyClosedForm(cfg);
      expect(r.ok).toBe(true);
    }
  });

  it('approach raises pitch, recede lowers it, stationary is unchanged', () => {
    const f = (id: string) => {
      const p = DOPPLER_PRESETS.find((x) => x.id === id)!;
      const r = detectedFrequencyClosedForm({ sourceFreqHz: 500, soundSpeedMps: 343, sourceVelMps: p.sourceVelMps, observerVelMps: p.observerVelMps });
      return r.ok ? r.value : NaN;
    };
    expect(f('approach')).toBeGreaterThan(500);
    expect(f('recede')).toBeLessThan(500);
    expect(f('moving-observer')).toBeGreaterThan(500);
    expect(f('stationary')).toBe(500);
  });
});
