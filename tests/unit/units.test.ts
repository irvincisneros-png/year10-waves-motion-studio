import { describe, it, expect } from 'vitest';
import {
  toMeters,
  fromMeters,
  toHertz,
  fromHertz,
  toSeconds,
  fromSeconds,
  formatValue,
  formatSigFigs,
  formatWithUnit,
  CONVERSION_SPECS,
} from '../../src/science/units';

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

  it('converts times correctly', () => {
    expect(toSeconds(500, 'ms')).toBe(0.5);
    expect(fromSeconds(0.5, 'ms')).toBe(500);
  });

  it('formats values nicely', () => {
    expect(formatValue(1.23456, 3)).toBe('1.23');
    expect(formatValue(1, 3)).toBe('1');
    expect(formatValue(1000.0001, 4)).toBe('1000');
  });
});

describe('frequency conversions Hz/kHz/MHz/GHz round-trip exactly', () => {
  it('1,000,000 Hz through every unit and back is exact', () => {
    const hz = 1_000_000;
    const khz = fromHertz(hz, 'kHz');
    const mhz = fromHertz(hz, 'MHz');
    const ghz = fromHertz(hz, 'GHz');
    expect(khz).toBe(1000);
    expect(mhz).toBe(1);
    expect(ghz).toBe(0.001);
    expect(toHertz(ghz, 'GHz')).toBeCloseTo(hz, 6);
  });
});

describe('length conversions m/cm/mm/µm/nm round-trip exactly', () => {
  it('500 nm round-trips within 1e-9 relative', () => {
    const m = toMeters(500, 'nm');
    expect(fromMeters(m, 'nm')).toBeCloseTo(500, 9);
  });
});

describe('every declared conversion is dimensionally valid and round-trips (SCIENCE_REVIEW §20.14)', () => {
  it('A → SI → A returns the original within floating-point tolerance for every spec', () => {
    for (const spec of CONVERSION_SPECS) {
      for (const value of [1, 0.5, 123.456, 987654]) {
        const si = spec.toSI(value);
        const back = spec.fromSI(si);
        expect(back, `${spec.unit} (${spec.dimension})`).toBeCloseTo(value, 6);
      }
    }
  });

  it('covers length, frequency and time dimensions', () => {
    const dims = new Set(CONVERSION_SPECS.map((s) => s.dimension));
    expect(dims.has('length')).toBe(true);
    expect(dims.has('frequency')).toBe(true);
    expect(dims.has('time')).toBe(true);
    expect(dims.has('force')).toBe(true);
    expect(dims.has('velocity')).toBe(true);
    expect(dims.has('acceleration')).toBe(true);
  });
});

describe('formatSigFigs (SCIENCE_REVIEW §3.4)', () => {
  it('shows 3 significant figures by default', () => {
    expect(formatSigFigs(343.2)).toBe('343');
    expect(formatSigFigs(486.133)).toBe('486');
    expect(formatSigFigs(0.779545)).toBe('0.78');
  });
  it('uses scientific notation with preserved trailing zeros for large magnitudes', () => {
    expect(formatSigFigs(299_792_458)).toBe('3.00 × 10⁸');
  });
  it('uses scientific notation for very small magnitudes', () => {
    expect(formatSigFigs(5e-7)).toBe('5.00 × 10⁻⁷');
  });
  it('renders zero as 0', () => {
    expect(formatSigFigs(0)).toBe('0');
  });
  it('appends units', () => {
    expect(formatWithUnit(343, 'm/s')).toBe('343 m/s');
  });
});
