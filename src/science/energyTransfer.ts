/**
 * Pure model for outcome 7.1.2: a travelling pulse transfers energy across a
 * medium while each tagged particle remains centred on one immutable
 * equilibrium position. The Gaussian pulse itself is supplied by pulse.ts;
 * this module adds the receiver, particle histories and evidence-based Energy
 * Relay challenge used by the canonical simulator.
 */

import {
  pulseDisplacement,
  pulseHasExited,
  type PulseParams,
} from './pulse';

export type EnergyRelayParticleId = 'B' | 'D' | 'F' | 'H';
export type EnergyRelayEventStatus = 'ready' | 'travelling' | 'complete';
export type EnergyRelayReceiverState = 'ready' | 'waiting' | 'received';

export interface EnergyRelayControls {
  /** Peak local particle displacement in model metres. */
  amplitude: number;
  /** Gaussian pulse width in model metres. */
  pulseWidth: number;
}

export interface TrackableParticle {
  readonly id: EnergyRelayParticleId;
  readonly equilibrium: number;
}

export interface EnergyRelayScenario extends EnergyRelayControls {
  readonly id: string;
  readonly targetParticleId: EnergyRelayParticleId;
}

export interface EnergyRelayRun {
  readonly replayIndex: number;
  readonly runKey: string;
  readonly scenario: EnergyRelayScenario;
  readonly controls: EnergyRelayControls;
  readonly launchTime: number;
  readonly pulse: PulseParams;
  readonly receiverArrivalTime: number;
  readonly completionTime: number;
}

export interface EnergyRelayParticleState {
  readonly id: EnergyRelayParticleId;
  /** Rest position; never changes during or between samples of a run. */
  readonly equilibrium: number;
  readonly currentDisplacement: number;
  readonly currentPosition: number;
  /** Analytic time at which the pulse centre reaches this particle. */
  readonly peakTime: number;
  readonly peakDisplacement: number;
  /** Start-to-finish offset; available only when the full event is complete. */
  readonly finalNetDisplacement: number | null;
  readonly returnedHome: boolean;
}

export interface EnergyRelayReceiver {
  readonly equilibrium: number;
  readonly state: EnergyRelayReceiverState;
  readonly receivedAt: number;
}

export interface EnergyRelayState {
  readonly run: EnergyRelayRun;
  readonly time: number;
  readonly elapsed: number;
  readonly status: EnergyRelayEventStatus;
  readonly eventComplete: boolean;
  /** Position of the pulse centre. Null before launch. */
  readonly pulseCentrePosition: number | null;
  readonly receiver: EnergyRelayReceiver;
  readonly particles: readonly EnergyRelayParticleState[];
}

export interface EnergyRelayCapture {
  readonly runKey: string;
  readonly particleId: EnergyRelayParticleId;
  readonly time: number;
  readonly displacement: number;
}

export interface EnergyRelayEvidence {
  readonly peakCapture?: EnergyRelayCapture;
  readonly returnCapture?: EnergyRelayCapture;
}

export interface EnergyRelayChallengeChecks {
  readonly completedSimulatedEvidence: boolean;
  readonly peakCapturedNearMaximum: boolean;
  readonly returnCapturedAfterPeak: boolean;
  readonly sameTargetParticle: boolean;
}

export interface EnergyRelayChallengeResult {
  readonly checks: EnergyRelayChallengeChecks;
  readonly score: number;
  readonly maxScore: 100;
  readonly mastery: 'locked' | 'developing' | 'energy-relay-complete';
}

export const ENERGY_RELAY_CHAMBER_LENGTH = 10;
export const ENERGY_RELAY_PROPAGATION_SPEED = 2.5;
export const ENERGY_RELAY_HOME_TOLERANCE_FRACTION = 0.01;
export const ENERGY_RELAY_PEAK_CAPTURE_FRACTION = 0.9;

export const ENERGY_RELAY_CONTROL_LIMITS = {
  amplitude: { min: 0.2, max: 1 },
  pulseWidth: { min: 0.35, max: 1.2 },
} as const;

/** Tag definitions are frozen so equilibrium positions cannot be mutated. */
export const ENERGY_RELAY_PARTICLES: readonly TrackableParticle[] = Object.freeze([
  Object.freeze({ id: 'B' as const, equilibrium: 2 }),
  Object.freeze({ id: 'D' as const, equilibrium: 4 }),
  Object.freeze({ id: 'F' as const, equilibrium: 6 }),
  Object.freeze({ id: 'H' as const, equilibrium: 8 }),
]);

