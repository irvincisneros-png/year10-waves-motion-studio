import { useState } from 'react';
import { Page } from '../../components/Page';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useProgressStore } from '../../store/progressStore';
import { nextLevelAfterAttempt, nextLevelAfterSuccess } from '../../store/evidenceHelpers';
import { checkAnswer } from '../../assessment/validate';
import { lightQuestions } from '../../assessment/lightQuestions';
import type { AttemptResult } from '../../assessment/types';

export default function LightCheckPage() {
  const [index, setIndex] = useState(0);
  const [optionId, setOptionId] = useState<string | null>(null);
  const [raw, setRaw] = useState('');
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [score, setScore] = useState({ correct: 0, answered: 0 });
  const { announce } = useAnnouncer();
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);
  const q = lightQuestions[index];
  const finished = index >= lightQuestions.length;
  const locked = result?.status === 'correct' || result?.status === 'incorrect';

  const clear = () => { setOptionId(null); setRaw(''); setResult(null); setHintLevel(0); };
  const submit = () => {
    if (!q || locked) return;
    const nextResult = checkAnswer(q, { raw, optionId, unit: null });
    setResult(nextResult);
    announce(nextResult.correct ? 'Correct.' : nextResult.feedback);
    if (nextResult.status !== 'correct' && nextResult.status !== 'incorrect') return;
    const current = outcomes[q.outcomeCode] ?? 'not-attempted';
    setOutcomeLevel(q.outcomeCode, nextResult.correct ? nextLevelAfterSuccess(current) : nextLevelAfterAttempt(current));
    addEvidence({ outcomeCode: q.outcomeCode, kind: 'check', summary: `${q.id}: answered ${nextResult.correct ? 'correctly' : 'incorrectly'}${q.misconception && !nextResult.correct ? ` (misconception: ${q.misconception})` : ''}` });
    setScore((value) => ({ correct: value.correct + (nextResult.correct ? 1 : 0), answered: value.answered + 1 }));
  };

  if (finished) {
    return <Page title="Light check complete" lead="Your scored evidence for outcomes 7.3.1–7.3.3 has been updated."><div className="card stack"><p data-testid="light-check-summary">You answered {score.correct} of {score.answered} scored questions correctly.</p><button type="button" className="btn btn--primary" data-control-id="optics.check-restart-button" onClick={() => { setIndex(0); clear(); setScore({ correct: 0, answered: 0 }); }}>Start again</button></div></Page>;
  }

  return (
    <Page title="Check light & vision" lead="Test the four key guardrails. Empty, malformed and misconception answers are never scored correct.">
      <div className="card stack" data-control-id="optics.check-question">
        <p className="seg-control__note">Question {index + 1} of {lightQuestions.length} · outcome {q.outcomeCode} · {q.difficulty}</p>
        <h2 data-testid="light-check-prompt">{q.prompt}</h2>
        {q.kind === 'mcq' ? <div className="question-options" role="radiogroup" aria-label="Answer options">{q.options.map((option) => <label key={option.id} className="question-option"><input type="radio" name={`light-${q.id}`} checked={optionId === option.id} onChange={() => { setOptionId(option.id); if (!locked) setResult(null); }} disabled={locked} />{option.text}</label>)}</div> : <div className="field"><label className="field__label" htmlFor="light-check-answer">Your answer</label><div className="field__row"><input id="light-check-answer" className="field__input" inputMode="decimal" value={raw} onChange={(event) => { setRaw(event.target.value); if (!locked) setResult(null); }} disabled={locked} data-testid="light-check-answer" /><span>{q.kind === 'numeric' ? q.unit : q.kind === 'unit-select' ? q.correctUnit : ''}</span></div></div>}
        <div className="seg-control__options">
          {!locked ? <button type="button" className="btn btn--primary" onClick={submit} data-testid="light-check-submit" data-control-id="optics.check-submit-button">Submit answer</button> : <button type="button" className="btn btn--primary" onClick={() => { setIndex((value) => value + 1); clear(); }} data-testid="light-check-next" data-control-id="optics.check-next-button">{index + 1 < lightQuestions.length ? 'Next question' : 'Finish'}</button>}
          {!locked && hintLevel < 3 ? <button type="button" className="btn" onClick={() => setHintLevel((value) => value + 1)} data-control-id="optics.check-hint-button" data-testid="light-check-hint">{hintLevel === 0 ? 'Show a hint' : hintLevel === 1 ? 'Show a stronger hint' : 'Show worked reasoning'}</button> : null}
        </div>
        {hintLevel > 0 && !locked ? <ol>{q.hints.slice(0, hintLevel).map((hint) => <li key={hint.level}><strong>Hint {hint.level}:</strong> {hint.text}</li>)}</ol> : null}
        {result ? <p className={`feedback ${result.status === 'correct' ? 'feedback--correct' : result.status === 'incorrect' ? 'feedback--incorrect' : 'feedback--invalid'}`} role="status" data-testid="light-check-feedback"><span aria-hidden="true">{result.status === 'correct' ? '✓' : result.status === 'incorrect' ? '✗' : '⚠'}</span> <strong>{result.status === 'correct' ? 'Correct. ' : result.status === 'incorrect' ? 'Not correct. ' : ''}</strong>{result.feedback}</p> : null}
      </div>
    </Page>
  );
}
