import { describe, it, expect } from 'vitest';
import { outcomeMap, type Outcome } from '../../src/content/outcomes';

// Hardcoded expected code list — mirrors section 3 "Outcome coverage matrix"
// of YEAR_10_WAVES_MOTION_APP_PLAN.md (7.1.1–7.1.7, 7.2.1–7.2.6, 7.3.1–7.3.4,
// 7.4.1–7.4.7, 7.5.1).
const EXPECTED_CODES = [
  '7.1.1', '7.1.2', '7.1.3', '7.1.4', '7.1.5', '7.1.6', '7.1.7',
  '7.2.1', '7.2.2', '7.2.3', '7.2.4', '7.2.5', '7.2.6',
  '7.3.1', '7.3.2', '7.3.3', '7.3.4',
  '7.4.1', '7.4.2', '7.4.3', '7.4.4', '7.4.5', '7.4.6', '7.4.7',
  '7.5.1',
];

const VALID_STRANDS = ['waves', 'sound', 'light', 'motion', 'forces', 'society'];

describe('outcomeMap', () => {
  it('contains every plan-matrix code exactly once', () => {
    const keys = Object.keys(outcomeMap);
    expect(keys.length).toBe(EXPECTED_CODES.length);

    for (const code of EXPECTED_CODES) {
      const matches = keys.filter((k) => k === code);
      expect(matches.length, `expected exactly one entry for ${code}`).toBe(1);
      expect(outcomeMap[code]).toBeDefined();
    }
  });

  it('has no extra/unexpected codes', () => {
    const keys = Object.keys(outcomeMap).sort();
    expect(keys).toEqual([...EXPECTED_CODES].sort());
  });

  it('keys every entry by its own code', () => {
    for (const [key, outcome] of Object.entries(outcomeMap)) {
      expect(outcome.code).toBe(key);
    }
  });

  it('gives every outcome non-empty text', () => {
    for (const [code, outcome] of Object.entries(outcomeMap)) {
      expect(outcome.text.trim().length, `outcome ${code} has empty text`).toBeGreaterThan(0);
    }
  });

  it('gives every outcome a non-empty syllabusRef', () => {
    for (const [code, outcome] of Object.entries(outcomeMap)) {
      expect(outcome.syllabusRef.trim().length, `outcome ${code} has empty syllabusRef`).toBeGreaterThan(0);
    }
  });

  it('assigns every outcome a valid strand', () => {
    for (const [code, outcome] of Object.entries(outcomeMap)) {
      expect(VALID_STRANDS, `outcome ${code} has invalid strand "${outcome.strand}"`).toContain(outcome.strand);
    }
  });

  it('type-checks against the Outcome interface shape', () => {
    const sample: Outcome = outcomeMap['7.1.1'];
    expect(typeof sample.code).toBe('string');
    expect(typeof sample.syllabusRef).toBe('string');
    expect(typeof sample.text).toBe('string');
    expect(typeof sample.strand).toBe('string');
  });
});
