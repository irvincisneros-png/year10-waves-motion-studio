import { describe, it, expect } from 'vitest';
import { createRng } from '../../../src/science/rng';
import {
  wavelengthOf,
  periodOfWave,
  displacement,
  netDisplacementOverCycles,
  displacementVsPosition,
  setAmplitude,
  setFrequency,
  summariseWave,
  type WaveParams,
} from '../../../src/science/waves';
import { MEASUREMENT_PRESETS } from '../../../src/science/constants';

/**
 * Science-engine invariant sweeps (TEST_PLAN §1, SCIENCE_REVIEW §20). Each
 * invariant runs ≥50 seeded pseudo-random cases plus explicit boundary cases.
 * The seed is fixed for reproducibility.
 */

const SEED = 0x5a17;
const CASES = 60;

function randomWave(rng: ReturnType<typeof createRng>): WaveParams {
  const preset = MEASUREMENT_PRESETS[Math.floor(rng.range(0, MEASUREMENT_PRESETS.length))];
  const [fMin, fMax] = preset.freqRangeHz;
  return {
    amplitude: rng.range(0, 1),
    frequency: rng.range(fMin, fMax),
    speed: preset.speedMps,
    phase: rng.range(0, Math.PI * 2),
  };
}

describe('invariant 20.1 — v = fλ holds', () => {
  it('speed ≈ frequency × wavelength within 1e-6 relative for every seeded case', () => {
    const rng = createRng(SEED);
    for (let i = 0; i < CASES; i++) {
      const p = randomWave(rng);
      const lambda = wavelengthOf(p);
      const predicted = p.frequency * lambda;
      expect(Math.abs(predicted - p.speed) / p.speed).toBeLessThan(1e-6);
    }
  });

  it('worked example: f = 2 Hz, λ = 0.75 m → v = 1.5 m/s', () => {
    const p: WaveParams = { amplitude: 0.5, frequency: 2, speed: 1.5 };
    expect(wavelengthOf(p)).toBeCloseTo(0.75, 9);
  });
});

describe('invariant 20.2 — tagged particle has ≈0 net displacement over whole cycles', () => {
  it('net displacement < 1% of amplitude after N = 1, 5, 20 whole periods', () => {
    const rng = createRng(SEED + 1);
    for (let i = 0; i < CASES; i++) {
      const p = randomWave(rng);
      const x = rng.range(0, 5);
      const t0 = rng.range(0, 3);
      for (const cycles of [1, 5, 20]) {
        const net = Math.abs(netDisplacementOverCycles(p, x, cycles, t0));
        expect(net).toBeLessThan(0.01 * Math.max(p.amplitude, 1e-9));
      }
    }
  });

  it('time-averaged displacement over one period ≈ 0 (particle oscillates about equilibrium)', () => {
    const p: WaveParams = { amplitude: 0.4, frequency: 2, speed: 343 };
    const T = periodOfWave(p);
    const N = 2000;
    let sum = 0;
    for (let i = 0; i < N; i++) sum += displacement(p, 1.3, (T * i) / N);
    expect(Math.abs(sum / N)).toBeLessThan(1e-3);
  });
});

describe('invariant 20.3 — amplitude change alone changes nothing but amplitude', () => {
  it('sweeping amplitude leaves frequency, speed, wavelength and period bit-for-bit unchanged', () => {
    const base: WaveParams = { amplitude: 0.5, frequency: 2, speed: 343 };
    const ref = summariseWave(base);
    for (const a of [0, 0.25, 0.5, 0.75, 1]) {
      const s = summariseWave(setAmplitude(base, a));
      expect(s.frequency).toBe(ref.frequency);
      expect(s.speed).toBe(ref.speed);
      expect(s.wavelength).toBe(ref.wavelength);
      expect(s.period).toBe(ref.period);
      expect(s.amplitude).toBe(a);
    }
  });
});

describe('invariant — source sets frequency, wavelength adjusts, speed fixed', () => {
  it('changing frequency changes λ but never v (medium sets speed)', () => {
    const base: WaveParams = { amplitude: 0.5, frequency: 2, speed: 343 };
    const changed = setFrequency(base, 8);
    expect(changed.speed).toBe(343);
    expect(wavelengthOf(changed)).toBeCloseTo(343 / 8, 9);
    // v = fλ still holds after the change.
    expect(Math.abs(changed.frequency * wavelengthOf(changed) - changed.speed)).toBeLessThan(1e-6);
  });
});

describe('λ vs 1/f is linear at fixed speed (outcome 7.1.6 investigation)', () => {
  it('λ = v·(1/f) — a straight line through the origin with slope v', () => {
    const v = 343;
    const invF: number[] = [];
    const lambdas: number[] = [];
    for (let f = 100; f <= 1000; f += 100) {
      const p: WaveParams = { amplitude: 0.5, frequency: f, speed: v };
      invF.push(1 / f);
      lambdas.push(wavelengthOf(p));
    }
    // λ / (1/f) is constant and equals v for every trial.
    for (let i = 0; i < invF.length; i++) {
      expect(lambdas[i] / invF[i]).toBeCloseTo(v, 6);
    }
  });
});

describe('invariant 20.15 — T = 1/f consistency', () => {
  it('|T·f − 1| < 1e-9 for every seeded case', () => {
    const rng = createRng(SEED + 3);
    for (let i = 0; i < CASES; i++) {
      const p = randomWave(rng);
      const T = periodOfWave(p);
      expect(Math.abs(T * p.frequency - 1)).toBeLessThan(1e-9);
    }
  });
});

describe('displacement–position snapshot repeats every wavelength', () => {
  it('a snapshot at fixed t repeats after one wavelength (crest-to-crest = λ)', () => {
    const p: WaveParams = { amplitude: 1, frequency: 2, speed: 343, phase: 0 };
    const lambda = wavelengthOf(p);
    const t = 0.37;
    // Sample two points one wavelength apart — displacement must match.
    expect(displacement(p, 0.9, t)).toBeCloseTo(displacement(p, 0.9 + lambda, t), 9);
  });

  it('produces the requested number of samples across the span', () => {
    const p: WaveParams = { amplitude: 1, frequency: 2, speed: 343 };
    expect(displacementVsPosition(p, 0, 5, 128, 0)).toHaveLength(128);
  });
});
