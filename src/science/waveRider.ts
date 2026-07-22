export type MatterChoice = 'travels' | 'oscillates' | null;

export const WAVE_RIDER_TARGETS = {
  amplitudeM: 1.5,
  frequencyHz: 1.2,
  mediumSpeedMps: 6,
  wavelengthM: 5,
} as const;

const closeTo = (value: number, target: number, tolerance: number) =>
  Math.abs(value - target) <= tolerance;

/** Wave speed is set by the medium in this simplified, non-dispersive model. */
export function waveSpeed(frequencyHz: number, wavelengthM: number) {
  return frequencyHz * wavelengthM;
}

/** Relative wave-energy index for a fixed medium: energy scales with A². */
export function relativeEnergy(amplitudeM: number) {
  return amplitudeM ** 2;
}

/** A medium particle oscillates about its immutable home position. */
export function particlePosition(
  homeY: number,
  amplitudeM: number,
  phaseRadians: number,
) {
  return homeY + amplitudeM * Math.sin(phaseRadians);
}

export function scoreMatterGate(choice: MatterChoice) {
  return choice === 'oscillates';
}

export function scoreEnergyGate(amplitudeM: number) {
  return closeTo(amplitudeM, WAVE_RIDER_TARGETS.amplitudeM, 0.05);
}

export function scoreSpeedGate(wavelengthM: number) {
  const speed = waveSpeed(WAVE_RIDER_TARGETS.frequencyHz, wavelengthM);
  return closeTo(speed, WAVE_RIDER_TARGETS.mediumSpeedMps, 0.06);
}

export function directionalHint(value: number, target: number) {
  if (closeTo(value, target, 0.05)) return 'Setting locked. Ride the checkpoint.';
  return value < target ? 'Tune higher.' : 'Tune lower.';
}
