/**
 * Pure optics engines for Stage 4 (outcomes 7.3.2 and 7.3.3).
 *
 * Angles are degrees from the normal. Refractive indices are the curated
 * ~589 nm reference values in SCIENCE_REVIEW §9.5. Surface energy responses
 * are explicitly labelled teaching models rather than measured material data.
 */

import { CONSTANTS_REVIEW_DATE } from './constants';

export const LIGHT_SPEED_VACUUM_MPS = 299_792_458;
export const DEFAULT_LIGHT_FREQUENCY_HZ = 5e14;

export interface OpticalMedium {
  id: string;
  label: string;
  refractiveIndex: number;
  conditions: string;
  source: string;
  reviewDate: string;
}

export const OPTICAL_MEDIA: readonly OpticalMedium[] = [
  { id: 'vacuum', label: 'Vacuum', refractiveIndex: 1, conditions: 'exact by definition', source: 'SI definition', reviewDate: CONSTANTS_REVIEW_DATE },
  { id: 'air', label: 'Air', refractiveIndex: 1.0003, conditions: 'about 0–20 °C and 1 atm; normally displayed as 1.00', source: 'CRC Handbook of Chemistry and Physics', reviewDate: CONSTANTS_REVIEW_DATE },
  { id: 'water', label: 'Water', refractiveIndex: 1.33, conditions: '20 °C', source: 'CRC Handbook of Chemistry and Physics', reviewDate: CONSTANTS_REVIEW_DATE },
  { id: 'ice', label: 'Ice', refractiveIndex: 1.31, conditions: 'about 0 °C', source: 'CRC Handbook of Chemistry and Physics', reviewDate: CONSTANTS_REVIEW_DATE },
  { id: 'ethanol', label: 'Ethanol', refractiveIndex: 1.36, conditions: '20 °C', source: 'CRC Handbook of Chemistry and Physics', reviewDate: CONSTANTS_REVIEW_DATE },
  { id: 'acrylic', label: 'Acrylic (PMMA)', refractiveIndex: 1.49, conditions: 'typical material at about 589 nm', source: 'Manufacturer optical-material data', reviewDate: CONSTANTS_REVIEW_DATE },
  { id: 'crown-glass', label: 'Crown glass', refractiveIndex: 1.52, conditions: 'typical optical crown at about 589 nm', source: 'CRC Handbook / Schott optical glass data', reviewDate: CONSTANTS_REVIEW_DATE },
  { id: 'flint-glass', label: 'Flint glass', refractiveIndex: 1.62, conditions: 'typical dense flint at about 589 nm', source: 'CRC Handbook / Schott optical glass data', reviewDate: CONSTANTS_REVIEW_DATE },
  { id: 'diamond', label: 'Diamond', refractiveIndex: 2.42, conditions: 'about 589 nm', source: 'CRC Handbook of Chemistry and Physics', reviewDate: CONSTANTS_REVIEW_DATE },
];

export function opticalMediumById(id: string): OpticalMedium | undefined {
  return OPTICAL_MEDIA.find((medium) => medium.id === id);
}

export interface ReflectionResult {
  incidentAngleDeg: number;
  reflectedAngleDeg: number;
}

export function reflect(incidentAngleDeg: number): ReflectionResult {
  if (!Number.isFinite(incidentAngleDeg) || incidentAngleDeg < 0 || incidentAngleDeg > 89) {
    throw new RangeError('Incident angle must be between 0° and 89° from the normal.');
  }
  return { incidentAngleDeg, reflectedAngleDeg: incidentAngleDeg };
}

export interface RefractionResult {
  incidentAngleDeg: number;
  refractedAngleDeg: number | null;
  reflectedAngleDeg: number;
  totalInternalReflection: boolean;
  frequencyBeforeHz: number;
  frequencyAfterHz: number;
  speedBeforeMps: number;
  speedAfterMps: number;
  wavelengthBeforeM: number;
  wavelengthAfterM: number;
}

