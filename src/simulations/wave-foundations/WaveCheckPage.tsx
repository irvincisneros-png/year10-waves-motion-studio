import { useState } from 'react';
import { Page } from '../../components/Page';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useProgressStore } from '../../store/progressStore';
import { nextLevelAfterAttempt, nextLevelAfterSuccess } from '../../store/evidenceHelpers';
import { checkAnswer } from '../../assessment/validate';
import { waveQuestions } from '../../assessment/waveQuestions';
import type { AttemptResult } from '../../assessment/types';

/**
 * Check phase: the wave question set with misconception-specific feedback and
 * progressive hints (prompt → targeted hint → worked reasoning). Correct
 * answers promote the outcome's evidence level; incorrect attempts record the
 * attempt; invalid/empty input is never scored (assessment contract).
 */
export default function WaveCheckPage() {
  const [index, setIndex] = useState(0);
  const [optionId, setOptionId] = useState<string | null>(null);
  const [raw, setRaw] = useState('');
  const [unit, setUnit] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [score, setScore] = useState<{ correct: number; answered: number }>({
    correct: 0,
    answered: 0,
  });

  const { announce } = useAnnouncer();
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);

  const q = waveQuestions[index];
  const finished = index >= waveQuestions.length;
  /** Locked once a SCORED result exists; invalid/empty answers can be fixed. */
  const locked =
    result !== null && (result.status === 'correct' || result.status === 'incorrect');

  const submit = () => {
    if (!q || locked) return;
    const r = checkAnswer(q, { raw, optionId, unit });
    setResult(r);
    announce(r.correct ? 'Correct.' : r.feedback);
    if (r.status === 'correct' || r.status === 'incorrect') {
      const current = outcomes[q.outcomeCode] ?? 'not-attempted';
      setOutcomeLevel(
        q.outcomeCode,
        r.correct ? nextLevelAfterSuccess(current) : nextLevelAfterAttempt(current),
      );
      addEvidence({
        outcomeCode: q.outcomeCode,
        kind: 'check',
        summary: `${q.id}: answered ${r.correct ? 'correctly' : 'incorrectly'}${
          q.misconception && !r.correct ? ` (misconception: ${q.misconception})` : ''
        }`,
      });
      setScore((s) => ({
        correct: s.correct + (r.correct ? 1 : 0),
        answered: s.answered + 1,
      }));
    }
  };

  const next = () => {
    setIndex((i) => i + 1);
    setOptionId(null);
    setRaw('');
    setUnit(null);
    setResult(null);
    setHintLevel(0);
  };

  const restart = () => {
    setIndex(0);
    setOptionId(null);
    setRaw('');
    setUnit(null);
    setResult(null);
    setHintLevel(0);
    setScore({ correct: 0, answered: 0 });
  };

  return (
    <Page
      title="Check questions"
      lead="Test yourself on outcomes 7.1.1–7.1.6. Wrong answers get specific feedback; hints step from a nudge to worked reasoning."
    >
      {finished ? (
        <div className="card stack">
          <h2>Finished</h2>
          <p data-testid="check-summary">
            You answered {score.correct} of {score.answered} scored questions
            correctly. Your evidence levels have been updated on the Progress
            page — retry any time.
          </p>
          <button type="button" className="btn btn--primary" onClick={restart} data-testid="check-restart">
            Start again
          </button>
        </div>
      ) : (
        <div className="card stack" data-control-id="wave-lab.check-question">
          <p className="seg-control__note" data-testid="check-progress">
            Question {index + 1} of {waveQuestions.length} · outcome {q.outcomeCode} ·{' '}
            {q.difficulty}
          </p>
          <h2 data-testid="check-prompt">{q.prompt}</h2>

          {q.kind === 'mcq' ? (
            <div className="question-options" role="radiogroup" aria-label="Answer options">
              {q.options.map((o) => (
                <label key={o.id} className="question-option">
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={optionId === o.id}
                    onChange={() => {
                      setOptionId(o.id);
                      if (!locked) setResult(null);
                    }}
                    disabled={locked}
                    data-testid={`option-${o.id}`}
                  />
                  {o.text}
                </label>
              ))}
            </div>
          ) : (
            <div className="field">
              <label className="field__label" htmlFor="check-answer">
                Your answer
              </label>
              <div className="field__row">
                <input
                  id="check-answer"
                  className="field__input"
                  inputMode="decimal"
                  value={raw}
                  onChange={(e) => {
                    setRaw(e.target.value);
                    if (!locked) setResult(null);
                  }}
                  disabled={locked}
                  data-testid="check-numeric-input"
                />
                {q.kind === 'unit-select' ? (
                  <select
                    className="field__unit"
                    aria-label="Answer unit"
                    value={unit ?? ''}
                    onChange={(e) => {
                      setUnit(e.target.value || null);
                      if (!locked) setResult(null);
                    }}
                    disabled={locked}
                    data-testid="check-unit-select"
                  >
                    <option value="">— unit —</option>
                    {q.unitOptions.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span>{q.unit}</span>
                )}
              </div>
            </div>
          )}

          <div className="seg-control__options">
            {!locked ? (
              <button type="button" className="btn btn--primary" onClick={submit} data-testid="check-submit">
                Submit answer
              </button>
            ) : (
              <button type="button" className="btn btn--primary" onClick={next} data-testid="check-next">
                {index + 1 < waveQuestions.length ? 'Next question' : 'Finish'}
              </button>
            )}
            {!locked && hintLevel < 3 ? (
              <button
                type="button"
                className="btn"
                onClick={() => setHintLevel((h) => h + 1)}
                data-testid="check-hint"
                data-control-id="wave-lab.check-hint-button"
              >
                {hintLevel === 0
                  ? 'Show a hint'
                  : hintLevel === 1
                    ? 'Show a stronger hint'
                    : 'Show worked reasoning'}
              </button>
            ) : null}
          </div>

          {hintLevel > 0 && !locked ? (
            <ol className="stack" data-testid="check-hints">
              {q.hints.slice(0, hintLevel).map((h) => (
                <li key={h.level}>
                  <strong>Hint {h.level}:</strong> {h.text}
                </li>
              ))}
            </ol>
          ) : null}

          {result ? (
            <p
              className={`feedback ${
                result.status === 'correct'
                  ? 'feedback--correct'
                  : result.status === 'incorrect'
                    ? 'feedback--incorrect'
                    : 'feedback--invalid'
              }`}
              role="status"
              data-testid="check-feedback"
            >
              <span aria-hidden="true">
                {result.status === 'correct' ? '✓' : result.status === 'incorrect' ? '✗' : '⚠'}
              </span>
              <span>
                <strong>
                  {result.status === 'correct'
                    ? 'Correct. '
                    : result.status === 'incorrect'
                      ? 'Not correct. '
                      : ''}
                </strong>
                {result.feedback}
              </span>
            </p>
          ) : null}

        </div>
      )}
    </Page>
  );
}
