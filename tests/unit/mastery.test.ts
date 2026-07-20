import { describe, expect, it } from 'vitest';
import { masteryQuestionBank, masterySessionQuestions } from '../../src/assessment/masteryQuestions';
import { checkConstructed } from '../../src/assessment/validate';
import { ACTIVE_OUTCOME_CODES, DEFERRED_OUTCOME_CODES } from '../../src/content/releaseRegistry';

describe('Stage 6 mastery bank gate', () => {
  it('has at least 60 unique, fully tagged questions and at least one-third constructed response', () => {
    expect(masteryQuestionBank.length).toBeGreaterThanOrEqual(60);
    expect(new Set(masteryQuestionBank.map((question) => question.id)).size).toBe(masteryQuestionBank.length);
    expect(masteryQuestionBank.filter((question) => question.kind === 'constructed').length)
      .toBeGreaterThanOrEqual(Math.ceil(masteryQuestionBank.length / 3));
    for (const question of masteryQuestionBank) {
      expect(question.outcomeCode).not.toBe('');
      expect(question.concept).not.toBe('');
      expect(question.difficulty).not.toBe('');
      expect(question.representation).not.toBe('');
      expect(question.misconception).not.toBe('');
      expect(question.hints.map((hint) => hint.level)).toEqual([1, 2, 3]);
    }
  });

  it('covers every active outcome, excludes deferred content, and builds a 20-item mixed session', () => {
    expect(new Set(masteryQuestionBank.map((question) => question.outcomeCode))).toEqual(new Set(ACTIVE_OUTCOME_CODES));
    for (const code of DEFERRED_OUTCOME_CODES) expect(masteryQuestionBank.some((question) => question.outcomeCode === code)).toBe(false);
    expect(masterySessionQuestions).toHaveLength(20);
    expect(masterySessionQuestions.some((question) => question.kind === 'constructed')).toBe(true);
    expect(masterySessionQuestions.some((question) => question.kind !== 'constructed')).toBe(true);
  });

  it('constructed validation never accepts empty, short, or keyword-free padding', () => {
    const question = masteryQuestionBank.find((item) => item.kind === 'constructed');
    if (!question || question.kind !== 'constructed') throw new Error('Constructed question missing');
    for (const response of ['', 'very short answer', 'This response has many generic words but gives no relevant scientific evidence and repeats vague filler without addressing the required concepts at all.']) {
      expect(checkConstructed(question, response).correct, response).toBe(false);
    }
    const valid = `The ${question.requiredConceptGroups[0][0]} evidence connects with ${question.requiredConceptGroups[1][0]} in this model. The claim uses both observations to explain the outcome, while noting that the simplified representation has a boundary and should not be overgeneralised.`;
    expect(checkConstructed(question, valid).correct).toBe(true);
  });
});
