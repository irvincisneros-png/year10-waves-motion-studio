import { LIGHT_SPEED_MPS } from './constants';
import { createRng } from './rng';

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
  provenanceIds: readonly SpectrumProvenanceId[];
}

export type SpectrumProvenanceId =
  | 'bipm-si-speed-of-light'
  | 'nasa-electromagnetic-spectrum';

export interface SpectrumProvenance {
  id: SpectrumProvenanceId;
  authority: string;
  title: string;
  url: string;
  supports: string;
  reviewDate: string;
}

/**
 * Named authoritative sources for the continuous-spectrum engine. Region
 * boundaries remain teaching conventions rather than constants; the NASA
 * source supports the common family/order, while BIPM is authoritative for c.
 */
export const EM_SPECTRUM_PROVENANCE: readonly SpectrumProvenance[] = [
  {
    id: 'bipm-si-speed-of-light',
    authority: 'Bureau International des Poids et Mesures (BIPM)',
    title: 'SI base unit: metre',
    url: 'https://www.bipm.org/en/si-base-units/metre',
    supports: 'The exact defined speed of light in vacuum, c = 299 792 458 m/s.',
    reviewDate: '2026-07-22',
  },
  {
    id: 'nasa-electromagnetic-spectrum',
    authority: 'NASA Science',
    title: 'The Electromagnetic Spectrum',
    url: 'https://science.nasa.gov/ems/',
    supports:
      'The continuous electromagnetic-wave family from long radio waves to short gamma rays and its commonly named regions.',
    reviewDate: '2026-07-22',
  },
] as const;

const REGION_PROVENANCE_IDS = [
  'bipm-si-speed-of-light',
  'nasa-electromagnetic-spectrum',
] as const satisfies readonly SpectrumProvenanceId[];

const provenance = 'Standard optics/physics teaching references; boundaries are approximate and overlapping';

