/**
 * Pulse and windowed-continuous disturbance models for the chamber comparison
 * (7.1.1) and energy-transfer view (7.1.2).
 *
 * A pulse is a travelling Gaussian displacement bump: the PATTERN moves at the
 * wave speed; each medium particle rises and falls as the pulse passes and
 * returns to equilibrium afterwards (zero net transport — SCIENCE_REVIEW §5).
 * A continuous source is a sine wave whose leading front has only reached
 * x = v·t (no disturbance ahead of the front). Pure TS, no React.
 */

import { angularFrequency, waveNumber } from './waves';

export interface PulseParams {
  /** Peak displacement. */
  amplitude: number;
  /** Propagation speed (m/s in chamber units). */
  speed: number;
  /** Pulse width parameter w (same length unit as x). */
  width: number;
  /** Time the pulse was launched. */
  startTime: number;
  /** Launch position (default 0 = left edge). */
  origin?: number;
}

/** Displacement at position x, time t for a travelling Gaussian pulse. */
export function pulseDisplacement(p: PulseParams, x: number, t: number): number {
  const elapsed = t - p.startTime;
  if (elapsed < 0) return 0;
  const centre = (p.origin ?? 0) + p.speed * elapsed;
  const arg = (x - centre) / p.width;
  return p.amplitude * Math.exp(-arg * arg);
}

/** True once the pulse centre has passed beyond `chamberLength` by 3 widths. */
export function pulseHasExited(p: PulseParams, chamberLength: number, t: number): boolean {
  const elapsed = t - p.startTime;
  if (elapsed < 0) return false;
  const centre = (p.origin ?? 0) + p.speed * elapsed;
  return centre > chamberLength + 3 * p.width;
}

export interface ContinuousParams {
  amplitude: number;
  frequency: number;
  speed: number;
  /** Time the source started oscillating. */
  startTime: number;
}

/**
 * Displacement for a continuous sine source at the left edge whose wavefront
 * has only reached x = v·(t − t0): ahead of the front the medium is
 * undisturbed (causality — the disturbance cannot outrun the wave speed).
 */
export function continuousDisplacement(c: ContinuousParams, x: number, t: number): number {
  const elapsed = t - c.startTime;
  if (elapsed < 0) return 0;
  const front = c.speed * elapsed;
  if (x > front || x < 0) return 0;
  const lambda = c.speed / c.frequency;
  const k = waveNumber(lambda);
  const omega = angularFrequency(c.frequency);
  return c.amplitude * Math.sin(k * x - omega * elapsed);
}
