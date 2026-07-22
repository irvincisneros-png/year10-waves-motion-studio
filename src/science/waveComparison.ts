/**
 * Pure comparison model for outcome 7.1.3.
 *
 * One scalar wave state drives both views: transverse particles apply its
 * displacement perpendicular to propagation, while longitudinal particles
 * apply the same displacement parallel to propagation. Longitudinal motion is
 * scaled only at the display mapping so particles cannot cross; the underlying
 * displacement, phase, wavelength, period and feature locations remain shared.
 */

import { bandAt, pressureAt, type Band } from './sound';
import {
  TWO_PI,
  displacement,
  periodOfWave,
  waveNumber,
  wavelengthOf,
  type Orientation,
  type WaveParams,
} from './waves';

export type WaveFeatureKind = 'crest' | 'trough' | 'compression' | 'rarefaction';
export type WaveFeatureOrientation = 'transverse' | 'longitudinal';
export type GraphRepresentationAnswer = 'particle-path' | 'quantity-versus-position';

export interface Vector2 {
  readonly x: number;
  readonly y: number;
}

export interface WaveComparisonControls {
  /** Shared displacement amplitude in model metres. */
  readonly amplitude: number;
  /** Shared source frequency in hertz. */
  readonly frequency: number;
}

export interface WaveComparisonScenario extends WaveComparisonControls {
  readonly id: string;
  readonly phase: number;
  readonly targetFeature: WaveFeatureKind;
}

export interface WaveComparisonRun {
  readonly replayIndex: number;
  readonly runKey: string;
  readonly scenario: WaveComparisonScenario;
  readonly controls: WaveComparisonControls;
  readonly wave: WaveParams;
  readonly chamberLength: number;
}

export interface WaveComparisonParticle {
  readonly equilibrium: number;
  /** The single engine displacement used by both representations. */
  readonly sharedDisplacement: number;
  readonly transversePosition: Vector2;
  /** Display-safe longitudinal position; never changes particle ordering. */
  readonly longitudinalPosition: Vector2;
  readonly longitudinalDisplayDisplacement: number;
  readonly normalisedPressure: number;
  readonly longitudinalBand: Band;
}

export interface WaveFeature {
  readonly kind: WaveFeatureKind;
  readonly orientation: WaveFeatureOrientation;
  readonly x: number;
  /** Displacement for crests/troughs; pressure for compression/rarefaction. */
  readonly value: number;
}

export interface WaveComparisonFeatures {
  readonly crest: readonly WaveFeature[];
  readonly trough: readonly WaveFeature[];
  readonly compression: readonly WaveFeature[];
  readonly rarefaction: readonly WaveFeature[];
}

export interface WaveComparisonState {
  readonly run: WaveComparisonRun;
  readonly time: number;
  readonly wave: WaveParams;
  readonly wavelength: number;
  readonly period: number;
  /** Multiplier used only when placing longitudinal particles on screen. */
  readonly longitudinalDisplayScale: number;
  /** Analytic lower bound for displayed dx/dequilibrium; always positive. */
  readonly minimumLongitudinalSpacingFactor: number;
  readonly particles: readonly WaveComparisonParticle[];
  readonly features: WaveComparisonFeatures;
}

export interface WaveDirectionRelationship {
  readonly orientation: Orientation;
  readonly propagation: Vector2;
  readonly displacementAxis: Vector2;
  readonly dotProduct: number;
  readonly angleDegrees: 0 | 90;
  readonly relationship: 'parallel' | 'perpendicular';
}

export interface WaveFeatureProbeResult {
  readonly targetKind: WaveFeatureKind;
  readonly expectedOrientation: WaveFeatureOrientation;
  readonly probeX: number;
  readonly nearestFeature: WaveFeature;
  readonly distance: number;
  readonly tolerance: number;
  readonly correct: boolean;
}

export interface GraphRepresentationTrapState {
  readonly answer: GraphRepresentationAnswer | null;
  readonly status: 'unanswered' | 'correct' | 'incorrect';
  readonly correct: boolean | null;
  readonly explanation: string;
}