export const EM_REGIONS: readonly EmRegion[] = [
  { id: 'radio', name: 'Radio', longEdgeM: 1e3, shortEdgeM: 1e-1, representativeM: 1, energyTrend: 'lowest photon-energy region', sources: 'transmitters, lightning and astronomical radio sources', detectors: 'antennas and radio receivers', interactions: 'Long wavelengths diffract around obstacles; selected bands pass through the atmosphere.', uses: ['broadcasting', 'radio astronomy', 'communication'], ionisingClass: 'non-ionising', riskControl: 'Non-ionising does not mean risk-free: control exposure near high-power transmitters.', source: provenance, reviewDate: '2026-07-17', provenanceIds: REGION_PROVENANCE_IDS },
  { id: 'microwave', name: 'Microwave', longEdgeM: 1, shortEdgeM: 1e-3, representativeM: 1e-2, energyTrend: 'very low photon energy', sources: 'microwave oscillators and astronomical sources', detectors: 'dish antennas and microwave receivers', interactions: 'Water-rich materials can absorb microwave energy; many communication bands cross the atmosphere.', uses: ['radar', 'satellite links', 'cooking'], ionisingClass: 'non-ionising', riskControl: 'Shield high-power sources and control heating exposure.', source: provenance, reviewDate: '2026-07-17', provenanceIds: REGION_PROVENANCE_IDS },
  { id: 'infrared', name: 'Infrared', longEdgeM: 1e-3, shortEdgeM: 700e-9, representativeM: 10e-6, energyTrend: 'low photon energy', sources: 'warm objects, lamps and infrared emitters', detectors: 'thermal cameras and infrared sensors', interactions: 'Often absorbed by molecular vibrations; atmospheric transmission depends strongly on wavelength.', uses: ['thermal imaging', 'remote controls', 'astronomy'], ionisingClass: 'non-ionising', riskControl: 'Strong sources can heat tissue or damage eyes; use shielding and distance.', source: provenance, reviewDate: '2026-07-17', provenanceIds: REGION_PROVENANCE_IDS },
  { id: 'visible', name: 'Visible', longEdgeM: 700e-9, shortEdgeM: 400e-9, representativeM: 550e-9, energyTrend: 'middle of this qualitative trend', sources: 'the Sun, lamps, LEDs and lasers', detectors: 'eyes, cameras and photodiodes', interactions: 'Reflection, absorption, transmission and scattering determine colour and visibility.', uses: ['vision', 'photography', 'optical fibres'], ionisingClass: 'non-ionising', riskControl: 'Bright sources and lasers can harm eyes even though visible light is non-ionising.', source: provenance, reviewDate: '2026-07-17', provenanceIds: REGION_PROVENANCE_IDS },
  { id: 'ultraviolet', name: 'Ultraviolet', longEdgeM: 400e-9, shortEdgeM: 10e-9, representativeM: 200e-9, energyTrend: 'high photon energy', sources: 'the Sun, arcs and ultraviolet lamps', detectors: 'UV photodiodes and fluorescent materials', interactions: 'Absorbed strongly by many materials and the atmosphere; can trigger chemical change.', uses: ['fluorescence', 'sterilisation', 'astronomy'], ionisingClass: 'mixed-boundary', riskControl: 'The high-energy end is ionising in this teaching classification; limit skin/eye exposure.', source: provenance, reviewDate: '2026-07-17', provenanceIds: REGION_PROVENANCE_IDS },
  { id: 'xray', name: 'X-ray', longEdgeM: 10e-9, shortEdgeM: 1e-11, representativeM: 1e-10, energyTrend: 'very high photon energy', sources: 'X-ray tubes and energetic astronomical events', detectors: 'digital X-ray detectors and space telescopes', interactions: 'Penetration and absorption vary with material and thickness; Earth’s atmosphere blocks astronomical X-rays.', uses: ['medical imaging', 'security imaging', 'astronomy'], ionisingClass: 'ionising', riskControl: 'Ionising: justify exposure, minimise time and use shielding.', source: provenance, reviewDate: '2026-07-17', provenanceIds: REGION_PROVENANCE_IDS },
  { id: 'gamma', name: 'Gamma', longEdgeM: 1e-10, shortEdgeM: 1e-12, representativeM: 1e-12, energyTrend: 'highest photon-energy region', sources: 'nuclear transitions and extreme astronomical events', detectors: 'scintillation detectors and space observatories', interactions: 'Highly penetrating; Earth’s atmosphere protects the surface from most astronomical gamma rays.', uses: ['sterilisation', 'radiotherapy', 'astronomy'], ionisingClass: 'ionising', riskControl: 'Ionising: specialised shielding, distance and strict exposure control are required.', source: provenance, reviewDate: '2026-07-17', provenanceIds: REGION_PROVENANCE_IDS },
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

// -------------------------------------------------- outcome 7.1.4 continuous state

export interface SpectrumEnergyOrder {
  basis: 'frequency';
  frequencyHz: number;
  relationship: 'higher-frequency-means-higher-photon-energy';
}

export interface ContinuousSpectrumState {
  logPosition: number;
  wavelengthM: number;
  frequencyHz: number;
  vacuumSpeedMps: typeof LIGHT_SPEED_MPS;
  candidateRegionIds: readonly EmRegionId[];
  energyOrder: SpectrumEnergyOrder;
}

function assertSupportedWavelength(wavelengthM: number): void {
  if (!Number.isFinite(wavelengthM) || wavelengthM <= 0) {
    throw new RangeError('Wavelength must be greater than 0 m.');
  }
  if (wavelengthM > SPECTRUM_LONG_EDGE_M || wavelengthM < SPECTRUM_SHORT_EDGE_M) {
    throw new RangeError(
      `Wavelength must be within the supported spectrum span ${SPECTRUM_SHORT_EDGE_M}–${SPECTRUM_LONG_EDGE_M} m.`,
    );
  }
}

/**
 * Return every named region whose approximate range contains the wavelength.
 * Unlike the legacy single-region helper, this deliberately preserves overlaps.
 */
export function regionsAtWavelength(wavelengthM: number): readonly EmRegion[] {
  assertSupportedWavelength(wavelengthM);
  return EM_REGIONS.filter(
    (region) => wavelengthM <= region.longEdgeM && wavelengthM >= region.shortEdgeM,
  );
}

export function spectrumStateFromWavelength(wavelengthM: number): ContinuousSpectrumState {
  assertSupportedWavelength(wavelengthM);
  const frequencyHz = frequencyFromWavelength(wavelengthM);
  return {
    logPosition: logPositionFromWavelength(wavelengthM),
    wavelengthM,
    frequencyHz,
    vacuumSpeedMps: LIGHT_SPEED_MPS,
    candidateRegionIds: regionsAtWavelength(wavelengthM).map((region) => region.id),
    energyOrder: {
      basis: 'frequency',
      frequencyHz,
      relationship: 'higher-frequency-means-higher-photon-energy',
    },
  };
}

export function spectrumStateFromFrequency(frequencyHz: number): ContinuousSpectrumState {
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
    throw new RangeError('Frequency must be greater than 0 Hz.');
  }
  return spectrumStateFromWavelength(wavelengthFromFrequency(frequencyHz));
}