const toRad = (degrees: number) => (degrees * Math.PI) / 180;
const toDeg = (radians: number) => (radians * 180) / Math.PI;

export function criticalAngleDeg(n1: number, n2: number): number | null {
  if (!(n1 > 0) || !(n2 > 0)) throw new RangeError('Refractive indices must be greater than zero.');
  if (n1 <= n2) return null;
  return toDeg(Math.asin(n2 / n1));
}

export function refract(
  n1: number,
  n2: number,
  incidentAngleDeg: number,
  frequencyHz = DEFAULT_LIGHT_FREQUENCY_HZ,
): RefractionResult {
  reflect(incidentAngleDeg);
  if (!(n1 > 0) || !(n2 > 0)) throw new RangeError('Refractive indices must be greater than zero.');
  if (!(frequencyHz > 0) || !Number.isFinite(frequencyHz)) throw new RangeError('Frequency must be greater than zero.');

  const sinTheta2 = (n1 / n2) * Math.sin(toRad(incidentAngleDeg));
  const totalInternalReflection = sinTheta2 > 1;
  const speedBeforeMps = LIGHT_SPEED_VACUUM_MPS / n1;
  const speedAfterMps = LIGHT_SPEED_VACUUM_MPS / n2;

  return {
    incidentAngleDeg,
    refractedAngleDeg: totalInternalReflection ? null : toDeg(Math.asin(Math.min(1, sinTheta2))),
    reflectedAngleDeg: incidentAngleDeg,
    totalInternalReflection,
    frequencyBeforeHz: frequencyHz,
    frequencyAfterHz: frequencyHz,
    speedBeforeMps,
    speedAfterMps,
    wavelengthBeforeM: speedBeforeMps / frequencyHz,
    wavelengthAfterM: speedAfterMps / frequencyHz,
  };
}

export interface EnergyLedger {
  transmitted: number;
  reflected: number;
  absorbed: number;
}

export type IlluminantId = 'daylight' | 'warm-led' | 'uv-rich';
export type SurfaceId = 'clear-glass' | 'smoked-glass' | 'white-matte' | 'black-matte' | 'uv-screen';

export interface Illuminant {
  id: IlluminantId;
  label: string;
  note: string;
}

export interface OpticalSurface {
  id: SurfaceId;
  label: string;
  note: string;
}

export const ILLUMINANTS: readonly Illuminant[] = [
  { id: 'daylight', label: 'Daylight (model)', note: 'Broad visible-light teaching profile; D65 is a standard daylight reference, but this ledger is not a spectrophotometer.' },
  { id: 'warm-led', label: 'Warm LED (model)', note: 'Visible-rich, low-UV teaching profile.' },
  { id: 'uv-rich', label: 'UV-rich source (model)', note: 'Conceptual UV-rich comparison for sunscreen and remote-sensing reasoning; not a safe practical source.' },
];

export const OPTICAL_SURFACES: readonly OpticalSurface[] = [
  { id: 'clear-glass', label: 'Clear glass (model)', note: 'High transmission model.' },
  { id: 'smoked-glass', label: 'Smoked glass (model)', note: 'High absorption model.' },
  { id: 'white-matte', label: 'White matte surface (model)', note: 'High diffuse reflection model.' },
  { id: 'black-matte', label: 'Black matte surface (model)', note: 'High absorption under the selected illuminant; surroundings still matter.' },
  { id: 'uv-screen', label: 'UV-screen material (model)', note: 'Absorbs more of the UV-rich teaching profile.' },
];

/**
 * Conceptual, normalised response fixtures. These are not empirical constants;
 * they exist to test conservation and controlled comparisons. Values and that
 * limitation are surfaced in the UI.
 */
