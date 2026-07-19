import { describe, it, expect } from 'vitest';
import { createRng } from '../../../src/science/rng';
import { periodOfWave, netDisplacementOverCycles, type WaveParams } from '../../../src/science/waves';
import {
  pressureAt,
  pressureVsTime,
  bandAt,
  longitudinalParticles,
  soundSpeedInAir,
  SOUND_MEDIUM_PRESETS,
  waveformSample,
  spectrumBars,
  oscilloscopeTrace,
  clampToneFrequency,
  setToneAmplitude,
  setToneFrequency,
  pitchMetric,
  loudnessMetric,
  SAFE_TONE_MIN_HZ,
  SAFE_TONE_MAX_HZ,
  WAVEFORMS,
  type ToneState,
} from '../../../src/science/sound';

/**
 * Sound-engine invariant sweeps (TEST_PLAN §1, SCIENCE_REVIEW §12, §20). Each
 * invariant runs seeded pseudo-random cases plus explicit boundary cases.
 */

const SEED = 0x50d;
const CASES = 60;

function randomTone(rng: ReturnType<typeof createRng>): ToneState {
  return {
    frequencyHz: rng.range(SAFE_TONE_MIN_HZ, SAFE_TONE_MAX_HZ),
    amplitude: rng.range(0, 1),
    waveform: WAVEFORMS[Math.floor(rng.range(0, WAVEFORMS.length))],
  };
}

describe('sound medium presets (SCIENCE_REVIEW §6.2)', () => {
  it('exposes air/water/seawater/steel with sourced speeds', () => {
    const byId = Object.fromEntries(SOUND_MEDIUM_PRESETS.map((m) => [m.id, m]));
    expect(byId['air-20'].speedMps).toBe(343);
    expect(byId['fresh-water'].speedMps).toBe(1480);
    expect(byId['seawater'].speedMps).toBe(1500);
    expect(byId['steel'].speedMps).toBe(5960);
    for (const m of SOUND_MEDIUM_PRESETS) {
      expect(m.source.length).toBeGreaterThan(0);
      expect(m.reviewDate).toBe('2026-07-17');
    }
  });

  it('air temperature model v = 331.3·√(1+T/273.15): ~331.3 at 0 °C, ~343.2 at 20 °C', () => {
    expect(soundSpeedInAir(0)).toBeCloseTo(331.3, 6);
    expect(soundSpeedInAir(20)).toBeCloseTo(343.2, 1);
    // Monotonic increase with temperature.
    expect(soundSpeedInAir(35)).toBeGreaterThan(soundSpeedInAir(0));
  });
});

describe('invariant 20.15 (sound) — pressure trace period = 1/f', () => {
  it('pressure at a fixed probe repeats every period T = 1/f', () => {
    const rng = createRng(SEED);
    for (let i = 0; i < CASES; i++) {
      const p: WaveParams = {
        amplitude: rng.range(0.1, 1),
        frequency: rng.range(50, 2000),
        speed: 343,
        phase: rng.range(0, Math.PI * 2),
      };
      const T = periodOfWave(p);
      const x = rng.range(0, 5);
      const t = rng.range(0, 2);
      expect(pressureAt(p, x, t)).toBeCloseTo(pressureAt(p, x, t + T), 9);
      // NOT periodic at an arbitrary non-period offset (guards against a
      // trivially-constant trace).
      expect(Math.abs(pressureAt(p, x, t) - pressureAt(p, x, t + T / 2))).toBeGreaterThan(1e-6);
    }
  });

  it('pressure trace samples span the requested window and have amplitude = displacement amplitude', () => {
    const p: WaveParams = { amplitude: 0.7, frequency: 440, speed: 343 };
    const trace = pressureVsTime(p, 0, 0, 3 / 440, 200);
    expect(trace).toHaveLength(200);
    const peak = Math.max(...trace.map((s) => Math.abs(s.value)));
    expect(peak).toBeCloseTo(0.7, 3); // normalised pressure amplitude == A
  });
});