export function spectrumStateFromLogPosition(position: number): ContinuousSpectrumState {
  if (!Number.isFinite(position)) {
    throw new RangeError('Spectrum position must be finite.');
  }
  return spectrumStateFromWavelength(wavelengthFromLogPosition(position));
}

function relativelyEqual(a: number, b: number, tolerance = 1e-12): boolean {
  return Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), Number.MIN_VALUE) <= tolerance;
}

/** Runtime guard for challenge state assembled outside the pure factories. */
export function isContinuousSpectrumStateConsistent(state: ContinuousSpectrumState): boolean {
  try {
    const canonical = spectrumStateFromWavelength(state.wavelengthM);
    return (
      relativelyEqual(state.frequencyHz, canonical.frequencyHz) &&
      relativelyEqual(state.logPosition, canonical.logPosition) &&
      state.vacuumSpeedMps === canonical.vacuumSpeedMps &&
      state.energyOrder.basis === 'frequency' &&
      relativelyEqual(state.energyOrder.frequencyHz, canonical.frequencyHz) &&
      state.energyOrder.relationship === 'higher-frequency-means-higher-photon-energy' &&
      state.candidateRegionIds.length === canonical.candidateRegionIds.length &&
      state.candidateRegionIds.every((id) => canonical.candidateRegionIds.includes(id))
    );
  } catch {
    return false;
  }
}

export type SpectrumRelativeOrder = 'lower' | 'equal' | 'higher';
export type SpectrumWavelengthOrder = 'shorter' | 'equal' | 'longer';

export interface SpectrumStateComparison {
  pinA: ContinuousSpectrumState;
  pinB: ContinuousSpectrumState;
  wavelengthRatioBToA: number;
  frequencyRatioBToA: number;
  pinBWavelength: SpectrumWavelengthOrder;
  pinBFrequency: SpectrumRelativeOrder;
  pinBPhotonEnergy: SpectrumRelativeOrder;
  sharedVacuumSpeedMps: typeof LIGHT_SPEED_MPS;
}

function relativeOrder(a: number, b: number): SpectrumRelativeOrder {
  if (b === a) return 'equal';
  return b > a ? 'higher' : 'lower';
}

export function compareSpectrumStates(
  pinA: ContinuousSpectrumState,
  pinB: ContinuousSpectrumState,
): SpectrumStateComparison {
  const frequencyOrder = relativeOrder(pinA.frequencyHz, pinB.frequencyHz);
  return {
    pinA,
    pinB,
    wavelengthRatioBToA: pinB.wavelengthM / pinA.wavelengthM,
    frequencyRatioBToA: pinB.frequencyHz / pinA.frequencyHz,
    pinBWavelength:
      pinB.wavelengthM === pinA.wavelengthM
        ? 'equal'
        : pinB.wavelengthM > pinA.wavelengthM
          ? 'longer'
          : 'shorter',
    pinBFrequency: frequencyOrder,
    pinBPhotonEnergy: frequencyOrder,
    sharedVacuumSpeedMps: LIGHT_SPEED_MPS,
  };
}

