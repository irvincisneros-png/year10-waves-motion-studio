import { describe, it, expect } from 'vitest';
import {
  checkMcq,
  checkNumeric,
  checkUnitSelect,
  checkAnswer,
} from '../../../src/assessment/validate';
import { waveQuestions } from '../../../src/assessment/waveQuestions';
import { soundQuestions } from '../../../src/assessment/soundQuestions';
import type {
  McqQuestion,
  NumericQuestion,
  UnitSelectQuestion,
} from '../../../src/assessment/types';

/**
 * TEST_PLAN §4 — false-positive regressions. Invalid/empty/malformed/unit-wrong
 * answers must NEVER be scored correct.
 */

const mcq = waveQuestions.find((q) => q.id === 'wq-711-vacuum') as McqQuestion;
const numeric = waveQuestions.find((q) => q.id === 'wq-716-lambda') as NumericQuestion;
const unitQ = waveQuestions.find((q) => q.id === 'wq-716-frequency-units') as UnitSelectQuestion;

describe('MCQ validation', () => {
  it('no selection is unattempted, not scored correct', () => {
    const r = checkMcq(mcq, null);
    expect(r.status).toBe('unattempted');
    expect(r.correct).toBe(false);
  });
  it('the misconception distractor is scored incorrect with specific feedback', () => {
    const wrong = mcq.options.find((o) => !o.correct)!;
    const r = checkMcq(mcq, wrong.id);
    expect(r.status).toBe('incorrect');
    expect(r.correct).toBe(false);
    expect(r.feedback).toBe(wrong.feedback);
  });
  it('the correct option is scored correct', () => {
    const right = mcq.options.find((o) => o.correct)!;
    expect(checkMcq(mcq, right.id).correct).toBe(true);
  });
  it('an unknown option id is invalid, never correct', () => {
    expect(checkMcq(mcq, 'does-not-exist').status).toBe('invalid');
  });
});

describe('numeric validation', () => {
  it('empty input is unattempted, not correct', () => {
    const r = checkNumeric(numeric, '');
    expect(r.status).toBe('unattempted');
    expect(r.correct).toBe(false);
  });
  it('non-numeric text is invalid, never coerced to correct', () => {
    for (const bad of ['abc', '0.78 m', 'fast', '½']) {
      const r = checkNumeric(numeric, bad);
      expect(r.status, bad).toBe('invalid');
      expect(r.correct).toBe(false);
    }
  });
  it('a correct value (with 3-sig-fig rounding) is accepted', () => {
    expect(checkNumeric(numeric, '0.780').correct).toBe(true);
    expect(checkNumeric(numeric, '0.7795').correct).toBe(true);
  });
  it('a wrong value is scored incorrect', () => {
    expect(checkNumeric(numeric, '1.5').correct).toBe(false);
  });
});

describe('unit-selection validation', () => {
  it('right number but wrong unit is NOT accepted (unit-only error)', () => {
    const r = checkUnitSelect(unitQ, '100', 'kHz');
    expect(r.correct).toBe(false);
    expect(r.feedback).toMatch(/unit/i);
  });
  it('right number and right unit is correct', () => {
    expect(checkUnitSelect(unitQ, '100', 'MHz').correct).toBe(true);
  });
  it('missing unit is rejected, never correct', () => {
    const r = checkUnitSelect(unitQ, '100', null);
    expect(r.correct).toBe(false);
    expect(r.feedback).toMatch(/unit/i);
  });
  it('empty everything is unattempted', () => {
    expect(checkUnitSelect(unitQ, '', null).status).toBe('unattempted');
  });
});

describe('checkAnswer dispatch', () => {
  it('routes each kind and never marks empty input correct', () => {
    for (const q of waveQuestions) {
      const r = checkAnswer(q, { raw: '', optionId: null, unit: null });
      expect(r.correct, `${q.id} empty answer`).toBe(false);
    }
  });
});