/** A short fixed sequence gives replay variety without random or stale state. */
export const ENERGY_RELAY_SCENARIOS: readonly EnergyRelayScenario[] = Object.freeze([
  Object.freeze({ id: 'middle-medium', targetParticleId: 'D' as const, amplitude: 0.6, pulseWidth: 0.7 }),
  Object.freeze({ id: 'near-narrow', targetParticleId: 'B' as const, amplitude: 0.4, pulseWidth: 0.5 }),
  Object.freeze({ id: 'far-wide', targetParticleId: 'H' as const, amplitude: 0.8, pulseWidth: 0.9 }),
  Object.freeze({ id: 'middle-narrow', targetParticleId: 'F' as const, amplitude: 0.7, pulseWidth: 0.4 }),
]);

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normaliseReplayIndex(replayIndex: number): number {
  const integer = Math.floor(finiteOr(replayIndex, 0));
  const count = ENERGY_RELAY_SCENARIOS.length;
  return ((integer % count) + count) % count;
}

export function energyRelayScenarioForReplay(replayIndex: number): EnergyRelayScenario {
  return ENERGY_RELAY_SCENARIOS[normaliseReplayIndex(replayIndex)];
}

/** Invalid UI values fall back or clamp without ever exposing a speed control. */
export function normaliseEnergyRelayControls(
  controls: Partial<EnergyRelayControls>,
  fallback: EnergyRelayControls = ENERGY_RELAY_SCENARIOS[0],
): EnergyRelayControls {
  const amplitude = finiteOr(controls.amplitude ?? fallback.amplitude, fallback.amplitude);
  const pulseWidth = finiteOr(controls.pulseWidth ?? fallback.pulseWidth, fallback.pulseWidth);
  return {
    amplitude: clamp(
      amplitude,
      ENERGY_RELAY_CONTROL_LIMITS.amplitude.min,
      ENERGY_RELAY_CONTROL_LIMITS.amplitude.max,
    ),
    pulseWidth: clamp(
      pulseWidth,
      ENERGY_RELAY_CONTROL_LIMITS.pulseWidth.min,
      ENERGY_RELAY_CONTROL_LIMITS.pulseWidth.max,
    ),
  };
}

export interface CreateEnergyRelayRunOptions {
  replayIndex?: number;
  launchTime?: number;
  controls?: Partial<EnergyRelayControls>;
  targetParticleId?: EnergyRelayParticleId;
}

/** Create one deterministic, launched Energy Relay run. */
export function createEnergyRelayRun(
  options: CreateEnergyRelayRunOptions = {},
): EnergyRelayRun {
  const replayIndex = normaliseReplayIndex(options.replayIndex ?? 0);
  const baseScenario = energyRelayScenarioForReplay(replayIndex);
  const controls = normaliseEnergyRelayControls(options.controls ?? {}, baseScenario);
  const launchTime = finiteOr(options.launchTime ?? 0, 0);
  const targetParticleId = options.targetParticleId ?? baseScenario.targetParticleId;
  const scenario: EnergyRelayScenario = {
    ...controls,
    id: baseScenario.id,
    targetParticleId,
  };
  const pulse: PulseParams = {
    amplitude: controls.amplitude,
    speed: ENERGY_RELAY_PROPAGATION_SPEED,
    width: controls.pulseWidth,
    startTime: launchTime,
    origin: 0,
  };
  const receiverArrivalTime = launchTime
    + ENERGY_RELAY_CHAMBER_LENGTH / ENERGY_RELAY_PROPAGATION_SPEED;
  const completionTime = launchTime
    + (ENERGY_RELAY_CHAMBER_LENGTH + 3 * controls.pulseWidth)
      / ENERGY_RELAY_PROPAGATION_SPEED;
  const runKey = [
    replayIndex,
    launchTime,
    controls.amplitude,
    controls.pulseWidth,
    targetParticleId,
  ].join(':');

  return {
    replayIndex,
    runKey,
    scenario,
    controls,
    launchTime,
    pulse,
    receiverArrivalTime,
    completionTime,
  };
}

/** Reset reconstructs the same run from inputs; it does not retain evidence. */
export function resetEnergyRelay(
  options: CreateEnergyRelayRunOptions = {},
): EnergyRelayRun {
  return createEnergyRelayRun(options);
}

/** Replay advances through the fixed scenario sequence deterministically. */
export function replayEnergyRelay(
  previous: EnergyRelayRun,
  launchTime = previous.launchTime,
): EnergyRelayRun {
  return createEnergyRelayRun({ replayIndex: previous.replayIndex + 1, launchTime });
}

function particleById(id: EnergyRelayParticleId): TrackableParticle {
  return ENERGY_RELAY_PARTICLES.find((particle) => particle.id === id)!;
}

function finalDisplacement(run: EnergyRelayRun, equilibrium: number): number {
  return pulseDisplacement(run.pulse, equilibrium, run.completionTime);
}