export const WAVE_COMPARISON_CHAMBER_LENGTH = 6;
export const WAVE_COMPARISON_SPEED = 3;
export const WAVE_COMPARISON_PARTICLE_COUNT = 49;
export const WAVE_FEATURE_PROBE_TOLERANCE_FRACTION = 0.05;

/**
 * Bounds the largest displacement-gradient magnitude in the display mapping.
 * Since x_display = x + s A sin(kx + ...), dx_display/dx >= 1 - sAk.
 * Keeping sAk <= 0.8 leaves a strict >= 0.2 ordering margin.
 */
export const MAX_LONGITUDINAL_DISPLAY_STRAIN = 0.8;

export const WAVE_COMPARISON_CONTROL_LIMITS = {
  amplitude: { min: 0.2, max: 0.8 },
  frequency: { min: 0.75, max: 2.5 },
} as const;

export const WAVE_COMPARISON_SCENARIOS: readonly WaveComparisonScenario[] = Object.freeze([
  Object.freeze({ id: 'crest-baseline', amplitude: 0.5, frequency: 1.5, phase: 0, targetFeature: 'crest' as const }),
  Object.freeze({ id: 'compression-shifted', amplitude: 0.4, frequency: 1.2, phase: Math.PI / 4, targetFeature: 'compression' as const }),
  Object.freeze({ id: 'trough-close', amplitude: 0.65, frequency: 2, phase: Math.PI / 2, targetFeature: 'trough' as const }),
  Object.freeze({ id: 'rarefaction-wide', amplitude: 0.3, frequency: 0.9, phase: Math.PI, targetFeature: 'rarefaction' as const }),
]);

export const GRAPH_REPRESENTATION_CORRECT_ANSWER: GraphRepresentationAnswer =
  'quantity-versus-position';

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normaliseReplayIndex(replayIndex: number): number {
  const integer = Math.floor(finiteOr(replayIndex, 0));
  const count = WAVE_COMPARISON_SCENARIOS.length;
  return ((integer % count) + count) % count;
}

export function waveComparisonScenarioForReplay(
  replayIndex: number,
): WaveComparisonScenario {
  return WAVE_COMPARISON_SCENARIOS[normaliseReplayIndex(replayIndex)];
}

export function normaliseWaveComparisonControls(
  controls: Partial<WaveComparisonControls>,
  fallback: WaveComparisonControls = WAVE_COMPARISON_SCENARIOS[0],
): WaveComparisonControls {
  const amplitude = finiteOr(controls.amplitude ?? fallback.amplitude, fallback.amplitude);
  const frequency = finiteOr(controls.frequency ?? fallback.frequency, fallback.frequency);
  return {
    amplitude: clamp(
      amplitude,
      WAVE_COMPARISON_CONTROL_LIMITS.amplitude.min,
      WAVE_COMPARISON_CONTROL_LIMITS.amplitude.max,
    ),
    frequency: clamp(
      frequency,
      WAVE_COMPARISON_CONTROL_LIMITS.frequency.min,
      WAVE_COMPARISON_CONTROL_LIMITS.frequency.max,
    ),
  };
}

export interface CreateWaveComparisonRunOptions {
  replayIndex?: number;
  controls?: Partial<WaveComparisonControls>;
  phase?: number;
  targetFeature?: WaveFeatureKind;
}

export function createWaveComparisonRun(
  options: CreateWaveComparisonRunOptions = {},
): WaveComparisonRun {
  const replayIndex = normaliseReplayIndex(options.replayIndex ?? 0);
  const baseScenario = waveComparisonScenarioForReplay(replayIndex);
  const controls = normaliseWaveComparisonControls(options.controls ?? {}, baseScenario);
  const phase = finiteOr(options.phase ?? baseScenario.phase, baseScenario.phase);
  const targetFeature = options.targetFeature ?? baseScenario.targetFeature;
  const scenario: WaveComparisonScenario = {
    id: baseScenario.id,
    ...controls,
    phase,
    targetFeature,
  };
  const wave: WaveParams = {
    amplitude: controls.amplitude,
    frequency: controls.frequency,
    speed: WAVE_COMPARISON_SPEED,
    phase,
  };

  return {
    replayIndex,
    runKey: [replayIndex, controls.amplitude, controls.frequency, phase, targetFeature].join(':'),
    scenario,
    controls,
    wave,
    chamberLength: WAVE_COMPARISON_CHAMBER_LENGTH,
  };
}

