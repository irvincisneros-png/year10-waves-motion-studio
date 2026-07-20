/**
 * 1D Doppler engine (outcome 7.2.3, SCIENCE_REVIEW §12.3, app plan §6.3).
 *
 * The observed frequency change is modelled from WAVEFRONT ARRIVAL TIMING, not
 * from any change to the source. Sign convention: the positive direction is to
 * the right (+x). A wavefront (a crest) emitted at time τ leaves the source
 * position S(τ) and travels outward at the medium sound speed v, which is FIXED
 * relative to the medium and never depends on the source motion. The observer
 * detects a crest when a wavefront edge reaches the observer's position.
 *
 * Guardrails (SCIENCE_REVIEW §12.3, §20.5):
 *  - the source frequency NEVER changes because the source moves;
 *  - the wave speed relative to the medium is fixed;
 *  - only subsonic motion is modelled (|v_source|, |v_observer| < v); supersonic
 *    / sonic-boom behaviour is out of scope and is rejected, never faked.
 *
 * The arrival-timing model is validated against the closed-form Doppler result
 * f' = f·(v − v_o)/(v − v_s) (invariant 20.5). Pure TS, no React.
 */

export type DopplerError = { ok: false; code: string; message: string };
export type Solved<T> = { ok: true; value: T };
export type DopplerResult<T> = Solved<T> | DopplerError;

const err = (code: string, message: string): DopplerError => ({ ok: false, code, message });

export interface DopplerConfig {
  /** Source (emitted) frequency, Hz. Constant — unaffected by motion. */
  sourceFreqHz: number;
  /** Medium sound speed, m/s. Fixed relative to the medium. */
  soundSpeedMps: number;
  /** Source velocity along the track, m/s (+ = rightward). */
  sourceVelMps: number;
  /** Observer velocity along the track, m/s (+ = rightward). */
  observerVelMps: number;
  /** Initial source position, m (default 0). */
  sourceX0?: number;
  /** Initial observer position, m (default +40, i.e. to the right of the source). */
  observerX0?: number;
}

const SOURCE_X0 = 0;
const OBSERVER_X0 = 40;

export function sourceStart(cfg: DopplerConfig): number {
  return cfg.sourceX0 ?? SOURCE_X0;
}
export function observerStart(cfg: DopplerConfig): number {
  return cfg.observerX0 ?? OBSERVER_X0;
}

/** Source position at time t. */
export function sourcePosition(cfg: DopplerConfig, t: number): number {
  return sourceStart(cfg) + cfg.sourceVelMps * t;
}
/** Observer position at time t. */
export function observerPosition(cfg: DopplerConfig, t: number): number {
  return observerStart(cfg) + cfg.observerVelMps * t;
}

/** True when both motions are strictly subsonic (guardrail — required). */
export function isSubsonic(cfg: DopplerConfig): boolean {
  const v = cfg.soundSpeedMps;
  return Math.abs(cfg.sourceVelMps) < v && Math.abs(cfg.observerVelMps) < v;
}

/**
 * Closed-form steady-state detected frequency for collinear motion with the
 * observer to the right of the source: f' = f·(v − v_o)/(v − v_s). Rejects
 * supersonic input (never returns a faked number).
 */
export function detectedFrequencyClosedForm(cfg: DopplerConfig): DopplerResult<number> {
  const { sourceFreqHz: f, soundSpeedMps: v, sourceVelMps: vs, observerVelMps: vo } = cfg;
  if (![f, v, vs, vo].every(Number.isFinite)) {
    return err('non-finite', 'All Doppler inputs must be numbers.');
  }
  if (v <= 0) return err('bad-speed', 'The medium sound speed must be positive.');
  if (f <= 0) return err('bad-frequency', 'The source frequency must be positive.');
  if (!isSubsonic(cfg)) {
    return err(
      'supersonic',
      'Source and observer must both move slower than the speed of sound — sonic-boom behaviour is out of scope.',
    );
  }
  return { ok: true, value: (f * (v - vo)) / (v - vs) };
}

