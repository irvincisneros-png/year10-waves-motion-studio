import { LIGHT_SPEED_MPS } from './constants';

export type EmRegionId =
  | 'radio'
  | 'microwave'
  | 'infrared'
  | 'visible'
  | 'ultraviolet'
  | 'xray'
  | 'gamma';

export interface EmRegion {
  id: EmRegionId;
  name: string;
  longEdgeM: number;
  shortEdgeM: number;
  representativeM: number;
  energyTrend: string;
  sources: string;
  detectors: string;
  interactions: string;
  uses: string[];
  ionisingClass: 'non-ionising' | 'mixed-boundary' | 'ionising';
  riskControl: string;
  source: string;
  reviewDate: string;
}

const provenance = 'Standard optics/physics teaching references; boundaries are approximate and overlapping';

export const EM_REGIONS: readonly EmRegion[] = [
  { id: 'radio', name: 'Radio', longEdgeM: 1e3, shortEdgeM: 1e-1, representativeM: 1, energyTrend: 'lowest photon-energy region', sources: 'transmitters, lightning and astronomical radio sources', detectors: 'antennas and radio receivers', interactions: 'Long wavelengths diffract around obstacles; selected bands pass through the atmosphere.', uses: ['broadcasting', 'radio astronomy', 'communication'], ionisingClass: 'non-ionising', riskControl: 'Non-ionising does not mean risk-free: control exposure near high-power transmitters.', source: provenance, reviewDate: '2026-07-17' },
  { id: 'microwave', name: 'Microwave', longEdgeM: 1, shortEdgeM: 1e-3, representativeM: 1e-2, energyTrend: 'very low photon energy', sources: 'microwave oscillators and astronomical sources', detectors: 'dish antennas and microwave receivers', interactions: 'Water-rich materials can absorb microwave energy; many communication bands cross the atmosphere.', uses: ['radar', 'satellite links', 'cooking'], ionisingClass: 'non-ionising', riskControl: 'Shield high-power sources and control heating exposure.', source: provenance, reviewDate: '2026-07-17' },
  { id: 'infrared', name: 'Infrared', longEdgeM: 1e-3, shortEdgeM: 700e-9, representativeM: 10e-6, energyTrend: 'low photon energy', sources: 'warm objects, lamps and infrared emitters', detectors: 'thermal cameras and infrared sensors', interactions: 'Often absorbed by molecular vibrations; atmospheric transmission depends strongly on wavelength.', uses: ['thermal imaging', 'remote controls', 'astronomy'], ionisingClass: 'non-ionising', riskControl: 'Strong sources can heat tissue or damage eyes; use shielding and distance.', source: provenance, reviewDate: '2026-07-17' },
  { id: 'visible', name: 'Visible', longEdgeM: 700e-9, shortEdgeM: 400e-9, representativeM: 550e-9, energyTrend: 'middle of this qualitative trend', sources: 'the Sun, lamps, LEDs and lasers', detectors: 'eyes, cameras and photodiodes', interactions: 'Reflection, absorption, transmission and scattering determine colour and visibility.', uses: ['vision', 'photography', 'optical fibres'], ionisingClass: 'non-ionising', riskControl: 'Bright sources and lasers can harm eyes even though visible light is non-ionising.', source: provenance, reviewDate: '2026-07-17' },
  { id: 'ultraviolet', name: 'Ultraviolet', longEdgeM: 400e-9, shortEdgeM: 10e-9, representativeM: 200e-9, energyTrend: 'high photon energy', sources: 'the Sun, arcs and ultraviolet lamps', detectors: 'UV photodiodes and fluorescent materials', interactions: 'Absorbed strongly by many materials and the atmosphere; can trigger chemical change.', uses: ['fluorescence', 'sterilisation', 'astronomy'], ionisingClass: 'mixed-boundary', riskControl: 'The high-energy end is ionising in this teaching classification; limit skin/eye exposure.', source: provenance, reviewDate: '2026-07-17' },
  { id: 'xray', name: 'X-ray', longEdgeM: 10e-9, shortEdgeM: 1e-11, representativeM: 1e-10, energyTrend: 'very high photon energy', sources: 'X-ray tubes and energetic astronomical events', detectors: 'digital X-ray detectors and space telescopes', interactions: 'Penetration and absorption vary with material and thickness; Earth’s atmosphere blocks astronomical X-rays.', uses: ['medical imaging', 'security imaging', 'astronomy'], ionisingClass: 'ionising', riskControl: 'Ionising: justify exposure, minimise time and use shielding.', source: provenance, reviewDate: '2026-07-17' },
  { id: 'gamma', name: 'Gamma', longEdgeM: 1e-10, shortEdgeM: 1e-12, representativeM: 1e-12, energyTrend: 'highest photon-energy region', sources: 'nuclear transitions and extreme astronomical events', detectors: 'scintillation detectors and space observatories', interactions: 'Highly penetrating; Earth’s atmosphere protects the surface from most astronomical gamma rays.', uses: ['sterilisation', 'radiotherapy', 'astronomy'], ionisingClass: 'ionising', riskControl: 'Ionising: specialised shielding, distance and strict exposure control are required.', source: provenance, reviewDate: '2026-07-17' },
] as const;

export const SPECTRUM_LONG_EDGE_M = 1e3;
export const SPECTRUM_SHORT_EDGE_M = 1e-12;

export function frequencyFromWavelength(wavelengthM: number): number {
  if (!Number.isFinite(wavelengthM) || wavelengthM <= 0) {
    throw new RangeError('Wavelength must be greater than 0 m.');
  }
  return LIGHT_SPEED_MPS / wavelengthM;
}

export function wavelengthFromFrequency(frequencyHz: number): number {
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
    throw new RangeError('Frequency must be greater than 0 Hz.');
  }
  return LIGHT_SPEED_MPS / frequencyHz;
}

export function regionAtWavelength(wavelengthM: number): EmRegion {
  if (!Number.isFinite(wavelengthM) || wavelengthM <= 0) {
    throw new RangeError('Wavelength must be greater than 0 m.');
  }
  if (wavelengthM >= 1e-1) return EM_REGIONS[0];
  if (wavelengthM >= 1e-3) return EM_REGIONS[1];
  if (wavelengthM >= 700e-9) return EM_REGIONS[2];
  if (wavelengthM >= 400e-9) return EM_REGIONS[3];
  if (wavelengthM >= 10e-9) return EM_REGIONS[4];
  if (wavelengthM >= 1e-11) return EM_REGIONS[5];
  return EM_REGIONS[6];
}

export function wavelengthFromLogPosition(position: number): number {
  if (!Number.isFinite(position)) throw new RangeError('Spectrum position must be finite.');
  const clamped = Math.min(1, Math.max(0, position));
  const longLog = Math.log10(SPECTRUM_LONG_EDGE_M);
  const shortLog = Math.log10(SPECTRUM_SHORT_EDGE_M);
  return 10 ** (longLog + (shortLog - longLog) * clamped);
}

export function logPositionFromWavelength(wavelengthM: number): number {
  const clamped = Math.min(SPECTRUM_LONG_EDGE_M, Math.max(SPECTRUM_SHORT_EDGE_M, wavelengthM));
  return (Math.log10(clamped) - Math.log10(SPECTRUM_LONG_EDGE_M)) /
    (Math.log10(SPECTRUM_SHORT_EDGE_M) - Math.log10(SPECTRUM_LONG_EDGE_M));
}
