/** Pure one-dimensional force/cart engines for Stage 5 (outcomes 7.4.4–7.4.7). */

import {
  GRAVITATIONAL_FIELD_STRENGTH_N_PER_KG,
  GRAVITY_REVIEW_DATE,
  GRAVITY_SOURCE,
} from './constants';
import { createRng } from './rng';
import type { PositiveDirection } from './motion';

export { GRAVITATIONAL_FIELD_STRENGTH_N_PER_KG, GRAVITY_REVIEW_DATE, GRAVITY_SOURCE };
export const CART_FRICTION_N = 0.5;

export type PhysicalDirection = 'right' | 'left';
export type ForceType = 'applied' | 'friction' | 'drag' | 'tension' | 'normal' | 'weight';
export type ForceContext = 'horizontal' | 'supported' | 'vertical';

export interface ForceVector {
  id: string;
  magnitudeN: number;
  physicalDirection: PhysicalDirection;
  type: ForceType;
  label: string;
}

const finite = (value: number, label: string) => {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be a finite number.`);
};

export function physicalDirectionForSign(sign: 'positive' | 'negative', positiveDirection: PositiveDirection): PhysicalDirection {
  return sign === 'positive' ? positiveDirection : positiveDirection === 'right' ? 'left' : 'right';
}

export function signedForce(force: ForceVector, positiveDirection: PositiveDirection): number {
  finite(force.magnitudeN, 'Force magnitude');
  if (force.magnitudeN < 0) throw new RangeError('Force magnitude cannot be negative; choose direction separately.');
  return force.physicalDirection === positiveDirection ? force.magnitudeN : -force.magnitudeN;
}

export function netForce(forces: readonly ForceVector[], positiveDirection: PositiveDirection): number {
  if (forces.length > 6) throw new RangeError('This one-object model supports at most six forces.');
  return forces.reduce((sum, force) => sum + signedForce(force, positiveDirection), 0);
}

export function forceTypeAllowed(type: ForceType, context: ForceContext): boolean {
  if (type === 'weight') return context === 'supported' || context === 'vertical';
  if (type === 'normal') return context === 'supported';
  return true;
}

export interface CartTrialInput {
  appliedForceN: number;
  massKg: number;
  friction: boolean;
  noise?: boolean;
  seed?: number;
  trialIndex?: number;
}

export interface CartTrial {
  appliedForceN: number;
  frictionForceN: number;
  netForceN: number;
  massKg: number;
  idealAccelerationMps2: number;
  measuredAccelerationMps2: number;
  seed: number | null;
  velocityTime: { at: number; value: number }[];
}

export function runCartTrial(input: CartTrialInput): CartTrial {
  finite(input.appliedForceN, 'Applied force'); finite(input.massKg, 'Mass');
  if (input.appliedForceN < 0 || input.appliedForceN > 20) throw new RangeError('Applied force must be from 0 N to 20 N.');
  if (input.massKg < 0.1 || input.massKg > 10) throw new RangeError('Mass must be from 0.1 kg to 10 kg; zero mass is undefined.');
  const frictionForceN = input.friction ? Math.min(CART_FRICTION_N, input.appliedForceN) : 0;
  const netForceN = input.appliedForceN - frictionForceN;
  const idealAccelerationMps2 = netForceN / input.massKg;
  const seed = input.noise ? (input.seed ?? 4471) : null;
  let measuredAccelerationMps2 = idealAccelerationMps2;
  if (seed !== null) {
    const rng = createRng(seed);
    const trialIndex = Math.max(0, Math.floor(input.trialIndex ?? 0));
    for (let index = 0; index <= trialIndex; index++) {
      measuredAccelerationMps2 = idealAccelerationMps2 + rng.noise(Math.max(0.02, Math.abs(idealAccelerationMps2) * 0.03));
    }
  }
  return {
    appliedForceN: input.appliedForceN,
    frictionForceN,
    netForceN,
    massKg: input.massKg,
    idealAccelerationMps2,
    measuredAccelerationMps2,
    seed,
    velocityTime: Array.from({ length: 5 }, (_, at) => ({ at, value: idealAccelerationMps2 * at })),
  };
}

export interface ThirdLawPair {
  onA: ForceVector & { objectId: string; agentId: string };
  onB: ForceVector & { objectId: string; agentId: string };
}

export function thirdLawPair(objectA: string, objectB: string, magnitudeN: number, onADirection: PhysicalDirection): ThirdLawPair {
  if (!objectA || !objectB || objectA === objectB) throw new RangeError('Third-law forces must act on two different objects.');
  finite(magnitudeN, 'Force magnitude');
  if (magnitudeN < 0) throw new RangeError('Force magnitude cannot be negative.');
  const opposite = onADirection === 'right' ? 'left' : 'right';
  return {
    onA: { id: `${objectB}-on-${objectA}`, magnitudeN, physicalDirection: onADirection, type: 'applied', label: `${objectB} on ${objectA}`, objectId: objectA, agentId: objectB },
    onB: { id: `${objectA}-on-${objectB}`, magnitudeN, physicalDirection: opposite, type: 'applied', label: `${objectA} on ${objectB}`, objectId: objectB, agentId: objectA },
  };
}

export type FmaKnown = { forceN: number; massKg: number; accelerationMps2?: undefined }
  | { forceN: number; accelerationMps2: number; massKg?: undefined }
  | { massKg: number; accelerationMps2: number; forceN?: undefined };

export function solveFma(values: FmaKnown): { forceN: number; massKg: number; accelerationMps2: number } {
  const force = values.forceN;
  const mass = values.massKg;
  const acceleration = values.accelerationMps2;
  if (mass !== undefined && (!(mass > 0) || !Number.isFinite(mass))) throw new RangeError('Mass must be greater than zero.');
  if (force !== undefined) finite(force, 'Force');
  if (acceleration !== undefined) finite(acceleration, 'Acceleration');
  if (force !== undefined && mass !== undefined) return { forceN: force, massKg: mass, accelerationMps2: force / mass };
  if (force !== undefined && acceleration !== undefined) {
    if (acceleration === 0) throw new RangeError('Mass is undefined when both acceleration and division denominator are zero.');
    const solvedMass = force / acceleration;
    if (!(solvedMass > 0)) throw new RangeError('The supplied force and acceleration do not produce a positive mass.');
    return { forceN: force, massKg: solvedMass, accelerationMps2: acceleration };
  }
  const solvedForce = mass! * acceleration!;
  return { forceN: solvedForce, massKg: mass!, accelerationMps2: acceleration! };
}
