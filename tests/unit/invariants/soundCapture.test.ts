import { describe, expect, it } from 'vitest';
import {
  calculateRms,
  estimateFundamentalFrequency,
  pitchDescription,
  relativeLoudnessDescription,
} from '../../../src/science/soundCapture';

function sine(frequency: number, amplitude = 0.5, sampleRate = 48000, count = 4096) {
  return Float32Array.from({ length: count }, (_, index) => amplitude * Math.sin(2 * Math.PI * frequency * index / sampleRate));
}

describe('live sound capture signal helpers', () => {
  it('estimates steady classroom tone frequency across the useful range', () => {
    expect(estimateFundamentalFrequency(sine(220), 48000)).toBeCloseTo(220, 0);
    expect(estimateFundamentalFrequency(sine(440), 48000)).toBeCloseTo(440, 0);
    expect(estimateFundamentalFrequency(sine(1000), 48000)).toBeCloseTo(1000, 0);
  });

  it('rejects silence and calculates relative amplitude', () => {
    expect(estimateFundamentalFrequency(new Float32Array(4096), 48000)).toBeNull();
    expect(calculateRms(sine(440, 0.5))).toBeCloseTo(Math.SQRT1_2 * 0.5, 2);
  });

  it('uses student-friendly qualitative descriptions', () => {
    expect(pitchDescription(null)).toContain('Waiting');
    expect(pitchDescription(180)).toBe('Low pitch');
    expect(pitchDescription(1200)).toBe('High pitch');
    expect(relativeLoudnessDescription(0.02)).toBe('Very quiet');
    expect(relativeLoudnessDescription(0.7)).toBe('Very loud');
  });
});
