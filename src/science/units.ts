/**
 * Unit Engine
 * Handles precise unit conversions and formatting for the science simulations.
 */

export type DistanceUnit = 'm' | 'cm' | 'mm' | 'µm' | 'nm';
export type FrequencyUnit = 'Hz' | 'kHz' | 'MHz' | 'GHz';

// Base SI multipliers (everything is converted to standard SI units: meters, Hz, seconds)
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
