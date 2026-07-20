import { useState } from 'react';
import { Page } from '../../components/Page';
import { masteryQuestionBank, masterySessionQuestions } from '../../assessment/masteryQuestions';
import { checkAnswer } from '../../assessment/validate';
import type { AttemptResult } from '../../assessment/types';
import { ACTIVE_OUTCOME_CODES } from '../../content/releaseRegistry';
import { useProgressStore } from '../../store/progressStore';

export default function MasteryPage() {
  const [index, setIndex] = useState(0);
  const [optionId, setOptionId] = useState<string | null>(null);
  const [raw, setRaw] = useState('');
  const [unit, setUnit] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [hints, setHints] = useState<Set<number>>(new Set());
  const outcomes = useProgressStore((state) => state.outcomes);
  const addEvidence = useProgressStore((state) => state.addEvidence);
  const question = masterySessionQuestions[index];
  const clear = () => { setOptionId(null); setRaw(''); setUnit(null); setResult(null); setHints(new Set()); };
  const submit = () => {
    const next = checkAnswer(question, { optionId, raw, unit });
    setResult(next);
    if (next.status !== 'unattempted' && next.status !== 'invalid') {
      addEvidence({ outcomeCode: question.outcomeCode, kind: 'mastery', activityId: question.id, result: next.correct ? 'successful' : 'attempted', summary: `${question.id}: ${next.status}` });
    }
  };
  return <Page title="Mastery challenge" lead={`A balanced 20-question session drawn from ${masteryQuestionBank.length} validated questions. Constructed responses make up more than one third of the complete bank.`}>
    <section className="card stack" data-control-id="mastery.answer-input"><div className="eyebrow">Question {index + 1} of {masterySessionQuestions.length}</div><p><strong>{question.outcomeCode} · {question.concept}</strong></p><h2>{question.prompt}</h2>
      {question.kind === 'mcq' ? <fieldset><legend>Choose one answer</legend>{question.options.map((option) => <label className="toggle" key={option.id}><input type="radio" name="mastery-answer" checked={optionId === option.id} onChange={() => { setOptionId(option.id); setResult(null); }} /><span className="toggle__text">{option.text}</span></label>)}</fieldset> : null}
      {question.kind === 'numeric' ? <label>Numeric answer ({question.unit})<input type="text" inputMode="decimal" value={raw} onChange={(event) => { setRaw(event.target.value); setResult(null); }} /></label> : null}
      {question.kind === 'unit-select' ? <div className="s6-inline"><label>Numeric answer<input type="text" inputMode="decimal" value={raw} onChange={(event) => { setRaw(event.target.value); setResult(null); }} /></label><label>Unit<select value={unit ?? ''} onChange={(event) => setUnit(event.target.value || null)}><option value="">Select a unit</option>{question.unitOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label></div> : null}
      {question.kind === 'constructed' ? <><label>Constructed response<textarea rows={7} value={raw} onChange={(event) => { setRaw(event.target.value); setResult(null); }} data-testid="mastery-constructed" /></label><details><summary>Concept checklist for this response</summary><ul>{question.rubric.map((item) => <li key={item}>{item}</li>)}</ul><p>This deterministic checker confirms required concepts; a teacher still judges the quality and validity of the argument.</p></details></> : null}
      <div className="button-row"><button type="button" className="btn btn--primary" onClick={submit} data-control-id="mastery.question-submit-button">Submit answer</button><button type="button" className="btn" onClick={clear} data-control-id="mastery.retry-button">Retry this question</button></div>{result ? <p role="status" className={result.correct ? 'feedback feedback--correct' : 'feedback feedback--incorrect'} data-testid="mastery-feedback" data-teacher-layer="answers">{result.correct ? '✓ ' : 'Check: '}{result.feedback}</p> : null}
      <div className="button-row" data-control-id="mastery.hint-reveal-buttons">{question.hints.map((hint) => <button type="button" className="btn" key={hint.level} disabled={hint.level === 3 && !result} aria-expanded={hints.has(hint.level)} onClick={() => setHints(new Set([...hints, hint.level]))}>{hint.level === 1 ? 'Show prompt' : hint.level === 2 ? 'Show targeted hint' : 'Show worked reasoning'}</button>)}</div>{question.hints.filter((hint) => hints.has(hint.level)).map((hint) => <p className="notice" key={hint.level}><strong>Hint {hint.level}:</strong> {hint.text}</p>)}
      <nav className="button-row" aria-label="Mastery question navigation" data-control-id="mastery.question-nav-buttons"><button type="button" className="btn" disabled={index === 0} onClick={() => { setIndex((current) => current - 1); clear(); }}>Previous question</button><button type="button" className="btn" disabled={index === masterySessionQuestions.length - 1 || !result} title={!result ? 'Submit an attempt before moving on' : undefined} onClick={() => { setIndex((current) => current + 1); clear(); }}>Next question</button></nav>
    </section>
    <section className="card stack" aria-labelledby="mastery-progress" data-control-id="mastery.progress-report-view"><h2 id="mastery-progress">Mastery progress by outcome</h2><div className="s6-table-wrap" tabIndex={0} role="region" aria-label="Mastery progress table"><table><thead><tr><th>Outcome</th><th>Evidence-derived level</th></tr></thead><tbody>{ACTIVE_OUTCOME_CODES.map((code) => <tr key={code}><th>{code}</th><td>{(outcomes[code] ?? 'not-attempted').replace('-', ' ')}</td></tr>)}</tbody></table></div></section>
  </Page>;
}
