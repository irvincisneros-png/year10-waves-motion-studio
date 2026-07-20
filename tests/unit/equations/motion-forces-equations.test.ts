import { describe, expect, it } from 'vitest';
import {
  solveAccelerationTime,
  solveAverageVelocity,
  solveDisplacement,
  solveForForce,
  solveForMass,
  solveForceAcceleration,
  solveVelocityAcceleration,
  solveVelocityChange,
  solveVelocityTime,
} from '../../../src/science/equations';

const valueOf = (result: ReturnType<typeof solveForForce>) => result.ok ? result.value : Number.NaN;

describe('F = ma rearrangements', () => {
  it('solves force, mass and signed acceleration', () => {
    expect(valueOf(solveForForce(2, -3))).toBe(-6);
    expect(valueOf(solveForMass(6, 3))).toBe(2);
    expect(valueOf(solveForceAcceleration(-6, 2))).toBe(-3);
  });

  it('rejects undefined and non-physical divisions', () => {
    expect(solveForMass(0, 0)).toMatchObject({ ok: false, code: 'zero-acceleration' });
    expect(solveForceAcceleration(5, 0)).toMatchObject({ ok: false, code: 'non-positive-mass' });
    expect(solveForForce(Number.NaN, 2).ok).toBe(false);
  });
});

describe('vav = displacement/time rearrangements', () => {
  it('solves each variable with signed quantities', () => {
    expect(valueOf(solveAverageVelocity(-12, 4))).toBe(-3);
    expect(valueOf(solveDisplacement(-3, 4))).toBe(-12);
    expect(valueOf(solveVelocityTime(-12, -3))).toBe(4);
  });

  it('rejects zero denominators and negative solved times', () => {
    expect(solveAverageVelocity(5, 0).ok).toBe(false);
    expect(solveVelocityTime(5, 0).ok).toBe(false);
    expect(solveVelocityTime(5, -1)).toMatchObject({ ok: false, code: 'negative-time' });
  });
});

describe('a = change in velocity/time rearrangements', () => {
  it('solves each variable with signed quantities', () => {
    expect(valueOf(solveVelocityAcceleration(-8, 4))).toBe(-2);
    expect(valueOf(solveVelocityChange(-2, 4))).toBe(-8);
    expect(valueOf(solveAccelerationTime(-8, -2))).toBe(4);
  });

  it('rejects zero denominators and inconsistent negative time', () => {
    expect(solveVelocityAcceleration(5, 0).ok).toBe(false);
    expect(solveAccelerationTime(5, 0).ok).toBe(false);
    expect(solveAccelerationTime(5, -1)).toMatchObject({ ok: false, code: 'negative-time' });
  });
});