/** Sample all visual, semantic-table and challenge state from the same pulse. */
export function energyRelayStateAt(run: EnergyRelayRun, time: number): EnergyRelayState {
  const safeTime = finiteOr(time, run.launchTime);
  const elapsed = safeTime - run.launchTime;
  const beforeLaunch = elapsed < 0;
  // pulseHasExited uses a strict boundary. The analytic completion time makes
  // the public event boundary inclusive and stable for manual stepping.
  const eventComplete = !beforeLaunch
    && (safeTime >= run.completionTime
      || pulseHasExited(run.pulse, ENERGY_RELAY_CHAMBER_LENGTH, safeTime));
  const status: EnergyRelayEventStatus = beforeLaunch
    ? 'ready'
    : eventComplete
      ? 'complete'
      : 'travelling';
  const receiverState: EnergyRelayReceiverState = beforeLaunch
    ? 'ready'
    : safeTime >= run.receiverArrivalTime
      ? 'received'
      : 'waiting';

  const particles = ENERGY_RELAY_PARTICLES.map((particle): EnergyRelayParticleState => {
    const currentDisplacement = pulseDisplacement(run.pulse, particle.equilibrium, safeTime);
    const peakTime = run.launchTime
      + particle.equilibrium / ENERGY_RELAY_PROPAGATION_SPEED;
    const net = eventComplete ? finalDisplacement(run, particle.equilibrium) : null;
    return {
      id: particle.id,
      equilibrium: particle.equilibrium,
      currentDisplacement,
      currentPosition: particle.equilibrium + currentDisplacement,
      peakTime,
      peakDisplacement: run.controls.amplitude,
      finalNetDisplacement: net,
      returnedHome: net !== null
        && Math.abs(net)
          < ENERGY_RELAY_HOME_TOLERANCE_FRACTION * run.controls.amplitude,
    };
  });

  return {
    run,
    time: safeTime,
    elapsed,
    status,
    eventComplete,
    pulseCentrePosition: beforeLaunch
      ? null
      : ENERGY_RELAY_PROPAGATION_SPEED * elapsed,
    receiver: {
      equilibrium: ENERGY_RELAY_CHAMBER_LENGTH,
      state: receiverState,
      receivedAt: run.receiverArrivalTime,
    },
    particles,
  };
}

/** Record model evidence from a sampled state; the scorer rechecks its time. */
export function captureEnergyRelayParticle(
  state: EnergyRelayState,
  particleId: EnergyRelayParticleId = state.run.scenario.targetParticleId,
): EnergyRelayCapture {
  const particle = particleById(particleId);
  return {
    runKey: state.run.runKey,
    particleId,
    time: state.time,
    displacement: pulseDisplacement(state.run.pulse, particle.equilibrium, state.time),
  };
}

function validCaptureForState(
  state: EnergyRelayState,
  capture: EnergyRelayCapture | undefined,
): capture is EnergyRelayCapture {
  return capture !== undefined
    && capture.runKey === state.run.runKey
    && Number.isFinite(capture.time)
    && capture.time >= state.run.launchTime
    && capture.time <= state.time;
}

/**
 * Score only evidence produced by a completed simulation. Peak and return
 * marks are evaluated from the pulse at their timestamps, so clicks at the
 * wrong state cannot satisfy the challenge.
 */
export function scoreEnergyRelayChallenge(
  state: EnergyRelayState,
  evidence: EnergyRelayEvidence,
): EnergyRelayChallengeResult {
  const targetId = state.run.scenario.targetParticleId;
  const target = state.particles.find((particle) => particle.id === targetId)!;
  const peakCaptureValid = validCaptureForState(state, evidence.peakCapture);
  const returnCaptureValid = validCaptureForState(state, evidence.returnCapture);
  const sameTargetParticle = peakCaptureValid
    && returnCaptureValid
    && evidence.peakCapture.particleId === targetId
    && evidence.returnCapture.particleId === targetId;
  const peakAtCapture = peakCaptureValid
    ? pulseDisplacement(state.run.pulse, target.equilibrium, evidence.peakCapture.time)
    : 0;
  const returnAtCapture = returnCaptureValid
    ? pulseDisplacement(state.run.pulse, target.equilibrium, evidence.returnCapture.time)
    : Number.POSITIVE_INFINITY;
  const peakCapturedNearMaximum = sameTargetParticle
    && Math.abs(peakAtCapture)
      >= ENERGY_RELAY_PEAK_CAPTURE_FRACTION * state.run.controls.amplitude;
  const returnCapturedAfterPeak = sameTargetParticle
    && evidence.returnCapture.time > target.peakTime
    && Math.abs(returnAtCapture)
      < ENERGY_RELAY_HOME_TOLERANCE_FRACTION * state.run.controls.amplitude;
  const completedSimulatedEvidence = state.eventComplete
    && state.receiver.state === 'received'
    && target.finalNetDisplacement !== null
    && Math.abs(target.finalNetDisplacement)
      < ENERGY_RELAY_HOME_TOLERANCE_FRACTION * state.run.controls.amplitude;
  const score = completedSimulatedEvidence
    ? (peakCapturedNearMaximum ? 50 : 0) + (returnCapturedAfterPeak ? 50 : 0)
    : 0;

  return {
    checks: {
      completedSimulatedEvidence,
      peakCapturedNearMaximum,
      returnCapturedAfterPeak,
      sameTargetParticle,
    },
    score,
    maxScore: 100,
    mastery: !completedSimulatedEvidence
      ? 'locked'
      : score === 100
        ? 'energy-relay-complete'
        : 'developing',
  };
}
