import { LIGHT_SPEED_MPS } from './constants';

export interface SpectralLine {
  id: string;
  element: 'Hydrogen' | 'Helium' | 'Sodium';
  name: string;
  wavelengthNm: number;
  source: string;
  reviewDate: string;
}

const nist = 'NIST Atomic Spectra Database';

export const STELLAR_LINES: readonly SpectralLine[] = [
  { id: 'h-alpha', element: 'Hydrogen', name: 'H-alpha', wavelengthNm: 656.3, source: nist, reviewDate: '2026-07-17' },
  { id: 'h-beta', element: 'Hydrogen', name: 'H-beta', wavelengthNm: 486.1, source: nist, reviewDate: '2026-07-17' },
  { id: 'h-gamma', element: 'Hydrogen', name: 'H-gamma', wavelengthNm: 434.0, source: nist, reviewDate: '2026-07-17' },
  { id: 'h-delta', element: 'Hydrogen', name: 'H-delta', wavelengthNm: 410.2, source: nist, reviewDate: '2026-07-17' },
  { id: 'he-yellow', element: 'Helium', name: 'yellow D₃', wavelengthNm: 587.6, source: nist, reviewDate: '2026-07-17' },
  { id: 'he-green', element: 'Helium', name: 'green', wavelengthNm: 501.6, source: nist, reviewDate: '2026-07-17' },
  { id: 'he-blue', element: 'Helium', name: 'blue', wavelengthNm: 447.1, source: nist, reviewDate: '2026-07-17' },
  { id: 'na-d2', element: 'Sodium', name: 'D₂', wavelengthNm: 589.0, source: nist, reviewDate: '2026-07-17' },
  { id: 'na-d1', element: 'Sodium', name: 'D₁', wavelengthNm: 589.6, source: nist, reviewDate: '2026-07-17' },
] as const;

export type ObservationBand = 'radio' | 'infrared' | 'visible' | 'ultraviolet' | 'xray' | 'gamma';

export interface StarExample {
  id: string;
  name: string;
  temperatureTrend: string;
  availableBands: readonly ObservationBand[];
  lineIds: readonly string[];
  source: string;
  reviewDate: string;
}

export const STAR_EXAMPLES: readonly StarExample[] = [
  { id: 'sun', name: 'Sun (teaching reference)', temperatureTrend: 'yellow-white; intermediate surface-temperature trend', availableBands: ['radio', 'infrared', 'visible', 'ultraviolet', 'xray'], lineIds: ['h-alpha', 'h-beta', 'na-d2', 'na-d1'], source: 'NASA/ESA educational astronomy references; curated qualitative dataset', reviewDate: '2026-07-20' },
  { id: 'hot-star', name: 'Hot blue star (curated model)', temperatureTrend: 'bluer continuous spectrum; hotter surface trend', availableBands: ['infrared', 'visible', 'ultraviolet', 'xray'], lineIds: ['h-alpha', 'h-beta', 'he-yellow', 'he-blue'], source: 'Curated Year 10 teaching model; not a measured individual-star spectrum', reviewDate: '2026-07-20' },
  { id: 'cool-star', name: 'Cool red star (curated model)', temperatureTrend: 'redder continuous spectrum; cooler surface trend', availableBands: ['radio', 'infrared', 'visible'], lineIds: ['h-alpha', 'na-d2', 'na-d1'], source: 'Curated Year 10 teaching model; not a measured individual-star spectrum', reviewDate: '2026-07-20' },
] as const;

export function shiftedWavelengthNm(restWavelengthNm: number, radialVelocityKmS: number): number {
  if (!Number.isFinite(restWavelengthNm) || restWavelengthNm <= 0) throw new RangeError('Rest wavelength must be greater than 0 nm.');
  if (!Number.isFinite(radialVelocityKmS) || Math.abs(radialVelocityKmS) > 300) throw new RangeError('Radial velocity must be between −300 km/s and +300 km/s.');
  const velocityMps = radialVelocityKmS * 1000;
  return restWavelengthNm * (1 + velocityMps / LIGHT_SPEED_MPS);
}

export function radialDirection(radialVelocityKmS: number): 'approaching (blueshift)' | 'stationary' | 'receding (redshift)' {
  if (radialVelocityKmS < 0) return 'approaching (blueshift)';
  if (radialVelocityKmS > 0) return 'receding (redshift)';
  return 'stationary';
}

export function identifySpectralLine(wavelengthNm: number, toleranceNm = 0.25): SpectralLine | null {
  if (!Number.isFinite(wavelengthNm)) return null;
  const nearest = [...STELLAR_LINES].sort(
    (a, b) => Math.abs(a.wavelengthNm - wavelengthNm) - Math.abs(b.wavelengthNm - wavelengthNm),
  )[0];
  return Math.abs(nearest.wavelengthNm - wavelengthNm) <= toleranceNm ? nearest : null;
}