export type SpectrumPinSlot = 'A' | 'B';

export interface SpectrumPins {
  A: ContinuousSpectrumState | null;
  B: ContinuousSpectrumState | null;
}

export const EMPTY_SPECTRUM_PINS: SpectrumPins = { A: null, B: null };

export function pinSpectrumState(
  pins: SpectrumPins,
  slot: SpectrumPinSlot,
  state: ContinuousSpectrumState,
): SpectrumPins {
  return { ...pins, [slot]: state };
}

export function comparePinnedSpectrumStates(pins: SpectrumPins): SpectrumStateComparison | null {
  return pins.A && pins.B ? compareSpectrumStates(pins.A, pins.B) : null;
}

// ------------------------------------------------ deterministic calibration challenge

export type SpectrumComparisonProperty = 'wavelength' | 'frequency' | 'photon-energy';
export type SpectrumSelection = 'A' | 'B' | 'equal';

interface SpectrumMissionBase {
  id: string;
  round: 1 | 2 | 3;
}

export interface SpectrumTuneMission extends SpectrumMissionBase {
  kind: 'tune';
  target: ContinuousSpectrumState;
  maxLogPositionError: number;
}

export interface SpectrumCompareMission extends SpectrumMissionBase {
  kind: 'compare';
  pinA: ContinuousSpectrumState;
  pinB: ContinuousSpectrumState;
  property: SpectrumComparisonProperty;
  expectedSelection: SpectrumSelection;
}

export interface SpectrumBoundaryMission extends SpectrumMissionBase {
  kind: 'boundary';
  target: ContinuousSpectrumState;
  expectedRegionIds: readonly EmRegionId[];
}

export type SpectrumCalibrationMission =
  | SpectrumTuneMission
  | SpectrumCompareMission
  | SpectrumBoundaryMission;

export interface SpectrumCalibrationChallenge {
  seed: number;
  replayIndex: number;
  missions: readonly SpectrumCalibrationMission[];
}

const BOUNDARY_WAVELENGTHS_M = [Math.sqrt(1 * 1e-1), Math.sqrt(1e-10 * 1e-11)] as const;

function expectedSelection(
  pinA: ContinuousSpectrumState,
  pinB: ContinuousSpectrumState,
  property: SpectrumComparisonProperty,
): SpectrumSelection {
  const comparison = compareSpectrumStates(pinA, pinB);
  const order =
    property === 'wavelength'
      ? comparison.pinBWavelength === 'longer'
        ? 'higher'
        : comparison.pinBWavelength === 'shorter'
          ? 'lower'
          : 'equal'
      : property === 'frequency'
        ? comparison.pinBFrequency
        : comparison.pinBPhotonEnergy;
  return order === 'equal' ? 'equal' : order === 'higher' ? 'B' : 'A';
}