/** Emission times of the first `count` wavefronts (crests), τ = n/f. */
export function emissionTimes(sourceFreqHz: number, count: number): number[] {
  const T = 1 / sourceFreqHz;
  return Array.from({ length: Math.max(0, Math.floor(count)) }, (_, n) => n * T);
}

/**
 * Arrival time at the (possibly moving) observer of the wavefront emitted at
 * time τ. Solves the 1D arrival equation |O(t) − S(τ)| = v·(t − τ) for the
 * wavefront edge on the observer's side. Returns `null` if no valid arrival
 * (t ≥ τ) exists — which does not happen for subsonic motion.
 */
export function arrivalTime(cfg: DopplerConfig, tau: number): number | null {
  const v = cfg.soundSpeedMps;
  const sAtEmit = sourcePosition(cfg, tau);
  const oAtEmit = observerPosition(cfg, tau);
  const sepAtEmit = oAtEmit - sAtEmit; // + ⇒ observer is to the right of the source

  let t: number;
  if (sepAtEmit >= 0) {
    // Rightward edge S(τ)+v(t−τ) meets the observer O(t).
    // t·(v − v_o) = O0 − S0 + (v − v_s)·τ
    const denom = v - cfg.observerVelMps;
    if (denom === 0) return null;
    t = (observerStart(cfg) - sourceStart(cfg) + (v - cfg.sourceVelMps) * tau) / denom;
  } else {
    // Leftward edge S(τ)−v(t−τ) meets the observer O(t).
    // t·(v + v_o) = S0 − O0 + (v + v_s)·τ
    const denom = v + cfg.observerVelMps;
    if (denom === 0) return null;
    t = (sourceStart(cfg) - observerStart(cfg) + (v + cfg.sourceVelMps) * tau) / denom;
  }
  return t >= tau - 1e-9 ? t : null;
}

/**
 * Detected inter-crest interval in the steady collinear regime, from two
 * consecutive wavefronts. Equals (v − v_s)/(v − v_o)·T, i.e. 1/f'.
 */
export function detectedIntervalModel(cfg: DopplerConfig): DopplerResult<number> {
  if (!isSubsonic(cfg)) {
    return err('supersonic', 'Subsonic motion only — sonic boom is out of scope.');
  }
  const times = emissionTimes(cfg.sourceFreqHz, 2);
  const a = arrivalTime(cfg, times[0]);
  const b = arrivalTime(cfg, times[1]);
  if (a === null || b === null) return err('no-arrival', 'No valid arrival for this configuration.');
  return { ok: true, value: b - a };
}

/** Detected frequency derived from the arrival-timing model (= 1/interval). */
export function detectedFrequencyModel(cfg: DopplerConfig): DopplerResult<number> {
  const interval = detectedIntervalModel(cfg);
  if (!interval.ok) return interval;
  if (interval.value <= 0) return err('degenerate', 'Non-positive detected interval.');
  return { ok: true, value: 1 / interval.value };
}

export interface WavefrontEdges {
  emittedAt: number;
  emittedFrom: number;
  /** Left edge position at the query time. */
  left: number;
  /** Right edge position at the query time. */
  right: number;
}

/**
 * Positions of the expanding wavefront edges at time `t` for every crest
 * emitted up to `t` (for the Canvas visualisation). Each front is a pair of
 * edges spreading symmetrically at the (fixed) medium speed from where the
 * source was when it emitted them — the classic bunched-ahead / stretched-behind
 * pattern emerges from the source having moved between emissions.
 */
export function wavefrontEdges(cfg: DopplerConfig, t: number, maxFronts = 24): WavefrontEdges[] {
  const v = cfg.soundSpeedMps;
  const T = 1 / cfg.sourceFreqHz;
  const out: WavefrontEdges[] = [];
  const lastN = Math.floor(t / T);
  const firstN = Math.max(0, lastN - maxFronts + 1);
  for (let n = firstN; n <= lastN; n++) {
    const tau = n * T;
    if (tau > t) continue;
    const from = sourcePosition(cfg, tau);
    const r = v * (t - tau);
    out.push({ emittedAt: tau, emittedFrom: from, left: from - r, right: from + r });
  }
  return out;
}