/** Reset reconstructs the same deterministic run and carries no UI state. */
export function resetWaveComparison(
  options: CreateWaveComparisonRunOptions = {},
): WaveComparisonRun {
  return createWaveComparisonRun(options);
}

/** Replay advances through the fixed phase/feature scenario sequence. */
export function replayWaveComparison(previous: WaveComparisonRun): WaveComparisonRun {
  return createWaveComparisonRun({ replayIndex: previous.replayIndex + 1 });
}

export function createWaveComparisonEquilibria(
  count = WAVE_COMPARISON_PARTICLE_COUNT,
  chamberLength = WAVE_COMPARISON_CHAMBER_LENGTH,
): readonly number[] {
  const safeCount = Math.max(2, Math.floor(finiteOr(count, WAVE_COMPARISON_PARTICLE_COUNT)));
  const safeLength = Math.max(0, finiteOr(chamberLength, WAVE_COMPARISON_CHAMBER_LENGTH));
  return Array.from({ length: safeCount }, (_, index) => safeLength * index / (safeCount - 1));
}

/** Safe scale for a longitudinal rendering of the shared scalar displacement. */
export function longitudinalDisplayScaleFor(wave: WaveParams): number {
  const strain = Math.abs(wave.amplitude * waveNumber(wavelengthOf(wave)));
  if (strain === 0 || !Number.isFinite(strain)) return 1;
  return Math.min(1, MAX_LONGITUDINAL_DISPLAY_STRAIN / strain);
}

function featureOrientation(kind: WaveFeatureKind): WaveFeatureOrientation {
  return kind === 'crest' || kind === 'trough' ? 'transverse' : 'longitudinal';
}

function featureTargetPhase(kind: WaveFeatureKind): number {
  switch (kind) {
    case 'crest':
      return Math.PI / 2;
    case 'trough':
      return 3 * Math.PI / 2;
    case 'compression':
      return Math.PI;
    case 'rarefaction':
      return 0;
  }
}

function featureValue(kind: WaveFeatureKind, amplitude: number): number {
  return kind === 'trough' || kind === 'rarefaction' ? -amplitude : amplitude;
}

/** Engine-derived feature positions for the current phase and time. */
export function waveFeaturePositions(
  wave: WaveParams,
  time: number,
  chamberLength = WAVE_COMPARISON_CHAMBER_LENGTH,
): WaveComparisonFeatures {
  const wavelength = wavelengthOf(wave);
  const angularFrequency = TWO_PI * wave.frequency;
  const phase = wave.phase ?? 0;
  const safeTime = finiteOr(time, 0);
  const safeLength = Math.max(0, finiteOr(chamberLength, WAVE_COMPARISON_CHAMBER_LENGTH));

  const positionsFor = (kind: WaveFeatureKind): readonly WaveFeature[] => {
    const baseX = wavelength
      * (featureTargetPhase(kind) + angularFrequency * safeTime - phase)
      / TWO_PI;
    const firstIndex = Math.ceil(-baseX / wavelength - 1e-12);
    const features: WaveFeature[] = [];
    for (let index = firstIndex; ; index++) {
      const x = baseX + index * wavelength;
      if (x > safeLength + 1e-10) break;
      if (x >= -1e-10) {
        features.push({
          kind,
          orientation: featureOrientation(kind),
          x: clamp(x, 0, safeLength),
          value: featureValue(kind, wave.amplitude),
        });
      }
    }
    return features;
  };

  return {
    crest: positionsFor('crest'),
    trough: positionsFor('trough'),
    compression: positionsFor('compression'),
    rarefaction: positionsFor('rarefaction'),
  };
}

