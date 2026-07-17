/**
 * Unit Engine
 * Handles precise unit conversions and formatting for the science simulations.
 */

export type DistanceUnit = 'm' | 'cm' | 'mm' | 'µm' | 'nm';
export type FrequencyUnit = 'Hz' | 'kHz' | 'MHz' | 'GHz';
export type TimeUnit = 's' | 'ms';

/** Physical dimension of a unit family — used by the dimensional-validity test. */
export type Dimension = 'length' | 'frequency' | 'time' | 'speed';

// Base SI multipliers (everything is converted to standard SI units: metres, Hz, seconds)
const DistanceMultipliers: Record<DistanceUnit, number> = {
  'm': 1,
  'cm': 1e-2,
  'mm': 1e-3,
  'µm': 1e-6,
  'nm': 1e-9,
};

const FrequencyMultipliers: Record<FrequencyUnit, number> = {
  'Hz': 1,
  'kHz': 1e3,
  'MHz': 1e6,
  'GHz': 1e9,
};

const TimeMultipliers: Record<TimeUnit, number> = {
  's': 1,
  'ms': 1e-3,
};

export const DISTANCE_UNITS: readonly DistanceUnit[] = ['m', 'cm', 'mm', 'µm', 'nm'];
export const FREQUENCY_UNITS: readonly FrequencyUnit[] = ['Hz', 'kHz', 'MHz', 'GHz'];
export const TIME_UNITS: readonly TimeUnit[] = ['s', 'ms'];

/**
 * Converts a distance value to meters
 */
export function toMeters(value: number, unit: DistanceUnit): number {
  return value * DistanceMultipliers[unit];
}

/**
 * Converts a distance from meters to a target unit
 */
export function fromMeters(valueInMeters: number, unit: DistanceUnit): number {
  return valueInMeters / DistanceMultipliers[unit];
}

/**
 * Converts a frequency value to Hertz
 */
export function toHertz(value: number, unit: FrequencyUnit): number {
  return value * FrequencyMultipliers[unit];
}

/**
 * Converts a frequency from Hertz to a target unit
 */
export function fromHertz(valueInHz: number, unit: FrequencyUnit): number {
  return valueInHz / FrequencyMultipliers[unit];
}

/** Converts a time value to seconds. */
export function toSeconds(value: number, unit: TimeUnit): number {
  return value * TimeMultipliers[unit];
}

/** Converts a time from seconds to a target unit. */
export function fromSeconds(valueInSeconds: number, unit: TimeUnit): number {
  return valueInSeconds / TimeMultipliers[unit];
}

/**
 * Formats a number with appropriate rounding for display.
 * Internal calculations should use exact numbers; formatting is only for the UI.
 */
export function formatValue(value: number, precision: number = 3): string {
  // Use toPrecision to avoid floating point display issues like 1.0000000000000002
  // but strip trailing zeros if it's not a decimal.
  const formatted = parseFloat(value.toPrecision(precision)).toString();
  return formatted;
}

/**
 * Display formatter honouring SCIENCE_REVIEW §3.4:
 *  - default 3 significant figures;
 *  - very large / very small magnitudes use scientific notation (× 10ⁿ) with
 *    trailing zeros preserved to show precision;
 *  - zero renders as "0".
 * Returns a plain string using the Unicode "×" and superscript exponent so it
 * can sit directly in the DOM.
 */
export function formatSigFigs(value: number, sig = 3): string {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  const abs = Math.abs(value);
  // Scientific notation outside a comfortable fixed-point band.
  if (abs >= 1e5 || abs < 1e-3) {
    const exp = Math.floor(Math.log10(abs));
    const mantissa = value / 10 ** exp;
    const mantissaStr = mantissa.toFixed(sig - 1);
    return `${mantissaStr} × 10${toSuperscript(exp)}`;
  }
  // Fixed point, 3 s.f., trailing zeros trimmed for readability.
  const fixed = value.toPrecision(sig);
  return String(parseFloat(fixed));
}

const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻',
};

function toSuperscript(n: number): string {
  return String(n)
    .split('')
    .map((c) => SUPERSCRIPTS[c] ?? c)
    .join('');
}

/** Formats a value with its unit suffix, e.g. "343 m/s". */
export function formatWithUnit(value: number, unit: string, sig = 3): string {
  return `${formatSigFigs(value, sig)} ${unit}`;
}

/**
 * Schema of every supported conversion, for the dimensional-validity sweep
 * (TEST_PLAN §1 `units.test.ts`). Each entry declares its dimension and a
 * round-trippable to/from SI pair.
 */
export interface ConversionSpec {
  dimension: Dimension;
  unit: string;
  toSI: (v: number) => number;
  fromSI: (v: number) => number;
}

export const CONVERSION_SPECS: readonly ConversionSpec[] = [
  ...DISTANCE_UNITS.map((u): ConversionSpec => ({
    dimension: 'length',
    unit: u,
    toSI: (v) => toMeters(v, u),
    fromSI: (v) => fromMeters(v, u),
  })),
  ...FREQUENCY_UNITS.map((u): ConversionSpec => ({
    dimension: 'frequency',
    unit: u,
    toSI: (v) => toHertz(v, u),
    fromSI: (v) => fromHertz(v, u),
  })),
  ...TIME_UNITS.map((u): ConversionSpec => ({
    dimension: 'time',
    unit: u,
    toSI: (v) => toSeconds(v, u),
    fromSI: (v) => fromSeconds(v, u),
  })),
];
