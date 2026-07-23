import { describe, expect, it } from 'vitest';
import {
  directionalHint,
  particlePosition,
  relativeEnergy,
  scoreEnergyGate,
  scoreMatterGate,
  scoreSpeedGate,
  waveSpeed,
  clampWaveRiderLane,
  isCorrectWaveRiderLane,
  WAVE_RIDER_COURSE,
  WAVE_RIDER_FINISH_DISTANCE,
  WAVE_RIDER_GATES,
  WAVE_RIDER_POWERUP_QUESTIONS,
  WAVE_RIDER_STAGES,
  waveRiderEventY,
  waveRiderSpeed,
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

  it('uses fixed, syllabus-labelled gates with exactly one correct lane', () => {
    expect(WAVE_RIDER_GATES).toHaveLength(10);
    expect(new Set(WAVE_RIDER_GATES.map((gate) => gate.outcome))).toEqual(
      new Set(['7.1.1', '7.1.2', '7.1.3', '7.1.4', '7.1.5', '7.1.6', '7.1.7', '7.2.2', '7.3.2']),
    );
    WAVE_RIDER_GATES.forEach((gate, index) => {
      expect(gate.options).toHaveLength(3);
      expect([0, 1, 2].filter((lane) => isCorrectWaveRiderLane(index, lane))).toEqual([gate.correctLane]);
    });
  });

  it('keeps the arcade course deterministic and ordered', () => {
    const distances = WAVE_RIDER_COURSE.map((event) => event.distance);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
    expect(distances.at(-1)).toBeLessThan(WAVE_RIDER_FINISH_DISTANCE);
    expect(WAVE_RIDER_COURSE.filter((event) => event.type === 'gate')).toHaveLength(WAVE_RIDER_GATES.length);
  });

  it('defines five increasingly fast stages and question-gated power-ups', () => {
    expect(WAVE_RIDER_STAGES).toHaveLength(5);
    expect(WAVE_RIDER_STAGES.map((stage) => stage.speedMultiplier)).toEqual(
      [...WAVE_RIDER_STAGES.map((stage) => stage.speedMultiplier)].sort((a, b) => a - b),
    );
    WAVE_RIDER_STAGES.forEach((stage, index) => {
      if (index > 0) expect(stage.startDistance).toBe(WAVE_RIDER_STAGES[index - 1].finishDistance);
      expect(stage.finishDistance).toBeGreaterThan(stage.startDistance);
    });
    expect(WAVE_RIDER_POWERUP_QUESTIONS.length).toBeGreaterThanOrEqual(4);
    expect(new Set(WAVE_RIDER_COURSE.filter((event) => event.type === 'powerup').map((event) => event.powerup)))
      .toEqual(new Set(['speed', 'life', 'jump', 'shield']));
  });

  it('clamps lanes and derives view position and speed without randomness', () => {
    expect(clampWaveRiderLane(-4)).toBe(0);
    expect(clampWaveRiderLane(1)).toBe(1);
    expect(clampWaveRiderLane(7)).toBe(2);
    expect(waveRiderEventY(180, 0)).toBe(8);
    expect(waveRiderEventY(0, 0)).toBe(86);
    expect(waveRiderSpeed(0, true, false)).toBeLessThan(waveRiderSpeed(0, false, false));
    expect(waveRiderSpeed(200, false, true)).toBeGreaterThan(waveRiderSpeed(200, false, false));
  });
});
