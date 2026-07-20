import { describe, expect, it } from 'vitest';
import {
  accelerationFromVelocity,
  advanceTrack,
  areaUnderVelocity,
  averageSpeed,
  averageVelocity,
  diagramVectors,
  evaluateMotionDiagram,
  motionDiagram,
  simulateMotion,
  slopeBetween,
  trackReadout,
  type TrackState,
} from '../../../src/science/motion';
import {
  CART_FRICTION_N,
  GRAVITATIONAL_FIELD_STRENGTH_N_PER_KG,
  GRAVITY_REVIEW_DATE,
  forceTypeAllowed,
  netForce,
  physicalDirectionForSign,
  runCartTrial,
  signedForce,
  solveFma,
  thirdLawPair,
  type ForceVector,
} from '../../../src/science/forces';

const START: TrackState = { timeS: 0, physicalPositionM: 0, physicalVelocityMps: 0, distanceM: 0 };

function generatedValues(seed = 7305): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

describe('motion invariant 20.9 and signed conventions', () => {
  it('distance remains scalar while displacement and velocity follow the chosen convention', () => {
    let state = advanceTrack({ ...START, physicalVelocityMps: 3 }, 0, 1);
    state = advanceTrack({ ...state, physicalVelocityMps: -5 }, 0, 1);
    const right = trackReadout(state, 0, 'right');
    const left = trackReadout(state, 0, 'left');
    expect(right.distanceM).toBe(8);
    expect(right.displacementM).toBe(-2);
    expect(right.distanceM).toBeGreaterThanOrEqual(Math.abs(right.displacementM));
    expect(right.velocityMps).toBe(-5);
    expect(left.displacementM).toBe(2);
    expect(left.velocityMps).toBe(5);
    expect(left.speedMps).toBe(5);
  });

  it('integrates constant acceleration and counts distance correctly through a reversal', () => {
    const [initial, result] = simulateMotion({ ...START, physicalVelocityMps: 2 }, [{ durationS: 2, accelerationMps2: -2 }]);
    expect(initial).toEqual({ ...START, physicalVelocityMps: 2 });
    expect(result.physicalPositionM).toBe(0);
    expect(result.physicalVelocityMps).toBe(-2);
    expect(result.distanceM).toBe(2);
  });

  it('keeps position relative to the chosen origin and displacement relative to the run start', () => {
    const state = { ...START, physicalPositionM: 7, distanceM: 3 };
    const readout = trackReadout(state, 2, 'right', 0, 4);
    expect(readout.positionM).toBe(5);
    expect(readout.displacementM).toBe(3);
  });

  it('preserves distance, displacement, speed and velocity invariants across 64 generated trials', () => {
    const next = generatedValues();
    for (let trial = 0; trial < 64; trial++) {
      let state: TrackState = {
        ...START,
        physicalVelocityMps: next() * 20 - 10,
      };
      const runStart = state.physicalPositionM;
      for (let segment = 0; segment < 4; segment++) {
        state = advanceTrack(state, next() * 8 - 4, next() * 1.9 + 0.1);
      }
      const readout = trackReadout(state, next() * 10 - 5, next() > 0.5 ? 'right' : 'left', 0, runStart);
      expect(readout.distanceM).toBeGreaterThanOrEqual(0);
      expect(readout.distanceM + 1e-10).toBeGreaterThanOrEqual(Math.abs(readout.displacementM));
      expect(readout.speedMps).toBeCloseTo(Math.abs(readout.velocityMps), 12);
    }
  });

  it('rejects non-positive durations instead of returning invalid state', () => {
    expect(() => advanceTrack(START, 1, 0)).toThrow(/greater than zero/);
    expect(() => advanceTrack(START, Number.NaN, 1)).toThrow(/finite/);
  });
});

