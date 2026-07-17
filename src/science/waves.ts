/**
 * 1D linear wave model — the reference engine for the wave laboratory.
 *
 * Model: y(x, t) = A · sin(kx − ωt + φ), with k = 2π/λ and ω = 2πf. The SAME
 * scalar displacement drives both representations (SCIENCE_REVIEW §4):
 *  - transverse: displacement is perpendicular to propagation (vertical y);
 *  - longitudinal: displacement is parallel to propagation, so a particle's
 *    position = equilibrium + displacement (compressions/rarefactions emerge).
 *
 * Source sets frequency; medium sets speed; wavelength is derived λ = v/f;
 * amplitude is independent and appears in neither f nor v (SCIENCE_REVIEW §2.4,
 * §6.3, §7). Pure TS, no React (IMPLEMENTATION_PLAN §5).
 */

import { solveForWavelength, periodOf } from './equations';

export type Orientation = 'transverse' | 'longitudinal';

export interface WaveParams {
  /** Amplitude A ≥ 0 (metres or normalised display units). */
  amplitude: number;
  /** Source frequency f (Hz), > 0 for a travelling wave. */
  frequency: number;
  /** Wave speed v (m/s), set by the medium. */
  speed: number;
  /** Phase offset φ (radians). Defaults to 0. */
  phase?: number;
}

export const TWO_PI = Math.PI * 2;

/** Wavelength λ = v/f (metres). Returns Infinity for a zero-frequency input. */
export function wavelengthOf(p: WaveParams): number {
  const r = solveForWavelength(p.speed, p.frequency);
  return r.ok ? r.value : Infinity;
}

/** Period T = 1/f (seconds). Returns Infinity for a zero-frequency input. */
export function periodOfWave(p: WaveParams): number {
  const r = periodOf(p.frequency);
  return r.ok ? r.value : Infinity;
}

/** Angular frequency ω = 2πf (rad/s). */
export function angularFrequency(frequencyHz: number): number {
  return TWO_PI * frequencyHz;
}

/** Wave number k = 2π/λ (rad/m). Returns 0 for an infinite wavelength. */
export function waveNumber(wavelengthM: number): number {
  if (!Number.isFinite(wavelengthM) || wavelengthM === 0) return 0;
  return TWO_PI / wavelengthM;
}

/**
 * Signed displacement of the medium at equilibrium position x and time t:
 * y = A·sin(kx − ωt + φ). Used identically by both orientations.
 */
export function displacement(p: WaveParams, x: number, t: number): number {
  const lambda = wavelengthOf(p);
  const k = waveNumber(lambda);
  const omega = angularFrequency(p.frequency);
  return p.amplitude * Math.sin(k * x - omega * t + (p.phase ?? 0));
}

export interface Particle {
  /** Rest position along the propagation axis. */
  equilibrium: number;
  /** Signed displacement from equilibrium at this instant. */
  displacement: number;
  /** Rendered position: transverse moves y, longitudinal moves x. */
  x: number;
  y: number;
}

/**
 * Sample a set of medium particles at their equilibrium positions. For
 * transverse waves the particle moves in y; for longitudinal it moves in x
 * (position = equilibrium + displacement), producing compressions/rarefactions.
 */
export function sampleParticles(
  p: WaveParams,
  equilibria: readonly number[],
  t: number,
  orientation: Orientation,
): Particle[] {
  return equilibria.map((eq) => {
    const d = displacement(p, eq, t);
    return orientation === 'transverse'
      ? { equilibrium: eq, displacement: d, x: eq, y: d }
      : { equilibrium: eq, displacement: d, x: eq + d, y: 0 };
  });
}

export interface Sample {
  /** x (for displacement–position) or t (for displacement–time). */
  at: number;
  value: number;
}

/**
 * Displacement–position "snapshot": displacement of every particle at ONE
 * instant t, across x ∈ [xMin, xMax]. Horizontal repeat distance is λ
 * (SCIENCE_REVIEW §8).
 */
export function displacementVsPosition(
  p: WaveParams,
  xMin: number,
  xMax: number,
  samples: number,
  t: number,
): Sample[] {
  const out: Sample[] = [];
  const n = Math.max(2, Math.floor(samples));
  for (let i = 0; i < n; i++) {
    const x = xMin + ((xMax - xMin) * i) / (n - 1);
    out.push({ at: x, value: displacement(p, x, t) });
  }
  return out;
}

/**
 * Displacement–time "single particle history": displacement of ONE particle at
 * position x over t ∈ [tMin, tMax]. Horizontal repeat distance is T
 * (SCIENCE_REVIEW §8).
 */
export function displacementVsTime(
  p: WaveParams,
  x: number,
  tMin: number,
  tMax: number,
  samples: number,
): Sample[] {
  const out: Sample[] = [];
  const n = Math.max(2, Math.floor(samples));
  for (let i = 0; i < n; i++) {
    const t = tMin + ((tMax - tMin) * i) / (n - 1);
    out.push({ at: t, value: displacement(p, x, t) });
  }
  return out;
}

/**
 * Net displacement of a tagged particle over `cycles` whole periods, measured
 * from t0. Analytically this is ~0 in the ideal model (SCIENCE_REVIEW §5,
 * §20.2): after N periods the particle returns to its starting displacement.
 */
export function netDisplacementOverCycles(
  p: WaveParams,
  x: number,
  cycles: number,
  t0 = 0,
): number {
  const T = periodOfWave(p);
  if (!Number.isFinite(T)) return 0;
  const start = displacement(p, x, t0);
  const end = displacement(p, x, t0 + cycles * T);
  return end - start;
}

/**
 * Position of a pulse's energy front after time t, travelling from `origin` at
 * the wave speed. The ENERGY marker moves at v; the medium particles do not
 * (SCIENCE_REVIEW §5). Returns `null` when there is no medium (vacuum).
 */
export function pulseFrontPosition(
  speedMps: number | null,
  t: number,
  origin = 0,
): number | null {
  if (speedMps === null) return null;
  return origin + speedMps * t;
}

export interface WaveSummary {
  amplitude: number;
  frequency: number;
  speed: number;
  wavelength: number;
  period: number;
}

/** Derived, display-ready summary of a wave (all SI, exact). */
export function summariseWave(p: WaveParams): WaveSummary {
  return {
    amplitude: p.amplitude,
    frequency: p.frequency,
    speed: p.speed,
    wavelength: wavelengthOf(p),
    period: periodOfWave(p),
  };
}

/**
 * Update frequency while holding the medium speed fixed — wavelength adjusts so
 * v = fλ still holds (SCIENCE_REVIEW §2.4: "medium controls speed; wavelength
 * changes to satisfy v = fλ").
 */
export function setFrequency(p: WaveParams, newFrequencyHz: number): WaveParams {
  return { ...p, frequency: newFrequencyHz };
}

/** Update amplitude only — MUST leave frequency, speed and wavelength untouched. */
export function setAmplitude(p: WaveParams, newAmplitude: number): WaveParams {
  return { ...p, amplitude: newAmplitude };
}