describe('compression/rarefaction bands and longitudinal particles', () => {
  it('a compression (pressure max) and a rarefaction (pressure min) both exist along one snapshot', () => {
    const p: WaveParams = { amplitude: 1, frequency: 2, speed: 6, phase: 0 };
    const bands = new Set<string>();
    for (let i = 0; i <= 200; i++) bands.add(bandAt(p, (6 * i) / 200, 0));
    expect(bands.has('compression')).toBe(true);
    expect(bands.has('rarefaction')).toBe(true);
  });

  it('invariant 20.2 — tagged air particle has ≈0 net displacement over whole cycles', () => {
    const rng = createRng(SEED + 2);
    for (let i = 0; i < CASES; i++) {
      const p: WaveParams = {
        amplitude: rng.range(0.1, 1),
        frequency: rng.range(50, 2000),
        speed: 343,
        phase: rng.range(0, Math.PI * 2),
      };
      const x = rng.range(0, 3);
      for (const cycles of [1, 5, 20]) {
        expect(Math.abs(netDisplacementOverCycles(p, x, cycles))).toBeLessThan(0.01 * p.amplitude);
      }
    }
  });

  it('longitudinal particles sit at equilibrium + displacement', () => {
    const p: WaveParams = { amplitude: 0.5, frequency: 2, speed: 6 };
    const parts = longitudinalParticles(p, [0, 1, 2, 3], 0.1);
    for (const part of parts) {
      expect(part.position).toBeCloseTo(part.equilibrium + part.displacement, 12);
    }
  });
});

describe('invariant 20.4 — pitch/amplitude independence', () => {
  it('changing frequency never mutates the amplitude field (and vice versa)', () => {
    const rng = createRng(SEED + 3);
    for (let i = 0; i < CASES; i++) {
      const tone = randomTone(rng);
      const reFreq = setToneFrequency(tone, clampToneFrequency(tone.frequencyHz * 2));
      expect(loudnessMetric(reFreq)).toBe(loudnessMetric(tone)); // amplitude unchanged
      expect(reFreq.waveform).toBe(tone.waveform);
      const reAmp = setToneAmplitude(tone, Math.min(1, tone.amplitude + 0.3));
      expect(pitchMetric(reAmp)).toBe(pitchMetric(tone)); // frequency unchanged
      expect(reAmp.waveform).toBe(tone.waveform);
    }
  });

  it('worked example: 220 → 880 Hz at amplitude 0.4 leaves amplitude exactly 0.4', () => {
    const tone: ToneState = { frequencyHz: 220, amplitude: 0.4, waveform: 'sine' };
    expect(setToneFrequency(tone, 880).amplitude).toBe(0.4);
  });

  it('oscilloscope amplitude scales with the level control, not the pitch', () => {
    const loud: ToneState = { frequencyHz: 300, amplitude: 0.8, waveform: 'sine' };
    const soft: ToneState = { frequencyHz: 1200, amplitude: 0.2, waveform: 'sine' };
    const peak = (t: ToneState) => Math.max(...oscilloscopeTrace(t, 0.02, 400).map((s) => Math.abs(s.value)));
    expect(peak(loud)).toBeGreaterThan(peak(soft));
    expect(peak(loud)).toBeCloseTo(0.8, 2);
  });
});

describe('waveform + spectrum model', () => {
  it('waveformSample stays within [-1, 1] and is deterministic', () => {
    const rng = createRng(SEED + 4);
    for (const w of WAVEFORMS) {
      for (let i = 0; i < 50; i++) {
        const ph = rng.range(-3, 3);
        const v = waveformSample(w, ph);
        expect(v).toBeGreaterThanOrEqual(-1.0000001);
        expect(v).toBeLessThanOrEqual(1.0000001);
        expect(waveformSample(w, ph)).toBe(v);
      }
    }
  });

  it('spectrum harmonics match the real Fourier structure of each waveform', () => {
    const tone: ToneState = { frequencyHz: 100, amplitude: 1, waveform: 'sine' };
    const sine = spectrumBars(tone, 6);
    expect(sine[0].amplitude).toBeCloseTo(1, 6); // fundamental
    expect(sine.slice(1).every((b) => b.amplitude === 0)).toBe(true); // no overtones

    const square = spectrumBars({ ...tone, waveform: 'square' }, 6);
    expect(square[1].amplitude).toBe(0); // even harmonic absent
    expect(square[2].amplitude).toBeCloseTo(1 / 3, 6); // 3rd harmonic 1/3

    const saw = spectrumBars({ ...tone, waveform: 'sawtooth' }, 6);
    expect(saw[1].amplitude).toBeCloseTo(1 / 2, 6); // 2nd harmonic present

    // Fundamental frequency tracks the tone frequency.
    expect(sine[0].frequencyHz).toBe(100);
    expect(square[2].frequencyHz).toBe(300);
  });

  it('clampToneFrequency keeps values inside the safe teaching range', () => {
    expect(clampToneFrequency(10)).toBe(SAFE_TONE_MIN_HZ);
    expect(clampToneFrequency(99999)).toBe(SAFE_TONE_MAX_HZ);
    expect(clampToneFrequency(440)).toBe(440);
    expect(clampToneFrequency(Number.NaN)).toBe(SAFE_TONE_MIN_HZ);
  });
});
