/**
 * Wave Engine
 * Deterministic physics models for wave mechanics and invariants.
 */

export interface WaveState {
  amplitude: number; // in meters (or conceptual UI units)
  frequency: number; // in Hertz
  wavelength: number; // in meters
  speed: number; // in m/s
}

/**
 * Calculates wavelength from speed and frequency (λ = v / f)
 */
export function calculateWavelength(speedMps: number, frequencyHz: number): number {
  if (frequencyHz === 0) return 0;
  return speedMps / frequencyHz;
}

/**
 * Calculates speed from frequency and wavelength (v = f * λ)
 */
export function calculateSpeed(frequencyHz: number, wavelengthM: number): number {
  return frequencyHz * wavelengthM;
}

/**
 * Calculates frequency from speed and wavelength (f = v / λ)
 */
export function calculateFrequency(speedMps: number, wavelengthM: number): number {
  if (wavelengthM === 0) return 0;
  return speedMps / wavelengthM;
}

/**
 * Validates the invariant v = f * λ
 * Returns true if the equation holds within a tiny epsilon for floating point errors.
 */
export function validateWaveInvariant(state: WaveState): boolean {
  const expectedSpeed = state.frequency * state.wavelength;
  const epsilon = 1e-10;
  return Math.abs(expectedSpeed - state.speed) < epsilon;
}

/**
 * Given a medium speed and a new frequency, calculates the new wave state.
 * "medium controls propagation speed; wavelength changes to satisfy v = fλ"
 */
export function updateFrequencyKeepSpeed(currentState: WaveState, newFrequencyHz: number): WaveState {
  return {
    ...currentState,
    frequency: newFrequencyHz,
    wavelength: calculateWavelength(currentState.speed, newFrequencyHz)
  };
}