const RESPONSE: Record<SurfaceId, Record<IlluminantId, EnergyLedger>> = {
  'clear-glass': {
    daylight: { transmitted: 0.9, reflected: 0.08, absorbed: 0.02 },
    'warm-led': { transmitted: 0.91, reflected: 0.08, absorbed: 0.01 },
    'uv-rich': { transmitted: 0.7, reflected: 0.08, absorbed: 0.22 },
  },
  'smoked-glass': {
    daylight: { transmitted: 0.1, reflected: 0.08, absorbed: 0.82 },
    'warm-led': { transmitted: 0.14, reflected: 0.08, absorbed: 0.78 },
    'uv-rich': { transmitted: 0.05, reflected: 0.08, absorbed: 0.87 },
  },
  'white-matte': {
    daylight: { transmitted: 0.02, reflected: 0.78, absorbed: 0.2 },
    'warm-led': { transmitted: 0.02, reflected: 0.82, absorbed: 0.16 },
    'uv-rich': { transmitted: 0.02, reflected: 0.6, absorbed: 0.38 },
  },
  'black-matte': {
    daylight: { transmitted: 0.01, reflected: 0.06, absorbed: 0.93 },
    'warm-led': { transmitted: 0.01, reflected: 0.08, absorbed: 0.91 },
    'uv-rich': { transmitted: 0.01, reflected: 0.04, absorbed: 0.95 },
  },
  'uv-screen': {
    daylight: { transmitted: 0.62, reflected: 0.12, absorbed: 0.26 },
    'warm-led': { transmitted: 0.8, reflected: 0.12, absorbed: 0.08 },
    'uv-rich': { transmitted: 0.06, reflected: 0.14, absorbed: 0.8 },
  },
};

export function energyLedger(surface: SurfaceId, illuminant: IlluminantId): EnergyLedger {
  return { ...RESPONSE[surface][illuminant] };
}

export type ScatteringRegime = 'small' | 'medium' | 'large';

export function scatteringRegime(value: number): { id: ScatteringRegime; label: string; explanation: string } {
  if (!Number.isFinite(value)) value = 0;
  if (value < 34) return { id: 'small', label: 'Small particles — Rayleigh-type model', explanation: 'Shorter visible wavelengths are redirected more strongly: blue-sky and red-sunset reasoning.' };
  if (value < 67) return { id: 'medium', label: 'Comparable-size particles — broad scattering model', explanation: 'A wider range of visible wavelengths is redirected, making haze look pale.' };
  return { id: 'large', label: 'Large particles — nearly wavelength-independent model', explanation: 'Droplets redirect visible wavelengths more evenly, helping clouds look white or grey.' };
}

export type MirrorType = 'plane' | 'concave' | 'convex';
export type LensType = 'converging' | 'diverging';

export function qualitativeMirrorImage(type: MirrorType): string {
  if (type === 'plane') return 'Plane mirror: upright, virtual image at the same apparent distance behind the mirror.';
  if (type === 'concave') return 'Concave mirror extension: image behaviour depends on object distance; this view is qualitative and uses no mirror equation.';
  return 'Convex mirror extension: upright, reduced, virtual image with a wider field of view; this view is qualitative.';
}

export function qualitativeLensImage(type: LensType, objectPosition: 'near' | 'far'): string {
  if (type === 'diverging') {
    return 'Diverging lens: upright, reduced, virtual image in this qualitative ray model.';
  }
  return objectPosition === 'near'
    ? 'Converging lens with a near object: upright, enlarged, virtual image — magnifier model.'
    : 'Converging lens with a far object: inverted, real image — camera/projector model.';
}

export interface DesignChallengeResult {
  complete: boolean;
  errorDeg: number;
  feedback: string;
}

export function reflectionChallenge(targetAngleDeg: number, mirrorAngleDeg: number): DesignChallengeResult {
  const errorDeg = Math.abs(targetAngleDeg - mirrorAngleDeg);
  if (errorDeg <= 2) return { complete: true, errorDeg, feedback: 'Target reached — the reflected ray enters the receiver.' };
  return { complete: false, errorDeg, feedback: `Keep adjusting: the reflected ray misses the target direction by ${errorDeg.toFixed(0)}°.` };
}
