import { describe, it, expect } from 'vitest';
import { calculateWavelength, calculateSpeed, calculateFrequency, validateWaveInvariant, updateFrequencyKeepSpeed } from '../../src/science/waveEngine';

describe('Wave Engine', () => {
  it('should calculate wavelength correctly (λ = v / f)', () => {
    // Sound in air approx 343 m/s, frequency 440 Hz (A4)
    const wavelength = calculateWavelength(343, 440);
    expect(wavelength).toBeCloseTo(0.7795, 4);
  });

  it('should calculate speed correctly (v = f * λ)', () => {
    const speed = calculateSpeed(440, 0.779545);
    expect(speed).toBeCloseTo(343, 1);
  });

  it('should calculate frequency correctly (f = v / λ)', () => {
    const frequency = calculateFrequency(343, 0.779545);
    expect(frequency).toBeCloseTo(440, 1);
  });

  it('should validate wave invariant', () => {
    const state = {
      amplitude: 1,
      speed: 343,
      frequency: 440,
      wavelength: 343 / 440
    };
    expect(validateWaveInvariant(state)).toBe(true);

    const badState = {
      ...state,
      speed: 300 // invalid for f=440, w=0.779
    };
    expect(validateWaveInvariant(badState)).toBe(false);
  });

  it('should update frequency and keep speed constant', () => {
    const initialState = {
      amplitude: 1,
      speed: 343,
      frequency: 440,
      wavelength: 343 / 440
    };

    const newState = updateFrequencyKeepSpeed(initialState, 880);
    expect(newState.speed).toBe(343);
    expect(newState.frequency).toBe(880);
    expect(newState.wavelength).toBeCloseTo(343 / 880, 5);
    expect(validateWaveInvariant(newState)).toBe(true);
  });
});
