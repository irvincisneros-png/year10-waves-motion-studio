import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useProgressStore } from '../../store/progressStore';
import { nextLevelAfterSuccess } from '../../store/evidenceHelpers';

const FIELDS = [
  { key: 'claim' as const, label: 'Claim', hint: 'State why the ray bends at an air–water boundary without saying light “chooses” a path.' },
  { key: 'evidence' as const, label: 'Evidence', hint: 'Use the frequency, speed, wavelength and angle readouts from your refraction trials.' },
  { key: 'reasoning' as const, label: 'Reasoning', hint: 'Connect a stationary-boundary speed change to wavelength change and wavefront turning.' },
];

export default function LightExplainPage() {
  const [values, setValues] = useState({ claim: '', evidence: '', reasoning: '' });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const { announce } = useAnnouncer();
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);

  const save = () => {
    const missing = FIELDS.find((field) => values[field.key].trim() === '');
    if (missing) { setError(`${missing.label} is missing — fill it in before submitting.`); setSaved(false); announce(`${missing.label} is missing.`); return; }
    addEvidence({ outcomeCode: '7.3.2', kind: 'explanation', summary: `CER — refraction by speed change: CLAIM: ${values.claim.trim()} | EVIDENCE: ${values.evidence.trim()} | REASONING: ${values.reasoning.trim()}` });
    setOutcomeLevel('7.3.2', nextLevelAfterSuccess(outcomes['7.3.2'] ?? 'not-attempted'));
    setError(null); setSaved(true); announce('Light explanation saved as evidence.');
  };

  return <Page title="Explain refraction with evidence" lead="Build a claim–evidence–reasoning explanation that replaces the “shortest path” misconception with the boundary model."><div className="card stack" data-control-id="optics.cer-editor"><p>Explain why a ray bends towards the normal when it enters water from air. In this Year 10 model, the source frequency stays fixed while speed and wavelength decrease together.</p>{FIELDS.map((field) => <label key={field.key} className="notice-capture__label">{field.label}<span className="seg-control__note">{field.hint}</span><textarea className="notice-capture__input" rows={3} value={values[field.key]} onChange={(event) => { setValues((current) => ({ ...current, [field.key]: event.target.value })); setSaved(false); }} data-testid={`light-cer-${field.key}`} data-control-id={`optics.cer-${field.key}-input`} /></label>)}<button type="button" className="btn btn--primary" onClick={save} data-testid="light-cer-save" data-control-id="optics.cer-save-button">Save explanation as evidence</button>{error ? <p className="field__error" role="status">{error}</p> : null}{saved ? <p className="notice-capture__status" role="status">✓ Saved for outcome 7.3.2. Export it from the <Link to="/progress">Progress page</Link>.</p> : null}</div></Page>;
}
