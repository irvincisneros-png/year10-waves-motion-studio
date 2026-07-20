import { useState } from 'react';
import { Page } from '../../components/Page';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useProgressStore } from '../../store/progressStore';
import { nextLevelAfterAttempt, nextLevelAfterSuccess } from '../../store/evidenceHelpers';
import { checkAnswer } from '../../assessment/validate';
import { soundQuestions } from '../../assessment/soundQuestions';
import type { AttemptResult } from '../../assessment/types';

/** Stage 3 Check phase with misconception-specific feedback and three hints. */
export default function SoundCheckPage() {
  const [index, setIndex] = useState(0);
  const [optionId, setOptionId] = useState<string | null>(null);
  const [raw, setRaw] = useState('');
  const [unit, setUnit] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [score, setScore] = useState({ correct: 0, answered: 0 });

  const { announce } = useAnnouncer();
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);

  const q = soundQuestions[index];
  const finished = index >= soundQuestions.length;
  const locked = result?.status === 'correct' || result?.status === 'incorrect';

  const submit = () => {
    if (!q || locked) return;
    const nextResult = checkAnswer(q, { raw, optionId, unit });
    setResult(nextResult);
    announce(nextResult.correct ? 'Correct.' : nextResult.feedback);
    if (nextResult.status !== 'correct' && nextResult.status !== 'incorrect') return;

    const current = outcomes[q.outcomeCode] ?? 'not-attempted';
    setOutcomeLevel(
      q.outcomeCode,
      nextResult.correct ? nextLevelAfterSuccess(current) : nextLevelAfterAttempt(current),
    );
    addEvidence({
      outcomeCode: q.outcomeCode,
      kind: 'check',
      summary: `${q.id}: answered ${nextResult.correct ? 'correctly' : 'incorrectly'}${
        q.misconception && !nextResult.correct ? ` (misconception: ${q.misconception})` : ''
      }`,
    });
    setScore((previous) => ({
      correct: previous.correct + (nextResult.correct ? 1 : 0),
      answered: previous.answered + 1,
    }));
  };

  const clearQuestion = () => {
    setOptionId(null);
    setRaw('');
    setUnit(null);
    setResult(null);
    setHintLevel(0);
  };

  const next = () => {
    setIndex((current) => current + 1);
    clearQuestion();
  };

  const restart = () => {
    setIndex(0);
    clearQuestion();
    setScore({ correct: 0, answered: 0 });
  };

  return (
    <Page
      title="Check questions"
      lead="Test your sound-wave thinking. Invalid or empty answers are never scored, and each misconception gets specific feedback."
    >
      {finished ? (
        <div className="card stack">
          <h2>Finished</h2>
          <p data-testid="sound-check-summary">
            You answered {score.correct} of {score.answered} scored questions correctly. Your
            evidence for outcomes 7.2.1–7.2.3 has been updated.
          </p>
          <button type="button" className="btn btn--primary" onClick={restart} data-testid="sound-check-restart">
            Start again
          </button>
        </div>
      ) : (
        <div className="card stack" data-control-id="sound-lab.check-question">
          <p className="seg-control__note" data-testid="sound-check-progress">
            Question {index + 1} of {soundQuestions.length} · outcome {q.outcomeCode} · {q.difficulty}
          </p>
          <h2 data-testid="sound-check-prompt">{q.prompt}</h2>

          {q.kind === 'mcq' ? (
            <div className="question-options" role="radiogroup" aria-label="Answer options">
              {q.options.map((option) => (
                <label key={option.id} className="question-option">
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={optionId === option.id}
                    onChange={() => {
                      setOptionId(option.id);
                      if (!locked) setResult(null);
                    }}
                    disabled={locked}
                    data-testid={`sound-option-${option.id}`}
                  />
                  {option.text}
                </label>
              ))}
            </div>
          ) : (
            <div className="field">
              <label className="field__label" htmlFor="sound-check-answer">
                Your answer
              </label>
              <div className="field__row">
                <input
                  id="sound-check-answer"
                  className="field__input"
                  inputMode="decimal"
                  value={raw}
                  onChange={(event) => {
                    setRaw(event.target.value);
                    if (!locked) setResult(null);
                  }}
                  disabled={locked}
                  data-testid="sound-check-numeric-input"
                />
                {q.kind === 'unit-select' ? (
                  <select
                    className="field__unit"
                    aria-label="Answer unit"
                    value={unit ?? ''}
                    onChange={(event) => setUnit(event.target.value || null)}
                    disabled={locked}
                    data-testid="sound-check-unit-select"
                  >
                    <option value="">— unit —</option>
                    {q.unitOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
              <span>{q.kind === 'numeric' ? q.unit : ''}</span>
                )}
              </div>
            </div>
          )}

          <div className="seg-control__options">
            {!locked ? (
              <button type="button" className="btn btn--primary" onClick={submit} data-testid="sound-check-submit">
                Submit answer
              </button>
            ) : (
              <button type="button" className="btn btn--primary" onClick={next} data-testid="sound-check-next">
                {index + 1 < soundQuestions.length ? 'Next question' : 'Finish'}
              </button>
            )}
            {!locked && hintLevel < 3 ? (
              <button
                type="button"
                className="btn"
                onClick={() => setHintLevel((level) => level + 1)}
                data-testid="sound-check-hint"
                data-control-id="sound-lab.check-hint-button"
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
            <ol className="stack" data-testid="sound-check-hints">
              {q.hints.slice(0, hintLevel).map((hint) => (
                <li key={hint.level}>
                  <strong>Hint {hint.level}:</strong> {hint.text}
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
              data-testid="sound-check-feedback"
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
