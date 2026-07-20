/**
 * Longitudinal sound model — the reference engine for the sound laboratory
 * (outcomes 7.2.1 compression/rarefaction and 7.2.2 pitch/loudness).
 *
 * Built on the shared 1D wave model (`waves.ts`): the SAME scalar displacement
 * y(x, t) = A·sin(kx − ωt + φ) drives the vibrating source, the air-particle
 * field, the compression/rarefaction bands and the pressure-vs-time trace at a
 * microphone (SCIENCE_REVIEW §4, §12, app plan §6.1). Sound is longitudinal, so
 * a particle's position = equilibrium + displacement along the propagation axis;
 * where particles bunch is a compression (high pressure), where they spread is a
 * rarefaction (low pressure).
 *
 * Medium/temperature speeds come from SCIENCE_REVIEW §6.2 ONLY (each labelled a
 * reference approximation). Pure TS, no React (IMPLEMENTATION_PLAN §5).
 */

import {
  angularFrequency,
  displacement,
  waveNumber,
  wavelengthOf,
  type Sample,
  type WaveParams,
} from './waves';
import { CONSTANTS_REVIEW_DATE } from './constants';

// ------------------------------------------------------------ medium presets

export interface SoundMediumPreset {
  id: string;
  label: string;
  /** Exact stored speed in m/s. */
  speedMps: number;
  conditions: string;
  source: string;
  reviewDate: string;
  /** True when the value is modelled from the air-temperature formula, not a
   * directly-sourced constant. */
  modelled?: boolean;
}

/** Reference speed of sound in dry air at ~20 °C (SCIENCE_REVIEW §6.2). */
export const SOUND_SPEED_AIR_20C = 343;

/**
 * Speed of sound in dry air at temperature T °C, from the standard model
 * `v = 331.3 × √(1 + T/273.15)` (SCIENCE_REVIEW §6.2 note). Labelled a model;
 * not a calibrated measurement.
 */
export function soundSpeedInAir(tempC: number): number {
  return 331.3 * Math.sqrt(1 + tempC / 273.15);
}

/**
 * Sound medium/temperature presets (SCIENCE_REVIEW §6.2). The 20 °C dry-air
 * value is the sourced teaching constant (343 m/s, stored exactly); the 0 °C and
 * 35 °C air values are modelled from the temperature formula and flagged as such.
 * Fresh water, seawater and steel are the sourced §6.2 speeds.
 */
export const SOUND_MEDIUM_PRESETS: readonly SoundMediumPreset[] = [
  {
    id: 'air-20',
    label: 'Dry air, 20 °C',
    speedMps: 343,
    conditions: 'dry air, 20 °C, 1 atm (reference approximation)',
    source: 'NIST / standard acoustics reference; ISO 9613-1 reference conditions',
    reviewDate: CONSTANTS_REVIEW_DATE,
  },
  {
    id: 'air-0',
    label: 'Dry air, 0 °C',
    speedMps: soundSpeedInAir(0),
    conditions: 'dry air, 0 °C, from v = 331.3·√(1 + T/273.15)',
    source: 'Standard acoustics temperature model (SCIENCE_REVIEW §6.2 note)',
    reviewDate: CONSTANTS_REVIEW_DATE,
    modelled: true,
  },
  {
    id: 'air-35',
    label: 'Dry air, 35 °C',
    speedMps: soundSpeedInAir(35),
    conditions: 'dry air, 35 °C, from v = 331.3·√(1 + T/273.15)',
    source: 'Standard acoustics temperature model (SCIENCE_REVIEW §6.2 note)',
    reviewDate: CONSTANTS_REVIEW_DATE,
    modelled: true,
  },
  {
    id: 'fresh-water',
    label: 'Fresh water, ≈20 °C',
    speedMps: 1480,
    conditions: 'fresh water, ≈20 °C',
    source: 'NIST / standard acoustics reference (fresh water ~1480 m/s at 20 °C)',
    reviewDate: CONSTANTS_REVIEW_DATE,
  },
  {
    id: 'seawater',
    label: 'Seawater, ≈20 °C',
    speedMps: 1500,
    conditions: 'seawater, ≈20 °C, typical salinity (nominal teaching value)',
    source: 'Standard oceanographic acoustics reference',
    reviewDate: CONSTANTS_REVIEW_DATE,
  },
  {
    id: 'steel',
    label: 'Steel (longitudinal)',
    speedMps: 5960,
    conditions: 'longitudinal (bar/bulk) wave in mild steel, ~20 °C',
    source: 'Standard engineering-materials acoustics reference',
    reviewDate: CONSTANTS_REVIEW_DATE,
  },
];

