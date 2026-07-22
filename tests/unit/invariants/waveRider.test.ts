import { describe, expect, it } from 'vitest';
import {
  directionalHint,
  particlePosition,
  relativeEnergy,
  scoreEnergyGate,
  scoreMatterGate,
  scoreSpeedGate,
  waveSpeed,
  WAVE_RIDER_TARGETS,
} from '../../../src/science/waveRider';

describe('Wave Rider science invariants', () => {
  it('uses v = fλ and does not couple speed to amplitude', () => {
    expect(waveSpeed(1.2, 5)).toBe(6);
    expect(waveSpeed(1.2, 5)).toBe(waveSpeed(1.2, 5));
    expect(relativeEnergy(1.5)).toBeCloseTo(2.25, 12);
    expect(relativeEnergy(2) / relativeEnergy(1)).toBe(4);
  });

  it('keeps each medium particle centred on an immutable home position', () => {
    const home = 12;
    expect(particlePosition(home, 1.5, 0)).toBe(home);
    expect(particlePosition(home, 1.5, Math.PI / 2)).toBeCloseTo(home + 1.5, 12);
    expect(particlePosition(home, 1.5, Math.PI)).toBeCloseTo(home, 12);
  });

  it('scores scientific state rather than clicks or elapsed time', () => {
    expect(scoreMatterGate('travels')).toBe(false);
    expect(scoreMatterGate('oscillates')).toBe(true);
    expect(scoreEnergyGate(1.4)).toBe(false);
    expect(scoreEnergyGate(WAVE_RIDER_TARGETS.amplitudeM)).toBe(true);
    expect(scoreSpeedGate(4.5)).toBe(false);
    expect(scoreSpeedGate(WAVE_RIDER_TARGETS.wavelengthM)).toBe(true);
  });

  it('returns deterministic directional tuning hints', () => {
    expect(directionalHint(1, 1.5)).toBe('Tune higher.');
    expect(directionalHint(2, 1.5)).toBe('Tune lower.');
    expect(directionalHint(1.5, 1.5)).toContain('locked');
  });
});
