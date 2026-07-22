/**
 * Pure scientific model for the outcome 7.1.1 transmission comparison.
 *
 * The three bays deliberately isolate one question: does this wave require a
 * material medium? Display speeds are illustrative classroom-model values and
 * are not a scale comparison between mechanical and electromagnetic waves.
 */

export type TransmissionBayId =
  | 'mechanical-medium'
  | 'mechanical-vacuum'
  | 'em-vacuum';

export type WaveFamily = 'mechanical' | 'electromagnetic';
export type BayEnvironment = 'material-medium' | 'vacuum';
export type DetectorState = 'ready' | 'travelling' | 'blocked' | 'received';

export interface TransmissionBay {
  id: TransmissionBayId;
  shortLabel: string;
  waveFamily: WaveFamily;
  environment: BayEnvironment;
  transmits: boolean;
}

export interface MediumModelSettings {
  amplitude: number;
  coupling: number;
  density: number;
}

export interface BayRuntimeState {
  bay: TransmissionBay;
  detectorState: DetectorState;
  frontPosition: number | null;
  displaySpeed: number | null;
}

export type ChallengePredictions = Partial<Record<TransmissionBayId, boolean>>;

export interface ChallengeResult {
  correctCount: number;
  maxScore: number;
  mastery: 'exploring' | 'developing' | 'mission-ready';
  score: number;
  results: Record<TransmissionBayId, boolean>;
}

export const TRANSMISSION_CHAMBER_LENGTH = 10;
export const SOURCE_FREQUENCY_HZ = 1;
export const EM_DISPLAY_SPEED = 6;

export const TRANSMISSION_BAYS: readonly TransmissionBay[] = [
  {
    id: 'mechanical-medium',
    shortLabel: 'Mechanical + material',
    waveFamily: 'mechanical',
    environment: 'material-medium',
    transmits: true,
  },
  {
    id: 'mechanical-vacuum',
    shortLabel: 'Mechanical + vacuum',
    waveFamily: 'mechanical',
    environment: 'vacuum',
    transmits: false,
  },
  {
    id: 'em-vacuum',
    shortLabel: 'EM + vacuum',
    waveFamily: 'electromagnetic',
    environment: 'vacuum',
    transmits: true,
  },
] as const;

/** Mechanical propagation speed in model metres per second. */
export function mechanicalDisplaySpeed(coupling: number, density: number): number {
  const safeCoupling = Math.min(100, Math.max(0, coupling));
  const safeDensity = Math.min(3, Math.max(0.5, density));
  return 4 * Math.sqrt((0.2 + safeCoupling / 100) / safeDensity);
}

/**
 * Transmission truth table. Mechanical waves require matter; EM waves do not.
 */
export function waveTransmits(
  waveFamily: WaveFamily,
  environment: BayEnvironment,
): boolean {
  return waveFamily === 'electromagnetic' || environment === 'material-medium';
}

export function bayDisplaySpeed(
  bay: TransmissionBay,
  settings: MediumModelSettings,
): number | null {
  if (!bay.transmits) return null;
  return bay.waveFamily === 'electromagnetic'
    ? EM_DISPLAY_SPEED
    : mechanicalDisplaySpeed(settings.coupling, settings.density);
}

/** State used by both the Canvas scene and its semantic table equivalent. */
export function bayRuntimeState(
  bay: TransmissionBay,
  settings: MediumModelSettings,
  elapsedSeconds: number | null,
): BayRuntimeState {
  if (elapsedSeconds === null) {
    return { bay, detectorState: 'ready', frontPosition: null, displaySpeed: bayDisplaySpeed(bay, settings) };
  }
  if (!bay.transmits) {
    return { bay, detectorState: 'blocked', frontPosition: null, displaySpeed: null };
  }

  const displaySpeed = bayDisplaySpeed(bay, settings)!;
  const frontPosition = Math.max(0, displaySpeed * Math.max(0, elapsedSeconds));
  return {
    bay,
    detectorState:
      frontPosition >= TRANSMISSION_CHAMBER_LENGTH ? 'received' : 'travelling',
    frontPosition,
    displaySpeed,
  };
}

export function scoreTransmissionChallenge(
  predictions: ChallengePredictions,
): ChallengeResult | null {
  if (TRANSMISSION_BAYS.some((bay) => predictions[bay.id] === undefined)) {
    return null;
  }

  const results = Object.fromEntries(
    TRANSMISSION_BAYS.map((bay) => [bay.id, predictions[bay.id] === bay.transmits]),
  ) as Record<TransmissionBayId, boolean>;
  const correctCount = Object.values(results).filter(Boolean).length;
  return {
    correctCount,
    maxScore: 300,
    mastery:
      correctCount === 3
        ? 'mission-ready'
        : correctCount === 2
          ? 'developing'
          : 'exploring',
    score: correctCount * 100,
    results,
  };
}

/** Mastery scoring is unlocked only after the student has run the model. */
export function hasDetectorEvidence(launchCount: number): boolean {
  return Number.isFinite(launchCount) && launchCount >= 1;
}