export function soundMediumById(id: string): SoundMediumPreset | undefined {
  return SOUND_MEDIUM_PRESETS.find((m) => m.id === id);
}

// ----------------------------------------------------- pressure representation

/**
 * Model acoustic pressure at position x and time t. Pressure is proportional to
 * the negative spatial gradient of the longitudinal displacement:
 * p ∝ −∂y/∂x = −A·k·cos(kx − ωt + φ). We NORMALISE by k so the pressure amplitude
 * equals the displacement amplitude A (a labelled teaching normalisation, not a
 * calibrated pascal value — SCIENCE_REVIEW §1.1, §12.1). Consequences that are
 * both physically honest and pedagogically important:
 *  - pressure is 90° out of phase with displacement (a compression sits where
 *    particles cross their rest position moving inward);
 *  - a pressure MAXIMUM is a compression; a pressure MINIMUM is a rarefaction;
 *  - at a fixed probe the pressure trace has period T = 1/f (invariant 20.15).
 */
export function pressureAt(p: WaveParams, x: number, t: number): number {
  const k = waveNumber(wavelengthOf(p));
  const omega = angularFrequency(p.frequency);
  return -p.amplitude * Math.cos(k * x - omega * t + (p.phase ?? 0));
}

/** Pressure–time trace at a fixed microphone position x (period = 1/f). */
export function pressureVsTime(
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
    out.push({ at: t, value: pressureAt(p, x, t) });
  }
  return out;
}

/** Pressure–position snapshot (compression/rarefaction bands at one instant). */
export function pressureVsPosition(
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
    out.push({ at: x, value: pressureAt(p, x, t) });
  }
  return out;
}

export type Band = 'compression' | 'rarefaction' | 'neutral';

/**
 * Classify a position as a compression, rarefaction or neutral band from the
 * model pressure. `threshold` is a fraction of the amplitude (default 0.5).
 */
export function bandAt(p: WaveParams, x: number, t: number, threshold = 0.5): Band {
  if (p.amplitude === 0) return 'neutral';
  const rel = pressureAt(p, x, t) / p.amplitude;
  if (rel > threshold) return 'compression';
  if (rel < -threshold) return 'rarefaction';
  return 'neutral';
}

/**
 * Longitudinal particle positions at time t: position = equilibrium +
 * displacement (scaled for display by `displayScale`, default 1). Used by the
 * air-particle field view where bunching = compression.
 */
export function longitudinalParticles(
  p: WaveParams,
  equilibria: readonly number[],
  t: number,
  displayScale = 1,
): { equilibrium: number; position: number; displacement: number }[] {
  return equilibria.map((eq) => {
    const d = displacement(p, eq, t);
    return { equilibrium: eq, position: eq + d * displayScale, displacement: d };
  });
}

// --------------------------------------------- pitch / loudness tone model

export type Waveform = 'sine' | 'square' | 'triangle' | 'sawtooth';

export const WAVEFORMS: readonly Waveform[] = ['sine', 'square', 'triangle', 'sawtooth'];

/**
 * Age-appropriate safe teaching range for the audible tone (SCIENCE_REVIEW §19;
 * CONTROL_INVENTORY `sound-lab.frequency-slider`). Kept well inside the audible
 * band and away from the highest frequencies for headphone safety.
 */
export const SAFE_TONE_MIN_HZ = 85;
export const SAFE_TONE_MAX_HZ = 8000;

/** Default output level (0–1). Starts low per the Web Audio safety contract. */
export const SAFE_DEFAULT_LEVEL = 0.2;

