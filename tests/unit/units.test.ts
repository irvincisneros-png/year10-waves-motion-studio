import { describe, it, expect } from 'vitest';
import { toMeters, fromMeters, toHertz, fromHertz, formatValue } from '../../src/science/units';

describe('Units Engine', () => {
  it('converts distances correctly', () => {
    expect(toMeters(1, 'm')).toBe(1);
    expect(toMeters(1, 'cm')).toBe(0.01);
    expect(toMeters(500, 'nm')).toBeCloseTo(500e-9, 15);

    expect(fromMeters(1, 'cm')).toBe(100);
    expect(fromMeters(0.001, 'mm')).toBe(1);
  });

  it('converts frequencies correctly', () => {
    expect(toHertz(1, 'kHz')).toBe(1000);
    expect(toHertz(2.4, 'GHz')).toBe(2.4e9);

    expect(fromHertz(1000, 'kHz')).toBe(1);
  });

  it('formats values nicely', () => {
    expect(formatValue(1.23456, 3)).toBe('1.23');
    expect(formatValue(1, 3)).toBe('1');
    expect(formatValue(1000.0001, 4)).toBe('1000');
  });
});
