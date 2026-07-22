import { describe, expect, it } from 'vitest';
import {
  EM_DISPLAY_SPEED,
  SOURCE_FREQUENCY_HZ,
  TRANSMISSION_BAYS,
  TRANSMISSION_CHAMBER_LENGTH,
  bayRuntimeState,
  hasDetectorEvidence,
  mechanicalDisplaySpeed,
  scoreTransmissionChallenge,
  waveTransmits,
} from '../../../src/science/mediumVacuum';

const settings = { amplitude: 0.4, coupling: 50, density: 1 };

describe('7.1.1 medium/vacuum transmission model', () => {
  it('implements the required mechanical/EM transmission truth table', () => {
    expect(waveTransmits('mechanical', 'material-medium')).toBe(true);
    expect(waveTransmits('mechanical', 'vacuum')).toBe(false);
    expect(waveTransmits('electromagnetic', 'material-medium')).toBe(true);
    expect(waveTransmits('electromagnetic', 'vacuum')).toBe(true);
    for (const bay of TRANSMISSION_BAYS) {
      expect(bay.transmits).toBe(waveTransmits(bay.waveFamily, bay.environment));
    }
  });

  it('keeps the vacuum mechanical detector blocked for all elapsed times', () => {
    const bay = TRANSMISSION_BAYS.find((item) => item.id === 'mechanical-vacuum')!;
    for (const elapsed of [0, 0.25, 1, 10, 10_000]) {
      expect(bayRuntimeState(bay, settings, elapsed)).toMatchObject({
        detectorState: 'blocked',
        displaySpeed: null,
        frontPosition: null,
      });
    }
  });

  it('reports arrival only when a transmitting front reaches the detector', () => {
    for (const bay of TRANSMISSION_BAYS.filter((item) => item.transmits)) {
      const speed = bay.id === 'em-vacuum'
        ? EM_DISPLAY_SPEED
        : mechanicalDisplaySpeed(settings.coupling, settings.density);
      const arrival = TRANSMISSION_CHAMBER_LENGTH / speed;
      expect(bayRuntimeState(bay, settings, arrival - 0.001).detectorState).toBe('travelling');
      expect(bayRuntimeState(bay, settings, arrival).detectorState).toBe('received');
    }
  });

  it('coupling raises and density lowers only the mechanical display speed', () => {
    const base = mechanicalDisplaySpeed(50, 1);
    expect(mechanicalDisplaySpeed(100, 1)).toBeGreaterThan(base);
    expect(mechanicalDisplaySpeed(50, 3)).toBeLessThan(base);
    expect(EM_DISPLAY_SPEED).toBe(6);
    expect(SOURCE_FREQUENCY_HZ).toBe(1);
  });

  it('amplitude changes neither transmission, model speed nor source frequency', () => {
    const mechanicalBay = TRANSMISSION_BAYS.find((item) => item.id === 'mechanical-medium')!;
    const reference = bayRuntimeState(mechanicalBay, settings, 0.5);
    for (const amplitude of [0.1, 0.4, 1]) {
      const changed = bayRuntimeState(mechanicalBay, { ...settings, amplitude }, 0.5);
      expect(changed.displaySpeed).toBe(reference.displaySpeed);
      expect(changed.detectorState).toBe(reference.detectorState);
      expect(changed.bay.transmits).toBe(true);
      expect(SOURCE_FREQUENCY_HZ).toBe(1);
    }
  });

  it('clamps model inputs to their documented bounds', () => {
    expect(mechanicalDisplaySpeed(-10, 0.1)).toBe(mechanicalDisplaySpeed(0, 0.5));
    expect(mechanicalDisplaySpeed(500, 8)).toBe(mechanicalDisplaySpeed(100, 3));
  });

  it('scores all three predictions deterministically and requires a complete attempt', () => {
    expect(scoreTransmissionChallenge({ 'mechanical-medium': true })).toBeNull();
    expect(scoreTransmissionChallenge({
      'mechanical-medium': true,
      'mechanical-vacuum': false,
      'em-vacuum': true,
    })).toMatchObject({ correctCount: 3, score: 300, maxScore: 300, mastery: 'mission-ready' });
    expect(scoreTransmissionChallenge({
      'mechanical-medium': true,
      'mechanical-vacuum': true,
      'em-vacuum': true,
    })).toMatchObject({ correctCount: 2, score: 200, mastery: 'developing' });
  });

  it('unlocks mastery only after detector evidence has been collected', () => {
    expect(hasDetectorEvidence(0)).toBe(false);
    expect(hasDetectorEvidence(-1)).toBe(false);
    expect(hasDetectorEvidence(Number.NaN)).toBe(false);
    expect(hasDetectorEvidence(1)).toBe(true);
    expect(hasDetectorEvidence(3)).toBe(true);
  });
});
