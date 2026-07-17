import { describe, it, expect } from 'vitest';
import { trialsToCsv, trialsToJson, TRIAL_COLUMNS } from '../../../src/investigations/export';
import { inverseFrequency, type Trial } from '../../../src/investigations/types';

const trials: Trial[] = [
  { id: 't1', medium: 'Sound in air', frequencyHz: 200, wavelengthM: 343 / 200, speedMps: 343 },
  { id: 't2', medium: 'Sound in air', frequencyHz: 400, wavelengthM: 343 / 400, speedMps: 343 },
];

describe('CSV export', () => {
  it('has a units-bearing header row', () => {
    const csv = trialsToCsv(trials);
    const header = csv.split('\n')[0];
    expect(header).toBe(TRIAL_COLUMNS.join(','));
    expect(header).toContain('(Hz)');
    expect(header).toContain('(m)');
  });
  it('emits one row per trial with the computed 1/f column', () => {
    const lines = trialsToCsv(trials).split('\n');
    expect(lines).toHaveLength(3); // header + 2
    expect(lines[1]).toContain(String(inverseFrequency(trials[0])));
  });
  it('quotes fields that contain commas', () => {
    const csv = trialsToCsv([{ ...trials[0], medium: 'Water, conceptual' }]);
    expect(csv).toContain('"Water, conceptual"');
  });
});

describe('JSON export', () => {
  it('produces a schema-wrapped, parseable payload', () => {
    const json = trialsToJson(trials, { title: 'Wave measurement', fixedSpeedMps: 343 });
    const parsed = JSON.parse(json);
    expect(parsed.schema).toBe('wavemotion.investigation');
    expect(parsed.version).toBe(1);
    expect(parsed.fixedSpeedMps).toBe(343);
    expect(parsed.trials).toHaveLength(2);
    expect(parsed.columns).toContain('1/frequency (s)');
  });
});

describe('inverseFrequency', () => {
  it('returns 1/f and guards f = 0', () => {
    expect(inverseFrequency(trials[0])).toBeCloseTo(1 / 200, 9);
    expect(inverseFrequency({ ...trials[0], frequencyHz: 0 })).toBe(0);
  });
});
