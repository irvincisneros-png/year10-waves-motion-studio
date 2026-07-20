/** Pure, explicitly relative eye-response teaching model for outcome 7.3.1. */

export type FocusingProblem = 'none' | 'short-sighted' | 'long-sighted';

/**
 * Relative pupil opening: 100% at the darkest supported setting and 25% at
 * the brightest. It is deliberately not labelled in millimetres because the
 * app has no individual calibration and is not a biometric/medical model.
 */
export function pupilOpeningPercent(brightnessPercent: number): number {
  const brightness = Math.min(100, Math.max(0, brightnessPercent));
  return 100 - 75 * (brightness / 100);
}

/** Normalised accommodation demand across the supported 10 cm–10 m range. */
export function idealAccommodationPercent(distanceCm: number, problem: FocusingProblem = 'none'): number {
  const distance = Math.min(1000, Math.max(10, distanceCm));
  const dioptreDemand = 100 / distance;
  let value = ((dioptreDemand - 0.1) / 9.9) * 100;
  if (problem === 'short-sighted') value -= 12;
  if (problem === 'long-sighted') value += 12;
  return Math.min(100, Math.max(0, value));
}

export function retinalImageRelativeSize(distanceCm: number): number {
  const distance = Math.min(1000, Math.max(10, distanceCm));
  return 10 / Math.sqrt(distance);
}

export interface FocusState {
  idealAccommodationPercent: number;
  focusErrorPercent: number;
  status: 'in focus' | 'focus falls in front of the retina' | 'focus falls behind the retina';
}

export function eyeFocusState(
  distanceCm: number,
  accommodationPercent: number,
  problem: FocusingProblem = 'none',
): FocusState {
  const ideal = idealAccommodationPercent(distanceCm, problem);
  const error = accommodationPercent - ideal;
  return {
    idealAccommodationPercent: ideal,
    focusErrorPercent: error,
    status: Math.abs(error) <= 5 ? 'in focus' : error > 0 ? 'focus falls in front of the retina' : 'focus falls behind the retina',
  };
}

export const EYE_STRUCTURES = [
  ['cornea', 'Begins refraction of incoming light.'],
  ['aqueous humour', 'Clear fluid between cornea and lens.'],
  ['iris', 'Muscle ring that changes pupil size.'],
  ['pupil', 'Opening that controls how much light enters.'],
  ['lens', 'Changes shape to fine-tune focus.'],
  ['ciliary muscles', 'Adjust lens accommodation.'],
  ['vitreous humour', 'Clear gel filling the eye.'],
  ['retina', 'Light-sensitive layer where an optical image forms.'],
  ['fovea', 'Central region for detailed vision.'],
  ['optic nerve', 'Carries neural signals toward the brain.'],
] as const;
