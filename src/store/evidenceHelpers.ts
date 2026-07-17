import type { OutcomeLevel } from './progressData';

/**
 * Evidence-level progression rules (pure, unit-tested).
 *
 * A correct/complete piece of evidence moves an outcome UP one level
 * (not-attempted → developing → secure) and never down. An attempted-but-
 * incorrect piece of evidence floors the outcome at `developing`'s doorstep:
 * it records the attempt (not-attempted → developing) but never promotes to
 * secure and never demotes. Invalid/unattempted input changes nothing.
 */

export function nextLevelAfterSuccess(current: OutcomeLevel): OutcomeLevel {
  if (current === 'not-attempted') return 'developing';
  return 'secure';
}

export function nextLevelAfterAttempt(current: OutcomeLevel): OutcomeLevel {
  if (current === 'not-attempted') return 'developing';
  return current;
}
