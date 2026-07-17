/**
 * The wave equation v = fλ, its rearrangements, and the validation +
 * answer-checking rules from SCIENCE_REVIEW.md §2–§3.
 *
 * INTEGRITY CONTRACT (SCIENCE_REVIEW §2.3, §3.5; shared spec "no false
 * positives"): division is guarded (f=0 or λ=0 return an explicit error, never
 * ∞/NaN); malformed, empty, negative, unit-ambiguous, or internally
 * inconsistent input is NEVER coerced into a pass. Pure TS, no React.
 */

// ------------------------------------------------------------------ results

export type Solved = { ok: true; value: number };
export type SolveError = { ok: false; code: string; message: string };
export type SolveResult = Solved | SolveError;

const err = (code: string, message: string): SolveError => ({ ok: false, code, message });

// ------------------------------------------------------- v = fλ (SI, exact)

/** v = f λ. */
export function solveForSpeed(frequencyHz: number, wavelengthM: number): SolveResult {
  if (!Number.isFinite(frequencyHz) || !Number.isFinite(wavelengthM)) {
    return err('non-finite', 'Frequency and wavelength must be numbers.');
  }
  return { ok: true, value: frequencyHz * wavelengthM };
}

/** f = v / λ, guarded against λ = 0 (SCIENCE_REVIEW §2.3). */
export function solveForFrequency(speedMps: number, wavelengthM: number): SolveResult {
  if (!Number.isFinite(speedMps) || !Number.isFinite(wavelengthM)) {
    return err('non-finite', 'Speed and wavelength must be numbers.');
  }
  if (wavelengthM === 0) {
    return err('zero-wavelength', 'Wavelength cannot be 0 m — not defined for a zero-length wave.');
  }
  return { ok: true, value: speedMps / wavelengthM };
}

/** λ = v / f, guarded against f = 0 (SCIENCE_REVIEW §2.3, outcome 7.1.6). */
export function solveForWavelength(speedMps: number, frequencyHz: number): SolveResult {
  if (!Number.isFinite(speedMps) || !Number.isFinite(frequencyHz)) {
    return err('non-finite', 'Speed and frequency must be numbers.');
  }
  if (frequencyHz === 0) {
    return err('zero-frequency', 'Frequency cannot be 0 Hz for a travelling wave.');
  }
  return { ok: true, value: speedMps / frequencyHz };
}

/** T = 1 / f, guarded against f = 0 (SCIENCE_REVIEW §1.4). */
export function periodOf(frequencyHz: number): SolveResult {
  if (!Number.isFinite(frequencyHz)) return err('non-finite', 'Frequency must be a number.');
  if (frequencyHz === 0) return err('zero-frequency', 'Frequency cannot be 0 Hz for a travelling wave.');
  return { ok: true, value: 1 / frequencyHz };
}

/** f = 1 / T, guarded against T = 0. */
export function frequencyOfPeriod(periodS: number): SolveResult {
  if (!Number.isFinite(periodS)) return err('non-finite', 'Period must be a number.');
  if (periodS === 0) return err('zero-period', 'Period cannot be 0 s.');
  return { ok: true, value: 1 / periodS };
}

// ------------------------------------------------- calculator field parsing

export interface FieldParseOptions {
  label: string;
  /** Field must have a unit tag selected (e.g. Hz vs kHz). */
  requireUnit?: boolean;
  hasUnit?: boolean;
  allowZero?: boolean;
  allowNegative?: boolean;
  /** Custom message for the zero case (e.g. the f=0 boundary). */
  zeroMessage?: string;
}

export type FieldResult =
  | { ok: true; value: number }
  | { ok: false; message: string };

/**
 * Parse a student-typed field value with the SCIENCE_REVIEW §3.5 rules. A bare
 * number with no unit is rejected when a unit is required; empty, non-numeric,
 * negative and (by default) zero values are rejected with specific messages —
 * never silently coerced to 0/NaN.
 */
export function parseNumericField(raw: string, opts: FieldParseOptions): FieldResult {
  const trimmed = (raw ?? '').trim();
  if (trimmed === '') {
    return { ok: false, message: `Enter a ${opts.label} value.` };
  }
  if (opts.requireUnit && !opts.hasUnit) {
    return { ok: false, message: 'Select a unit before submitting.' };
  }
  // Reject anything that is not a clean decimal number (blocks "5 metres",
  // "fast", "½", trailing text, etc.). Allow leading sign + scientific form.
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(trimmed)) {
    return { ok: false, message: 'Enter a number.' };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { ok: false, message: 'Enter a number.' };
  }
  if (!opts.allowNegative && value < 0) {
    return { ok: false, message: `${cap(opts.label)} cannot be negative.` };
  }
  if (!opts.allowZero && value === 0) {
    return { ok: false, message: opts.zeroMessage ?? `${cap(opts.label)} cannot be 0.` };
  }
  return { ok: true, value };
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ------------------------------------------------------- triple consistency

/**
 * Check whether a fully-specified v, f, λ triple (all SI) satisfies v = fλ
 * within the given relative tolerance (default 1%, matching the calculator's
 * internal-consistency check). Returns false for a triple that does not — the
 * caller must NOT accept it (SCIENCE_REVIEW §20.1).
 */
export function tripleIsConsistent(
  speedMps: number,
  frequencyHz: number,
  wavelengthM: number,
  relTol = 0.01,
): boolean {
  if (![speedMps, frequencyHz, wavelengthM].every(Number.isFinite)) return false;
  if (speedMps === 0) return false;
  const predicted = frequencyHz * wavelengthM;
  return Math.abs(predicted - speedMps) / Math.abs(speedMps) <= relTol;
}

// --------------------------------------------------------- answer checking

export interface AnswerCheckOptions {
  /** Significant figures the student is expected to work to (default 3). */
  sigFigs?: number;
  /** Relative tolerance (default 1% per SCIENCE_REVIEW §3.5). */
  relTol?: number;
}

/**
 * True when a student's numeric value matches the exact value within the
 * SCIENCE_REVIEW §3.5 tolerance: ±relTol of exact OR ±1 in the last shown
 * significant figure, WHICHEVER IS LARGER. Comparison is always against the
 * exact internal value, not the display-rounded one. Rejects non-finite input.
 */
export function checkNumericAnswer(
  student: number,
  exact: number,
  opts: AnswerCheckOptions = {},
): boolean {
  if (!Number.isFinite(student) || !Number.isFinite(exact)) return false;
  const sigFigs = opts.sigFigs ?? 3;
  const relTol = opts.relTol ?? 0.01;
  const relTolerance = Math.abs(exact) * relTol;
  const lastFigStep =
    exact === 0 ? 1 : 10 ** (Math.floor(Math.log10(Math.abs(exact))) - (sigFigs - 1));
  const tolerance = Math.max(relTolerance, lastFigStep);
  return Math.abs(student - exact) <= tolerance;
}
