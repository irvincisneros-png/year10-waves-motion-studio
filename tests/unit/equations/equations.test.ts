import { describe, it, expect } from 'vitest';
import {
  solveForSpeed,
  solveForFrequency,
  solveForWavelength,
  periodOf,
  frequencyOfPeriod,
  tripleIsConsistent,
  checkNumericAnswer,
  parseNumericField,
} from '../../../src/science/equations';

/** TEST_PLAN §2 — rearrangement, division guards, tolerance, field parsing. */

describe('v = fλ solves for any one variable', () => {
  it('given {f, λ} → v', () => {
    const r = solveForSpeed(3, 500);
    expect(r.ok && r.value).toBe(1500);
  });
  it('given {v, f} → λ', () => {
    const r = solveForWavelength(1500, 3);
    expect(r.ok && r.value).toBe(500);
  });
  it('given {v, λ} → f', () => {
    const r = solveForFrequency(1500, 500);
    expect(r.ok && r.value).toBe(3);
  });
  it('textbook example f=440 Hz v=343 m/s → λ≈0.78 m', () => {
    const r = solveForWavelength(343, 440);
    expect(r.ok && r.value).toBeCloseTo(0.7795, 4);
  });
});

describe('division-by-zero is guarded (never Infinity/NaN)', () => {
  it('λ = v/f with f = 0 returns a specific error, not Infinity', () => {
    const r = solveForWavelength(1500, 0);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.code).toBe('zero-frequency');
    expect(!r.ok && r.message).toMatch(/0 Hz/);
  });
  it('f = v/λ with λ = 0 returns a specific error', () => {
    const r = solveForFrequency(1500, 0);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.code).toBe('zero-wavelength');
  });
  it('non-finite inputs are rejected', () => {
    expect(solveForSpeed(NaN, 1).ok).toBe(false);
    expect(solveForWavelength(1, Infinity).ok).toBe(false);
  });
});

describe('T = 1/f and f = 1/T', () => {
  it('T = 1/f', () => {
    const r = periodOf(2);
    expect(r.ok && r.value).toBe(0.5);
  });
  it('f = 1/T', () => {
    const r = frequencyOfPeriod(0.5);
    expect(r.ok && r.value).toBe(2);
  });
  it('T = 1/f guarded at f = 0', () => {
    expect(periodOf(0).ok).toBe(false);
  });
});

describe('triple consistency (v = fλ within tolerance)', () => {
  it('accepts a consistent triple', () => {
    expect(tripleIsConsistent(1500, 3, 500)).toBe(true);
  });
  it('rejects an inconsistent triple (false-positive guard)', () => {
    expect(tripleIsConsistent(1500, 2, 1)).toBe(false);
  });
  it('rejects a zero-speed triple rather than dividing by zero', () => {
    expect(tripleIsConsistent(0, 2, 1)).toBe(false);
  });
});

describe('answer checking tolerance (SCIENCE_REVIEW §3.5)', () => {
  it('accepts within ±1% of the exact value', () => {
    expect(checkNumericAnswer(0.78, 0.7795, {})).toBe(true);
  });
  it('accepts a legitimate 3-sig-fig rounding', () => {
    // exact 343.2, student rounds to 343
    expect(checkNumericAnswer(343, 343.2, {})).toBe(true);
  });
  it('rejects a clearly wrong value', () => {
    expect(checkNumericAnswer(0.5, 0.7795, {})).toBe(false);
  });
  it('rejects non-finite student input (false-positive guard)', () => {
    expect(checkNumericAnswer(NaN, 0.78, {})).toBe(false);
    expect(checkNumericAnswer(Infinity, 0.78, {})).toBe(false);
  });
  it('uses ±1 in the last sig fig when that is larger than 1%', () => {
    // exact 5 → last-fig step at 3 s.f. is 0.01; 1% is 0.05, so ±0.05 wins.
    expect(checkNumericAnswer(5.04, 5, {})).toBe(true);
    expect(checkNumericAnswer(5.2, 5, {})).toBe(false);
  });
});

describe('parseNumericField (calculator input integrity)', () => {
  const base = { label: 'frequency' };
  it('rejects empty input', () => {
    const r = parseNumericField('', base);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.message).toMatch(/Enter a frequency value/);
  });
  it('rejects non-numeric text and unit-laden strings', () => {
    for (const bad of ['abc', '5 metres', '½', '1,5', '3x']) {
      const r = parseNumericField(bad, base);
      expect(r.ok, `"${bad}" should be rejected`).toBe(false);
      expect(!r.ok && r.message).toMatch(/Enter a number/);
    }
  });
  it('rejects negative values with a specific message', () => {
    const r = parseNumericField('-10', base);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.message).toMatch(/cannot be negative/);
  });
  it('rejects 0 with a custom boundary message', () => {
    const r = parseNumericField('0', {
      label: 'frequency',
      zeroMessage: 'Frequency cannot be 0 Hz for a travelling wave.',
    });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.message).toMatch(/0 Hz for a travelling wave/);
  });
  it('requires a unit tag when requireUnit is set', () => {
    const r = parseNumericField('5', { label: 'speed', requireUnit: true, hasUnit: false });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.message).toMatch(/Select a unit/);
  });
  it('accepts a clean positive number', () => {
    const r = parseNumericField('440', base);
    expect(r.ok && r.value).toBe(440);
  });
  it('accepts scientific notation', () => {
    const r = parseNumericField('3e8', base);
    expect(r.ok && r.value).toBe(3e8);
  });
});
