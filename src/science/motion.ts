/** Pure one-dimensional motion engine for Stage 5 (outcomes 7.4.1–7.4.3, 7.4.7). */

export type PositiveDirection = 'right' | 'left';

export interface TrackState {
  timeS: number;
  /** Physical coordinate increases to the right, independent of the student's convention. */
  physicalPositionM: number;
  physicalVelocityMps: number;
  /** Accumulated scalar path length. */
  distanceM: number;
}

export interface TrackReadout {
  timeS: number;
  positionM: number;
  displacementM: number;
  distanceM: number;
  velocityMps: number;
  speedMps: number;
  accelerationMps2: number;
}

export interface MotionSegment {
  durationS: number;
  accelerationMps2: number;
}

const finite = (value: number, label: string) => {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be a finite number.`);
};

function distanceDuring(v0: number, acceleration: number, duration: number): number {
  if (acceleration === 0) return Math.abs(v0) * duration;
  const crossing = -v0 / acceleration;
  const displacement = (time: number) => v0 * time + 0.5 * acceleration * time * time;
  if (crossing <= 0 || crossing >= duration) return Math.abs(displacement(duration));
  return Math.abs(displacement(crossing)) + Math.abs(displacement(duration) - displacement(crossing));
}

export function advanceTrack(
  state: TrackState,
  accelerationMps2: number,
  durationS: number,
): TrackState {
  finite(accelerationMps2, 'Acceleration');
  finite(durationS, 'Duration');
  if (durationS <= 0) throw new RangeError('Duration must be greater than zero.');
  const displacement = state.physicalVelocityMps * durationS + 0.5 * accelerationMps2 * durationS ** 2;
  return {
    timeS: state.timeS + durationS,
    physicalPositionM: state.physicalPositionM + displacement,
    physicalVelocityMps: state.physicalVelocityMps + accelerationMps2 * durationS,
    distanceM: state.distanceM + distanceDuring(state.physicalVelocityMps, accelerationMps2, durationS),
  };
}

export function simulateMotion(initial: TrackState, segments: readonly MotionSegment[]): TrackState[] {
  const states = [initial];
  for (const segment of segments) states.push(advanceTrack(states.at(-1)!, segment.accelerationMps2, segment.durationS));
  return states;
}

export function trackReadout(
  state: TrackState,
  originPhysicalM: number,
  positiveDirection: PositiveDirection,
  accelerationPhysicalMps2 = 0,
  runStartPhysicalM = originPhysicalM,
): TrackReadout {
  finite(originPhysicalM, 'Origin');
  finite(runStartPhysicalM, 'Run start');
  const sign = positiveDirection === 'right' ? 1 : -1;
  const positionM = (state.physicalPositionM - originPhysicalM) * sign;
  const displacementM = (state.physicalPositionM - runStartPhysicalM) * sign;
  const velocityMps = state.physicalVelocityMps * sign;
  return {
    timeS: state.timeS,
    positionM,
    displacementM,
    distanceM: state.distanceM,
    velocityMps,
    speedMps: Math.abs(state.physicalVelocityMps),
    accelerationMps2: accelerationPhysicalMps2 * sign,
  };
}

export function averageSpeed(distanceM: number, timeS: number): number {
  finite(distanceM, 'Distance'); finite(timeS, 'Time');
  if (distanceM < 0) throw new RangeError('Distance cannot be negative.');
  if (timeS <= 0) throw new RangeError('Time must be greater than zero.');
  return distanceM / timeS;
}

export function averageVelocity(displacementM: number, timeS: number): number {
  finite(displacementM, 'Displacement'); finite(timeS, 'Time');
  if (timeS <= 0) throw new RangeError('Time must be greater than zero.');
  return displacementM / timeS;
}

export function accelerationFromVelocity(initialMps: number, finalMps: number, timeS: number): number {
  finite(initialMps, 'Initial velocity'); finite(finalMps, 'Final velocity'); finite(timeS, 'Time');
  if (timeS <= 0) throw new RangeError('Time must be greater than zero.');
  return (finalMps - initialMps) / timeS;
}

export interface GraphPoint { at: number; value: number }

export function slopeBetween(points: readonly GraphPoint[], firstIndex: number, secondIndex: number): number {
  if (!Number.isInteger(firstIndex) || !Number.isInteger(secondIndex) || !points[firstIndex] || !points[secondIndex]) {
    throw new RangeError('Choose two available graph points.');
  }
  if (firstIndex === secondIndex) throw new RangeError('Choose two different points.');
  const first = points[firstIndex];
  const second = points[secondIndex];
  const deltaTime = second.at - first.at;
  if (deltaTime === 0) throw new RangeError('Graph points must have different times.');
  return (second.value - first.value) / deltaTime;
}

export function areaUnderVelocity(points: readonly GraphPoint[]): number {
  if (points.length < 2) throw new RangeError('At least two velocity-time points are required.');
  let area = 0;
  for (let index = 1; index < points.length; index++) {
    const dt = points[index].at - points[index - 1].at;
    if (!(dt > 0)) throw new RangeError('Velocity-time points must be in increasing time order.');
    area += ((points[index - 1].value + points[index].value) / 2) * dt;
  }
  return area;
}

export type MotionPattern = 'constant' | 'acceleration' | 'deceleration' | 'reversal' | 'rest';

export function motionDiagram(pattern: MotionPattern, intervalS = 0.2, dotCount = 6): number[] {
  if (!(intervalS > 0) || !Number.isFinite(intervalS)) throw new RangeError('Time interval must be greater than zero.');
  if (!Number.isInteger(dotCount) || dotCount < 2 || dotCount > 8) throw new RangeError('Dot count must be from 2 to 8.');
  return Array.from({ length: dotCount }, (_, index) => {
    const t = index * intervalS;
    if (pattern === 'rest') return 0;
    if (pattern === 'constant') return 2 * t;
    if (pattern === 'acceleration') return 0.5 * t + 1.5 * t ** 2;
    if (pattern === 'deceleration') return 3 * t - 0.4 * t ** 2;
    return 2 * t - 2 * t ** 2;
  });
}

export function diagramVectors(positionsM: readonly number[], intervalS: number) {
  if (positionsM.length < 2 || !(intervalS > 0)) throw new RangeError('Two positions and a positive interval are required.');
  const velocitiesMps = positionsM.slice(1).map((position, index) => (position - positionsM[index]) / intervalS);
  const accelerationsMps2 = velocitiesMps.slice(1).map((velocity, index) => (velocity - velocitiesMps[index]) / intervalS);
  return { velocitiesMps, accelerationsMps2 };
}

export function evaluateMotionDiagram(pattern: MotionPattern, positionsM: readonly number[]): { correct: boolean; feedback: string } {
  if (positionsM.length < 4) return { correct: false, feedback: 'Place at least four equal-time position dots before checking.' };
  if (positionsM.some((value) => !Number.isFinite(value))) return { correct: false, feedback: 'Every dot position must be a finite number.' };
  const gaps = positionsM.slice(1).map((position, index) => position - positionsM[index]);
  const magnitudes = gaps.map(Math.abs);
  const allNearZero = magnitudes.every((gap) => gap <= 0.1);
  const sameDirection = gaps.every((gap) => gap > 0) || gaps.every((gap) => gap < 0);
  const increasing = magnitudes.slice(1).every((gap, index) => gap > magnitudes[index] + 0.05);
  const decreasing = magnitudes.slice(1).every((gap, index) => gap < magnitudes[index] - 0.05);
  const mean = magnitudes.reduce((sum, gap) => sum + gap, 0) / magnitudes.length;
  const constant = sameDirection && magnitudes.every((gap) => Math.abs(gap - mean) <= Math.max(0.1, mean * 0.15));
  const reversal = gaps.some((gap, index) => index > 0 && Math.sign(gap) !== Math.sign(gaps[index - 1]));
  const correct = pattern === 'rest' ? allNearZero : pattern === 'constant' ? constant : pattern === 'acceleration' ? sameDirection && increasing : pattern === 'deceleration' ? sameDirection && decreasing : reversal;
  const feedback: Record<MotionPattern, string> = {
    rest: correct ? 'The dots stay together: the object is at rest.' : 'Rest needs repeated position dots at the same place.',
    constant: correct ? 'Equal gaps show constant velocity at equal time intervals.' : 'Constant velocity needs equal-sized gaps in one direction.',
    acceleration: correct ? 'Increasing gaps show increasing speed.' : 'Acceleration needs gaps that get progressively farther apart.',
    deceleration: correct ? 'Decreasing gaps show decreasing speed.' : 'Deceleration needs gaps that get progressively closer together without reversing.',
    reversal: correct ? 'The gap direction changes, so the object reverses.' : 'A reversal needs successive dot gaps to change direction.',
  };
  return { correct, feedback: feedback[pattern] };
}
