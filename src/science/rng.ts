/**
 * Seeded pseudo-random number generator (mulberry32).
 *
 * SCIENCE_REVIEW.md §18: deterministic ideal mode is the default; optional
 * seeded measurement-noise uses a seeded PRNG so the same seed reproduces the
 * same "experiment". Noise is applied only at the measurement layer, never to
 * the underlying scientific state. Pure TS, no React.
 */

export interface Rng {
  /** Next float in [0, 1). */
  next(): number;
  /** Next float in [min, max). */
  range(min: number, max: number): number;
  /** Symmetric noise in [-magnitude, +magnitude). */
  noise(magnitude: number): number;
}

/**
 * mulberry32 — a small, fast, well-distributed 32-bit seeded generator.
 * Same seed ⇒ identical sequence (bit-for-bit reproducible).
 */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min, max) => min + next() * (max - min),
    noise: (magnitude) => (next() * 2 - 1) * magnitude,
  };
}