/**
 * A pure representation of the tone the student is exploring. `amplitude` is the
 * output-level control setting (0–1), NOT a calibrated loudness; `frequencyHz`
 * is the pitch control. The two are stored on independent fields so that
 * changing one can never change the other (invariant 20.4).
 */
export interface ToneState {
  frequencyHz: number;
  amplitude: number;
  waveform: Waveform;
}

/** Update frequency (pitch) only — leaves amplitude and waveform untouched. */
export function setToneFrequency(t: ToneState, frequencyHz: number): ToneState {
  return { ...t, frequencyHz };
}

/** Update amplitude (output level) only — leaves frequency and waveform untouched. */
export function setToneAmplitude(t: ToneState, amplitude: number): ToneState {
  return { ...t, amplitude };
}

/** The pitch representation tracks frequency (higher f ⇒ higher pitch). */
export function pitchMetric(t: ToneState): number {
  return t.frequencyHz;
}

/** The loudness/level representation tracks amplitude (the control setting). */
export function loudnessMetric(t: ToneState): number {
  return t.amplitude;
}

/** Clamp a frequency into the safe teaching range. */
export function clampToneFrequency(hz: number): number {
  if (!Number.isFinite(hz)) return SAFE_TONE_MIN_HZ;
  return Math.min(SAFE_TONE_MAX_HZ, Math.max(SAFE_TONE_MIN_HZ, hz));
}

/**
 * Waveform value at a phase in [0, 1). Bounded to [-1, 1]. Deterministic — the
 * same waveform + phase always yields the same value (drives the oscilloscope
 * with or without audio).
 */
export function waveformSample(w: Waveform, phase: number): number {
  const ph = phase - Math.floor(phase); // wrap to [0, 1)
  switch (w) {
    case 'sine':
      return Math.sin(2 * Math.PI * ph);
    case 'square':
      return ph < 0.5 ? 1 : -1;
    case 'triangle':
      // 0→1 over [0,0.25], 1→−1 over [0.25,0.75], −1→0 over [0.75,1].
      return ph < 0.25
        ? 4 * ph
        : ph < 0.75
          ? 2 - 4 * ph
          : 4 * ph - 4;
    case 'sawtooth':
      return 2 * ph - 1;
  }
}

/**
 * Oscilloscope trace (amplitude-scaled waveform vs time) over a window of
 * `windowS` seconds. The trace shape comes from the deterministic waveform
 * model, so it renders identically whether or not audio is playing.
 */
export function oscilloscopeTrace(t: ToneState, windowS: number, samples: number): Sample[] {
  const out: Sample[] = [];
  const n = Math.max(2, Math.floor(samples));
  for (let i = 0; i < n; i++) {
    const time = (windowS * i) / (n - 1);
    out.push({ at: time, value: t.amplitude * waveformSample(t.waveform, time * t.frequencyHz) });
  }
  return out;
}

export interface SpectrumBar {
  /** Harmonic number (1 = fundamental). */
  harmonic: number;
  /** Frequency of this harmonic (Hz). */
  frequencyHz: number;
  /** Relative amplitude (0–1, fundamental = 1). */
  amplitude: number;
}

/**
 * Qualitative spectrum: the first `count` harmonic amplitudes of the chosen
 * waveform, using the real Fourier coefficients (sine = fundamental only; square
 * = odd harmonics ∝ 1/n; triangle = odd harmonics ∝ 1/n²; sawtooth = all
 * harmonics ∝ 1/n), normalised so the fundamental is 1. This is a teaching
 * spectrum view, not a calibrated FFT.
 */
export function spectrumBars(t: ToneState, count = 8): SpectrumBar[] {
  const bars: SpectrumBar[] = [];
  for (let n = 1; n <= count; n++) {
    let rel = 0;
    const odd = n % 2 === 1;
    switch (t.waveform) {
      case 'sine':
        rel = n === 1 ? 1 : 0;
        break;
      case 'square':
        rel = odd ? 1 / n : 0;
        break;
      case 'triangle':
        rel = odd ? 1 / (n * n) : 0;
        break;
      case 'sawtooth':
        rel = 1 / n;
        break;
    }
    bars.push({ harmonic: n, frequencyHz: t.frequencyHz * n, amplitude: rel * t.amplitude });
  }
  return bars;
}