export interface DetectedSample {
  /** Midpoint time between the two crest arrivals (s). */
  at: number;
  /** Detected frequency over that interval (Hz). */
  value: number;
}

/**
 * Detected-frequency-versus-time series over a window: emit crests, compute
 * their arrival times at the observer, sort, and report 1/interval at each
 * successive midpoint. This produces the characteristic higher-while-approaching
 * / lower-while-receding curve (and the step as a source passes the observer)
 * directly from arrival timing — the whole point of the model.
 */
export function detectedFrequencySeries(
  cfg: DopplerConfig,
  windowS: number,
  maxCrests = 20000,
): DetectedSample[] {
  if (!isSubsonic(cfg)) return [];
  // Emit enough crests to cover the whole window (a crest emitted at τ can only
  // arrive after τ, so τ ≤ windowS is sufficient), capped for safety.
  const needed = Math.min(maxCrests, Math.floor(windowS * cfg.sourceFreqHz) + 2);
  const times = emissionTimes(cfg.sourceFreqHz, needed);
  const arrivals: number[] = [];
  for (const tau of times) {
    if (tau > windowS) break;
    const a = arrivalTime(cfg, tau);
    if (a !== null && a >= 0 && a <= windowS) arrivals.push(a);
  }
  arrivals.sort((x, y) => x - y);
  const out: DetectedSample[] = [];
  for (let i = 1; i < arrivals.length; i++) {
    const dt = arrivals[i] - arrivals[i - 1];
    if (dt > 1e-6) out.push({ at: (arrivals[i] + arrivals[i - 1]) / 2, value: 1 / dt });
  }
  return out;
}

export interface DopplerPreset {
  id: string;
  label: string;
  sourceVelMps: number;
  observerVelMps: number;
  /** Short plain-language description of what the observer hears. */
  summary: string;
}

/**
 * Named scenarios (CONTROL_INVENTORY `sound-lab.doppler-preset-select`). Observer
 * starts to the right of the source. Approaching ⇒ higher detected pitch;
 * receding ⇒ lower. All velocities are well subsonic.
 */
export const DOPPLER_PRESETS: readonly DopplerPreset[] = [
  {
    id: 'stationary',
    label: 'Stationary source and observer',
    sourceVelMps: 0,
    observerVelMps: 0,
    summary: 'Nothing moves: the detected frequency equals the source frequency.',
  },
  {
    id: 'approach',
    label: 'Source approaching',
    sourceVelMps: 25,
    observerVelMps: 0,
    summary: 'The source moves towards the observer: wavefronts bunch up, so the detected pitch is higher.',
  },
  {
    id: 'pass',
    label: 'Source passing by',
    sourceVelMps: 34,
    observerVelMps: 0,
    summary: 'The source drives past the observer: detected pitch is high while approaching, then drops as it recedes.',
  },
  {
    id: 'recede',
    label: 'Source receding',
    sourceVelMps: -25,
    observerVelMps: 0,
    summary: 'The source moves away: wavefronts stretch out, so the detected pitch is lower.',
  },
  {
    id: 'moving-observer',
    label: 'Observer moving towards source',
    sourceVelMps: 0,
    observerVelMps: -20,
    summary: 'The observer moves towards a still source: they meet wavefronts sooner, so the detected pitch is higher.',
  },
  {
    id: 'both-moving',
    label: 'Both moving (source chasing)',
    sourceVelMps: 20,
    observerVelMps: 12,
    summary: 'Both move rightwards; the detected pitch depends on how the two velocities combine.',
  },
];

export function dopplerPresetById(id: string): DopplerPreset | undefined {
  return DOPPLER_PRESETS.find((p) => p.id === id);
}
