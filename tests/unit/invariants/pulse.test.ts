import { describe, it, expect } from 'vitest';
import {
  pulseDisplacement,
  pulseHasExited,
  continuousDisplacement,
} from '../../../src/science/pulse';

describe('pulse model — no net particle transport', () => {
  const p = { amplitude: 1, speed: 2, width: 0.5, startTime: 0 };

  it('a particle rises as the pulse passes and returns to equilibrium after', () => {
    const x = 4;
    // Before arrival: undisturbed.
    expect(Math.abs(pulseDisplacement(p, x, 0))).toBeLessThan(1e-9);
    // Peak when centre reaches x (t = x/v = 2 s).
    expect(pulseDisplacement(p, x, 2)).toBeCloseTo(1, 9);
    // Long after: back to equilibrium (net displacement ≈ 0).
    expect(Math.abs(pulseDisplacement(p, x, 10))).toBeLessThan(1e-9);
  });

  it('the pattern travels at the wave speed', () => {
    // Peak location at t = 3 s should be x = 6.
    expect(pulseDisplacement(p, 6, 3)).toBeCloseTo(1, 9);
    expect(pulseDisplacement(p, 5, 3)).toBeLessThan(1);
  });

  it('reports pulse exit only after clearing the chamber', () => {
    expect(pulseHasExited(p, 10, 1)).toBe(false);
    expect(pulseHasExited(p, 10, 7)).toBe(true);
  });

  it('no disturbance before the launch time', () => {
    const late = { ...p, startTime: 5 };
    expect(pulseDisplacement(late, 2, 4)).toBe(0);
  });
});

describe('continuous source — causal wavefront', () => {
  const c = { amplitude: 1, frequency: 2, speed: 2, startTime: 0 };

  it('no disturbance ahead of the wavefront', () => {
    // Front at t=1 s is x=2; beyond it the medium is undisturbed.
    expect(continuousDisplacement(c, 3, 1)).toBe(0);
    expect(continuousDisplacement(c, 1.9, 1)).not.toBe(0);
  });

  it('behind the front the wave satisfies y = A·sin(kx − ωt)', () => {
    const lambda = c.speed / c.frequency; // 1 m
    const k = (2 * Math.PI) / lambda;
    const omega = 2 * Math.PI * c.frequency;
    const x = 0.3;
    const t = 2.7;
    expect(continuousDisplacement(c, x, t)).toBeCloseTo(Math.sin(k * x - omega * t), 9);
  });
});
