/**
 * Answer validation for the assessment framework.
 *
 * INTEGRITY (SCIENCE_REVIEW §3.5, shared spec interaction-integrity): invalid,
 * empty, malformed, or unit-wrong input is NEVER scored correct. Numeric
 * checks compare against the exact internal value with the §3.5 tolerance.
 * Every branch here has a dedicated false-positive regression test. Pure TS.
 */

import { checkNumericAnswer, parseNumericField } from '../science/equations';
import type {
  AttemptResult,
  McqQuestion,
  NumericQuestion,
  Question,
  UnitSelectQuestion,
  ConstructedQuestion,
} from './types';

const result = (
  status: AttemptResult['status'],
  feedback: string,
): AttemptResult => ({ status, feedback, correct: status === 'correct' });

/** Multiple-choice: no selection is `unattempted`; a wrong option is scored. */
export function checkMcq(q: McqQuestion, selectedOptionId: string | null): AttemptResult {
  if (!selectedOptionId) {
    return result('unattempted', 'Choose an answer.');
  }
  const option = q.options.find((o) => o.id === selectedOptionId);
  if (!option) {
    return result('invalid', 'That option is not available.');
  }
  return option.correct
    ? result('correct', option.feedback)
    : result('incorrect', option.feedback);
}

export function checkConstructed(q: ConstructedQuestion, raw: string): AttemptResult {
  const trimmed = raw.trim();
  if (!trimmed) return result('unattempted', 'Write a response before submitting.');
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < q.minWords) {
    return result('invalid', `Develop the response to at least ${q.minWords} words.`);
  }
  const lower = trimmed.toLocaleLowerCase('en-AU');
  const missing = q.requiredConceptGroups.filter(
    (group) => !group.some((term) => lower.includes(term.toLocaleLowerCase('en-AU'))),
  );
  if (missing.length > 0) {
    return result('incorrect', `Add evidence about: ${missing.map((group) => group.join(' or ')).join('; ')}.`);
  }
  return result('correct', `Response meets this activity’s concept checklist. ${q.explanation}`);
}

/** Numeric entry: empty/non-numeric/negative rejected; then §3.5 tolerance. */
export function checkNumeric(q: NumericQuestion, raw: string): AttemptResult {
  const parsed = parseNumericField(raw, {
    label: 'numeric',
    allowNegative: q.exactValue < 0,
    allowZero: q.exactValue === 0,
  });
  if (!parsed.ok) {
    // Empty input is "unattempted"; other malformed input is "invalid".
    const status = raw.trim() === '' ? 'unattempted' : 'invalid';
    return result(status, parsed.message);
  }
  const ok = checkNumericAnswer(parsed.value, q.exactValue, {
    sigFigs: q.sigFigs,
    relTol: q.relTol,
  });
  return ok
    ? result('correct', q.explanation)
    : result('incorrect', `Not quite — check your working. The expected value is close to ${q.exactValue} ${q.unit}.`);
}

/**
 * Unit-selection: requires BOTH the right number AND the right unit. A right
 * number with the wrong unit is marked incomplete, never accepted
 * (SCIENCE_REVIEW §3.5 "unit-only errors are never silently accepted").
 */
export function checkUnitSelect(
  q: UnitSelectQuestion,
  raw: string,
  selectedUnit: string | null,
): AttemptResult {
  const parsed = parseNumericField(raw, {
    label: 'value',
    requireUnit: true,
    hasUnit: !!selectedUnit,
    allowNegative: q.exactValue < 0,
    allowZero: q.exactValue === 0,
  });
  if (!parsed.ok) {
    const status = raw.trim() === '' && !selectedUnit ? 'unattempted' : 'invalid';
    return result(status, parsed.message);
  }
  const numberOk = checkNumericAnswer(parsed.value, q.exactValue, {
    sigFigs: q.sigFigs,
    relTol: q.relTol,
  });
  const unitOk = selectedUnit === q.correctUnit;
  if (numberOk && unitOk) return result('correct', q.explanation);
  if (numberOk && !unitOk) {
    return result(
      'incorrect',
      `The number is right, but check the unit — it should be ${q.correctUnit}.`,
    );
  }
  return result('incorrect', 'Not quite — check both the number and the unit.');
}

/** Dispatch by question kind. */
export function checkAnswer(
  q: Question,
  answer: { raw?: string; optionId?: string | null; unit?: string | null },
): AttemptResult {
  switch (q.kind) {
    case 'mcq':
      return checkMcq(q, answer.optionId ?? null);
    case 'numeric':
      return checkNumeric(q, answer.raw ?? '');
    case 'unit-select':
      return checkUnitSelect(q, answer.raw ?? '', answer.unit ?? null);
    case 'constructed':
      return checkConstructed(q, answer.raw ?? '');
  }
}
