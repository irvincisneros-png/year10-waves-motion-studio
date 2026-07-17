/**
 * Reusable assessment framework — typed question schema.
 *
 * Every question is tagged with outcome / concept / difficulty / representation
 * and (where relevant) the SCIENCE_REVIEW §21 misconception it targets. Answer
 * validation lives in `validate.ts` and NEVER accepts malformed, empty, or
 * unit-invalid input as correct (shared spec: no false positives). Pure TS,
 * no React.
 */

export type Difficulty = 'foundational' | 'developing' | 'challenging';

export type Representation = 'text' | 'numeric' | 'graph' | 'diagram' | 'equation';

/** Progressive hint: level 1 = prompt, 2 = targeted hint, 3 = worked reasoning. */
export interface Hint {
  level: 1 | 2 | 3;
  text: string;
}

export interface QuestionBase {
  id: string;
  outcomeCode: string;
  concept: string;
  /** SCIENCE_REVIEW §21 misconception addressed, if any. */
  misconception?: string;
  difficulty: Difficulty;
  representation: Representation;
  prompt: string;
  /** Exactly three progressive hints. */
  hints: [Hint, Hint, Hint];
  /** Worked explanation revealed after a correct answer or on request. */
  explanation: string;
}

export interface McqOption {
  id: string;
  text: string;
  correct: boolean;
  /** Explained distractor feedback (why this option is right/wrong). */
  feedback: string;
}

export interface McqQuestion extends QuestionBase {
  kind: 'mcq';
  options: McqOption[];
}

export interface NumericQuestion extends QuestionBase {
  kind: 'numeric';
  /** Exact expected value in the displayed unit. */
  exactValue: number;
  /** Fixed unit shown beside the input (e.g. "m", "Hz"). */
  unit: string;
  sigFigs?: number;
  relTol?: number;
}

export interface UnitSelectQuestion extends QuestionBase {
  kind: 'unit-select';
  /** Correct numeric part (in the correct unit). */
  exactValue: number;
  correctUnit: string;
  unitOptions: string[];
  sigFigs?: number;
  relTol?: number;
}

export type Question = McqQuestion | NumericQuestion | UnitSelectQuestion;

/** Outcome of a single attempt. `unattempted` is neither right nor wrong. */
export type AttemptStatus = 'correct' | 'incorrect' | 'invalid' | 'unattempted';

export interface AttemptResult {
  status: AttemptStatus;
  /** Feedback message shown to the student (never colour-only). */
  feedback: string;
  /** True only for `status: 'correct'`. */
  correct: boolean;
}