/** Build one synchronized transverse/longitudinal snapshot for rendering. */
export function waveComparisonStateAt(
  run: WaveComparisonRun,
  time: number,
  equilibria: readonly number[] = createWaveComparisonEquilibria(),
): WaveComparisonState {
  const safeTime = finiteOr(time, 0);
  const wavelength = wavelengthOf(run.wave);
  const period = periodOfWave(run.wave);
  const displayScale = longitudinalDisplayScaleFor(run.wave);
  const maximumStrain = Math.abs(
    displayScale * run.wave.amplitude * waveNumber(wavelength),
  );
  const particles = equilibria.map((equilibrium): WaveComparisonParticle => {
    const sharedDisplacement = displacement(run.wave, equilibrium, safeTime);
    const longitudinalDisplayDisplacement = sharedDisplacement * displayScale;
    return {
      equilibrium,
      sharedDisplacement,
      transversePosition: { x: equilibrium, y: sharedDisplacement },
      longitudinalPosition: {
        x: equilibrium + longitudinalDisplayDisplacement,
        y: 0,
      },
      longitudinalDisplayDisplacement,
      normalisedPressure: pressureAt(run.wave, equilibrium, safeTime),
      longitudinalBand: bandAt(run.wave, equilibrium, safeTime),
    };
  });

  return {
    run,
    time: safeTime,
    wave: run.wave,
    wavelength,
    period,
    longitudinalDisplayScale: displayScale,
    minimumLongitudinalSpacingFactor: 1 - maximumStrain,
    particles,
    features: waveFeaturePositions(run.wave, safeTime, run.chamberLength),
  };
}

/** Positive-axis vectors state the defining geometry independent of oscillation sign. */
export function waveDirectionRelationship(
  orientation: Orientation,
): WaveDirectionRelationship {
  const propagation: Vector2 = { x: 1, y: 0 };
  const displacementAxis: Vector2 = orientation === 'transverse'
    ? { x: 0, y: 1 }
    : { x: 1, y: 0 };
  const dotProduct = propagation.x * displacementAxis.x
    + propagation.y * displacementAxis.y;
  return {
    orientation,
    propagation,
    displacementAxis,
    dotProduct,
    angleDegrees: orientation === 'transverse' ? 90 : 0,
    relationship: orientation === 'transverse' ? 'perpendicular' : 'parallel',
  };
}

/** Evaluate a movable probe against the nearest engine-derived feature. */
export function evaluateWaveFeatureProbe(
  state: WaveComparisonState,
  targetKind: WaveFeatureKind,
  probeX: number,
  toleranceFraction = WAVE_FEATURE_PROBE_TOLERANCE_FRACTION,
): WaveFeatureProbeResult {
  const features = state.features[targetKind];
  // The chamber spans more than one wavelength for every allowed control, so
  // each feature list is non-empty. Keep a defensive invariant for direct use.
  if (features.length === 0) {
    throw new Error(`No ${targetKind} feature exists inside the comparison chamber.`);
  }
  const safeProbeX = finiteOr(probeX, 0);
  const nearestFeature = features.reduce((nearest, feature) => (
    Math.abs(feature.x - safeProbeX) < Math.abs(nearest.x - safeProbeX)
      ? feature
      : nearest
  ));
  const distance = Math.abs(nearestFeature.x - safeProbeX);
  const safeToleranceFraction = Math.max(0, finiteOr(toleranceFraction, 0));
  const tolerance = safeToleranceFraction * state.wavelength;
  return {
    targetKind,
    expectedOrientation: featureOrientation(targetKind),
    probeX: safeProbeX,
    nearestFeature,
    distance,
    tolerance,
    correct: distance <= tolerance,
  };
}

/** Representation trap: a plotted curve is a graph, not a particle trajectory. */
export function evaluateGraphRepresentationTrap(
  answer: GraphRepresentationAnswer | null = null,
): GraphRepresentationTrapState {
  if (answer === null) {
    return {
      answer,
      status: 'unanswered',
      correct: null,
      explanation: 'Choose what the curve represents.',
    };
  }
  const correct = answer === GRAPH_REPRESENTATION_CORRECT_ANSWER;
  return {
    answer,
    status: correct ? 'correct' : 'incorrect',
    correct,
    explanation: correct
      ? 'The curve graphs displacement or pressure against position at one instant.'
      : 'Particles oscillate locally; they do not travel along the shape of the plotted curve.',
  };
}