describe('motion calculations, graphs and diagrams', () => {
  it('average speed and velocity diverge for a there-and-back run', () => {
    expect(averageSpeed(10, 10)).toBe(1);
    expect(averageVelocity(0, 10)).toBe(0);
    expect(averageSpeed(10, 10)).toBeGreaterThan(averageVelocity(0, 10));
    expect(accelerationFromVelocity(2, -2, 4)).toBe(-1);
  });

  it('graph slopes match configured motion and velocity-time area gives displacement', () => {
    const distance = [{ at: 1, value: 1.5 }, { at: 4, value: 6 }];
    expect(slopeBetween(distance, 0, 1)).toBeCloseTo(1.5, 12);
    expect(() => slopeBetween(distance, 0, 0)).toThrow(/different/);
    expect(areaUnderVelocity([{ at: 0, value: 0 }, { at: 4, value: 4 }])).toBe(8);
  });

  it('reads a piecewise graph as slopes rather than a literal hill', () => {
    const points = [{ at: 0, value: 0 }, { at: 2, value: 2 }, { at: 5, value: 2 }];
    expect(slopeBetween(points, 0, 1)).toBe(1);
    expect(slopeBetween(points, 1, 2)).toBe(0);
  });

  it('recovers configured slopes within 1% for 64 generated constant motions', () => {
    const next = generatedValues(8761);
    for (let trial = 0; trial < 64; trial++) {
      const configured = next() * 9.9 + 0.1;
      const start = next() * 5;
      const duration = next() * 9 + 1;
      const points = [{ at: start, value: 0 }, { at: start + duration, value: configured * duration }];
      const recovered = slopeBetween(points, 0, 1);
      expect(Math.abs(recovered - configured) / configured).toBeLessThan(0.01);
    }
  });

  it('all five equal-time diagram patterns have the required structure', () => {
    for (const pattern of ['constant', 'acceleration', 'deceleration', 'reversal', 'rest'] as const) {
      const positions = motionDiagram(pattern, 0.5, 6);
      expect(positions).toHaveLength(6);
      expect(evaluateMotionDiagram(pattern, positions).correct).toBe(true);
      const vectors = diagramVectors(positions, 0.5);
      expect(vectors.velocitiesMps).toHaveLength(5);
      expect(vectors.accelerationsMps2).toHaveLength(4);
    }
  });

  it('diagram checks give pattern-specific feedback and reject too few points', () => {
    expect(evaluateMotionDiagram('acceleration', [0, 1, 2, 3]).feedback).toContain('farther apart');
    expect(evaluateMotionDiagram('reversal', [0, 1, 2]).feedback).toContain('at least four');
  });

  it('rejects invalid calculation denominators and graph ordering', () => {
    expect(() => averageSpeed(2, 0)).toThrow();
    expect(() => averageVelocity(2, 0)).toThrow();
    expect(() => accelerationFromVelocity(0, 2, 0)).toThrow();
    expect(() => areaUnderVelocity([{ at: 1, value: 2 }, { at: 1, value: 3 }])).toThrow(/increasing/);
  });
});

describe('force invariant 20.11 and contextual force types', () => {
  const forces: ForceVector[] = [
    { id: 'a', magnitudeN: 5, physicalDirection: 'right', type: 'applied', label: 'push' },
    { id: 'b', magnitudeN: 2, physicalDirection: 'left', type: 'friction', label: 'friction' },
    { id: 'c', magnitudeN: 1, physicalDirection: 'right', type: 'tension', label: 'tension' },
  ];

  it('sums one-object forces and re-signs them when the convention changes', () => {
    expect(netForce(forces, 'right')).toBe(4);
    expect(netForce(forces, 'left')).toBe(-4);
    expect(signedForce(forces[0], 'right')).toBe(5);
    expect(physicalDirectionForSign('negative', 'right')).toBe('left');
    expect(physicalDirectionForSign('positive', 'left')).toBe('left');
  });

  it('limits forces and rejects negative magnitudes', () => {
    expect(() => signedForce({ ...forces[0], magnitudeN: -1 }, 'right')).toThrow(/cannot be negative/);
    expect(() => netForce(Array.from({ length: 7 }, (_, index) => ({ ...forces[0], id: `${index}` })), 'right')).toThrow(/six/);
  });

  it('matches an independent signed sum across 64 generated force systems', () => {
    const next = generatedValues(3917);
    for (let trial = 0; trial < 64; trial++) {
      const generated = Array.from({ length: 6 }, (_, index): ForceVector => ({
        id: `${trial}-${index}`,
        magnitudeN: next() * 50,
        physicalDirection: next() > 0.5 ? 'right' : 'left',
        type: 'applied',
        label: `force ${index + 1}`,
      }));
      const expected = generated.reduce((sum, force) => sum + (force.physicalDirection === 'right' ? force.magnitudeN : -force.magnitudeN), 0);
      expect(netForce(generated, 'right')).toBe(expected);
      expect(netForce(generated, 'left')).toBe(-expected);
    }
  });

  it('only offers weight/normal in appropriate contexts', () => {
    expect(forceTypeAllowed('weight', 'horizontal')).toBe(false);
    expect(forceTypeAllowed('weight', 'supported')).toBe(true);
    expect(forceTypeAllowed('normal', 'vertical')).toBe(false);
    expect(forceTypeAllowed('normal', 'supported')).toBe(true);
    expect(GRAVITATIONAL_FIELD_STRENGTH_N_PER_KG).toBe(9.8);
    expect(GRAVITY_REVIEW_DATE).toBe('2026-07-17');
  });
});