/** Same seed + replay index always yields the same three outcome-specific missions. */
export function createSpectrumCalibrationChallenge(
  seed: number,
  replayIndex = 0,
): SpectrumCalibrationChallenge {
  if (!Number.isFinite(seed)) throw new RangeError('Challenge seed must be finite.');
  if (!Number.isInteger(replayIndex) || replayIndex < 0) {
    throw new RangeError('Replay index must be a non-negative integer.');
  }
  const normalisedSeed = seed >>> 0;
  const rng = createRng(normalisedSeed);
  const tuneIndex = (Math.floor(rng.range(0, EM_REGIONS.length)) + replayIndex) % EM_REGIONS.length;
  const compareAIndex =
    (Math.floor(rng.range(0, EM_REGIONS.length)) + replayIndex) % EM_REGIONS.length;
  const compareOffset = 1 + Math.floor(rng.range(0, EM_REGIONS.length - 1));
  const compareBIndex = (compareAIndex + compareOffset) % EM_REGIONS.length;
  const properties: readonly SpectrumComparisonProperty[] = [
    'wavelength',
    'frequency',
    'photon-energy',
  ];
  const property = properties[(Math.floor(rng.range(0, properties.length)) + replayIndex) % properties.length];
  const boundaryIndex =
    (Math.floor(rng.range(0, BOUNDARY_WAVELENGTHS_M.length)) + replayIndex) %
    BOUNDARY_WAVELENGTHS_M.length;

  const target = spectrumStateFromWavelength(EM_REGIONS[tuneIndex].representativeM);
  const pinA = spectrumStateFromWavelength(EM_REGIONS[compareAIndex].representativeM);
  const pinB = spectrumStateFromWavelength(EM_REGIONS[compareBIndex].representativeM);
  const boundaryTarget = spectrumStateFromWavelength(BOUNDARY_WAVELENGTHS_M[boundaryIndex]);
  const idPrefix = `spectrum-${normalisedSeed}-${replayIndex}`;

  return {
    seed: normalisedSeed,
    replayIndex,
    missions: [
      {
        id: `${idPrefix}-tune`,
        round: 1,
        kind: 'tune',
        target,
        maxLogPositionError: 0.01,
      },
      {
        id: `${idPrefix}-compare`,
        round: 2,
        kind: 'compare',
        pinA,
        pinB,
        property,
        expectedSelection: expectedSelection(pinA, pinB, property),
      },
      {
        id: `${idPrefix}-boundary`,
        round: 3,
        kind: 'boundary',
        target: boundaryTarget,
        expectedRegionIds: boundaryTarget.candidateRegionIds,
      },
    ],
  };
}

export type SpectrumCalibrationAttempt =
  | { kind: 'tune'; state: ContinuousSpectrumState }
  | { kind: 'compare'; selection: SpectrumSelection }
  | { kind: 'boundary'; selectedRegionIds: readonly EmRegionId[] };

export type SpectrumCalibrationFeedback =
  | 'calibrated'
  | 'move-closer-to-target'
  | 'comparison-correct'
  | 'compare-linked-values'
  | 'boundary-uncertainty-correct'
  | 'include-all-valid-regions'
  | 'invalid-spectrum-state'
  | 'attempt-kind-mismatch';

export interface SpectrumCalibrationResult {
  correct: boolean;
  score: number;
  feedback: SpectrumCalibrationFeedback;
}

function sameRegionSet(a: readonly EmRegionId[], b: readonly EmRegionId[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

export function evaluateSpectrumCalibrationMission(
  mission: SpectrumCalibrationMission,
  attempt: SpectrumCalibrationAttempt,
): SpectrumCalibrationResult {
  if (mission.kind !== attempt.kind) {
    return { correct: false, score: 0, feedback: 'attempt-kind-mismatch' };
  }
  if (mission.kind === 'tune' && attempt.kind === 'tune') {
    if (!isContinuousSpectrumStateConsistent(attempt.state)) {
      return { correct: false, score: 0, feedback: 'invalid-spectrum-state' };
    }
    const error = Math.abs(attempt.state.logPosition - mission.target.logPosition);
    const correct = error <= mission.maxLogPositionError;
    return {
      correct,
      score: correct ? 100 : Math.max(0, Math.min(90, Math.round(90 * (1 - error)))),
      feedback: correct ? 'calibrated' : 'move-closer-to-target',
    };
  }
  if (mission.kind === 'compare' && attempt.kind === 'compare') {
    const correct = attempt.selection === mission.expectedSelection;
    return {
      correct,
      score: correct ? 100 : 0,
      feedback: correct ? 'comparison-correct' : 'compare-linked-values',
    };
  }
  if (mission.kind === 'boundary' && attempt.kind === 'boundary') {
    const correct = sameRegionSet(attempt.selectedRegionIds, mission.expectedRegionIds);
    return {
      correct,
      score: correct ? 100 : 0,
      feedback: correct ? 'boundary-uncertainty-correct' : 'include-all-valid-regions',
    };
  }
  return { correct: false, score: 0, feedback: 'attempt-kind-mismatch' };
}