describe('question-bank schema integrity', () => {
  it('has 8–12 questions', () => {
    expect(waveQuestions.length).toBeGreaterThanOrEqual(8);
    expect(waveQuestions.length).toBeLessThanOrEqual(12);
  });
  it('every question has a unique id, 3 progressive hints, and a Stage-2 outcome', () => {
    const ids = new Set<string>();
    const s2 = new Set(['7.1.1', '7.1.2', '7.1.3', '7.1.5', '7.1.6']);
    for (const q of waveQuestions) {
      expect(ids.has(q.id), `duplicate id ${q.id}`).toBe(false);
      ids.add(q.id);
      expect(q.hints).toHaveLength(3);
      expect(q.hints.map((h) => h.level)).toEqual([1, 2, 3]);
      expect(s2.has(q.outcomeCode), `${q.id} outcome ${q.outcomeCode}`).toBe(true);
    }
  });
  it('covers all five Stage-2 outcomes', () => {
    const covered = new Set(waveQuestions.map((q) => q.outcomeCode));
    for (const code of ['7.1.1', '7.1.2', '7.1.3', '7.1.5', '7.1.6']) {
      expect(covered.has(code), `missing ${code}`).toBe(true);
    }
  });
  it('includes at least one graph-interpretation item and one constructed numeric item', () => {
    expect(waveQuestions.some((q) => q.representation === 'graph')).toBe(true);
    expect(waveQuestions.some((q) => q.kind === 'numeric')).toBe(true);
  });
  it('every MCQ has exactly one correct option and feedback on every option', () => {
    for (const q of waveQuestions) {
      if (q.kind !== 'mcq') continue;
      expect(q.options.filter((o) => o.correct)).toHaveLength(1);
      for (const o of q.options) expect(o.feedback.length).toBeGreaterThan(0);
    }
  });
});

describe('sound question-bank integrity and false-positive regressions', () => {
  it('has unique ids, three progressive hints, and covers outcomes 7.2.1–7.2.3', () => {
    const ids = new Set<string>();
    const allowed = new Set(['7.2.1', '7.2.2', '7.2.3']);
    for (const q of soundQuestions) {
      expect(ids.has(q.id), `duplicate id ${q.id}`).toBe(false);
      ids.add(q.id);
      expect(q.hints.map((hint) => hint.level)).toEqual([1, 2, 3]);
      expect(allowed.has(q.outcomeCode), `${q.id} outcome ${q.outcomeCode}`).toBe(true);
    }
    expect(new Set(soundQuestions.map((q) => q.outcomeCode))).toEqual(allowed);
  });

  it('never scores empty, malformed, unknown, or misconception answers as correct', () => {
    for (const q of soundQuestions) {
      expect(
        checkAnswer(q, { raw: '', optionId: null, unit: null }).correct,
        `${q.id} empty answer`,
      ).toBe(false);
      if (q.kind === 'mcq') {
        expect(q.options.filter((option) => option.correct)).toHaveLength(1);
        for (const option of q.options) {
          expect(option.feedback.length).toBeGreaterThan(0);
          if (!option.correct) {
            const result = checkAnswer(q, { raw: '', optionId: option.id, unit: null });
            expect(result.status, `${q.id}/${option.id}`).toBe('incorrect');
            expect(result.correct, `${q.id}/${option.id}`).toBe(false);
            expect(result.feedback).toBe(option.feedback);
          }
        }
        expect(checkAnswer(q, { raw: '', optionId: 'unknown', unit: null }).correct).toBe(false);
      } else if (q.kind === 'numeric') {
        expect(checkAnswer(q, { raw: 'abc', optionId: null, unit: null }).correct).toBe(false);
        expect(checkAnswer(q, { raw: String(q.exactValue * 2), optionId: null, unit: null }).correct).toBe(false);
        expect(
          checkAnswer(q, {
            raw: q.exactValue.toPrecision(3),
            optionId: null,
            unit: null,
          }).correct,
          `${q.id} accepts a 3-s.f. answer`,
        ).toBe(true);
      }
    }
  });
});