describe('force–mass–acceleration invariant 20.12 and deterministic measurement layer', () => {
  it('ideal cart trials satisfy Fnet = ma and a = Δv/Δt', () => {
    const trial = runCartTrial({ appliedForceN: 6, massKg: 2, friction: false });
    expect(trial.idealAccelerationMps2).toBe(3);
    expect(trial.netForceN).toBe(trial.massKg * trial.idealAccelerationMps2);
    expect(accelerationFromVelocity(trial.velocityTime[0].value, trial.velocityTime[4].value, 4)).toBe(3);
    expect(trial.measuredAccelerationMps2).toBe(3);
  });

  it('gives the expected inverse-mass slope for a fixed 2 N force', () => {
    const trials = [1, 2, 3, 4, 5].map((massKg) => runCartTrial({ appliedForceN: 2, massKg, friction: false }));
    expect(trials[0].idealAccelerationMps2).toBe(2);
    expect(trials.at(-1)!.idealAccelerationMps2).toBe(0.4);
    const slope = slopeBetween(trials.map((trial) => ({ at: 1 / trial.massKg, value: trial.idealAccelerationMps2 })), 0, 4);
    expect(slope).toBeCloseTo(2, 12);
  });

  it('satisfies Fnet = ma and a = Δv/Δt within 0.5% across 64 generated trials', () => {
    const next = generatedValues(1159);
    for (let trialIndex = 0; trialIndex < 64; trialIndex++) {
      const trial = runCartTrial({ appliedForceN: next() * 20, massKg: next() * 9.9 + 0.1, friction: next() > 0.5 });
      const fmaResidual = Math.abs(trial.netForceN - trial.massKg * trial.idealAccelerationMps2);
      expect(fmaResidual / Math.max(1, Math.abs(trial.netForceN))).toBeLessThan(0.005);
      const measured = accelerationFromVelocity(trial.velocityTime[0].value, trial.velocityTime[4].value, 4);
      expect(Math.abs(measured - trial.idealAccelerationMps2) / Math.max(1, Math.abs(trial.idealAccelerationMps2))).toBeLessThan(0.005);
    }
  });

  it('friction is a labelled opposing force that cannot propel a stationary cart backwards', () => {
    expect(runCartTrial({ appliedForceN: 2, massKg: 1, friction: true }).frictionForceN).toBe(CART_FRICTION_N);
    const tiny = runCartTrial({ appliedForceN: 0.2, massKg: 1, friction: true });
    expect(tiny.frictionForceN).toBe(0.2);
    expect(tiny.netForceN).toBe(0);
  });

  it('seeded noise is reproducible and never changes underlying scientific state', () => {
    const input = { appliedForceN: 4, massKg: 2, friction: false, noise: true, seed: 4471, trialIndex: 3 };
    const first = runCartTrial(input);
    const second = runCartTrial(input);
    const other = runCartTrial({ ...input, seed: 9001 });
    expect(first).toEqual(second);
    expect(first.measuredAccelerationMps2).not.toBe(other.measuredAccelerationMps2);
    expect(first.idealAccelerationMps2).toBe(other.idealAccelerationMps2);
    expect(first.velocityTime).toEqual(other.velocityTime);
  });

  it('rejects zero mass and out-of-range cart controls', () => {
    expect(() => runCartTrial({ appliedForceN: 2, massKg: 0, friction: false })).toThrow(/zero mass/);
    expect(() => runCartTrial({ appliedForceN: 21, massKg: 1, friction: false })).toThrow(/20 N/);
  });
});

describe('Newton third law invariant 20.13 and F=ma solver', () => {
  it('builds equal/opposite forces on two different objects', () => {
    const pair = thirdLawPair('foot', 'ground', 400, 'right');
    expect(pair.onA.objectId).not.toBe(pair.onB.objectId);
    expect(pair.onA.agentId).toBe(pair.onB.objectId);
    expect(pair.onB.agentId).toBe(pair.onA.objectId);
    expect(signedForce(pair.onA, 'right') + signedForce(pair.onB, 'right')).toBe(0);
  });

  it('keeps third-law residual below 0.1% across 64 generated pairs', () => {
    const next = generatedValues(913);
    for (let trial = 0; trial < 64; trial++) {
      const magnitude = next() * 500;
      const pair = thirdLawPair(`A-${trial}`, `B-${trial}`, magnitude, next() > 0.5 ? 'right' : 'left');
      const residual = Math.abs(signedForce(pair.onA, 'right') + signedForce(pair.onB, 'right'));
      expect(residual / Math.max(1, magnitude)).toBeLessThan(0.001);
      expect(pair.onA.objectId).not.toBe(pair.onB.objectId);
    }
  });

  it('solves every F=ma rearrangement and rejects undefined/nonphysical mass', () => {
    expect(solveFma({ forceN: 6, massKg: 2 })).toEqual({ forceN: 6, massKg: 2, accelerationMps2: 3 });
    expect(solveFma({ forceN: 6, accelerationMps2: 3 })).toEqual({ forceN: 6, massKg: 2, accelerationMps2: 3 });
    expect(solveFma({ massKg: 2, accelerationMps2: -3 })).toEqual({ forceN: -6, massKg: 2, accelerationMps2: -3 });
    expect(() => solveFma({ forceN: 6, massKg: 0 })).toThrow(/greater than zero/);
    expect(() => solveFma({ forceN: 0, accelerationMps2: 0 })).toThrow(/undefined/);
  });

  it('rejects third-law pairs attached to one object', () => {
    expect(() => thirdLawPair('cart', 'cart', 5, 'right')).toThrow(/different objects/);
  });
});
