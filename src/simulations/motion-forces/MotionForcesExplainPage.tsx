import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useProgressStore } from '../../store/progressStore';
import { nextLevelAfterSuccess } from '../../store/evidenceHelpers';

const FIELD_LABELS = ['Claim', 'Evidence', 'Reasoning', 'Limitation and improvement'] as const;

export function MotionForcesExplainPage({ group }: { group: 'motion' | 'forces' }) {
  const [values, setValues] = useState(['', '', '', '']);
  const [status, setStatus] = useState<'idle' | 'error' | 'saved'>('idle');
  const { announce } = useAnnouncer();
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);
  const isMotion = group === 'motion';
  const outcomeCodes = isMotion ? ['7.4.1', '7.4.3'] : ['7.4.4', '7.4.7'];
  const prompt = isMotion
    ? 'Explain why a return trip can have nonzero average speed but zero average velocity, using a recorded track or graph result.'
    : 'Explain how your controlled cart evidence supports Fnet = ma and the inverse mass relationship.';
  const save = () => {
    const missing = values.findIndex((value) => value.trim() === '');
    if (missing >= 0) { setStatus('error'); announce(`${FIELD_LABELS[missing]} is missing.`); return; }
    for (const outcomeCode of outcomeCodes) {
      addEvidence({ outcomeCode, kind: 'explanation', summary: `${isMotion ? 'Motion comparison' : 'Cart CER'} — ${FIELD_LABELS.map((label, index) => `${label}: ${values[index].trim()}`).join(' | ')}` });
      setOutcomeLevel(outcomeCode, nextLevelAfterSuccess(outcomes[outcomeCode] ?? 'not-attempted'));
    }
    setStatus('saved'); announce(`${isMotion ? 'Motion' : 'Forces'} explanation saved as evidence.`);
  };
  return <Page title={`Explain ${isMotion ? 'motion from evidence' : 'force and acceleration from evidence'}`} lead="Write a complete claim–evidence–reasoning response and state one honest model limitation.">
    <div className="card stack" data-control-id={`${group}.cer-editor`}><p>{prompt}</p>{FIELD_LABELS.map((label, index) => <label key={label} className="notice-capture__label">{label}<textarea rows={3} className="notice-capture__input" value={values[index]} onChange={(event) => { setValues((current) => current.map((value, item) => item === index ? event.target.value : value)); setStatus('idle'); }} data-testid={`${group}-cer-${index}`} data-control-id={`${group}.cer-${index}-input`} /></label>)}<button type="button" className="btn btn--primary" onClick={save} data-testid={`${group}-cer-save`} data-control-id={`${group}.cer-save-button`}>Save explanation as evidence</button>{status === 'error' ? <p className="field__error" role="status">{FIELD_LABELS[values.findIndex((value) => value.trim() === '')]} is missing — complete every field before saving.</p> : null}{status === 'saved' ? <p className="notice-capture__status" role="status">✓ Saved locally. Review or export it on the <Link to="/progress">Progress page</Link>.</p> : null}</div>
  </Page>;
}
