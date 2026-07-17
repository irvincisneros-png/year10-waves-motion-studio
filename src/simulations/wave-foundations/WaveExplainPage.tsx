import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useProgressStore } from '../../store/progressStore';
import { nextLevelAfterSuccess } from '../../store/evidenceHelpers';

/**
 * Explain phase: claim–evidence–reasoning scaffold. Submitting requires all
 * three parts; a missing part is identified BY NAME (never a generic "form
 * incomplete"). The completed argument is saved to the progress store as
 * evidence for outcome 7.1.1 and is exportable from the Progress page.
 */

const FIELDS = [
  {
    key: 'claim' as const,
    label: 'Claim',
    hint: 'One sentence answering: why can we see the Sun from Earth but not hear it?',
  },
  {
    key: 'evidence' as const,
    label: 'Evidence',
    hint: 'What did the medium/vacuum chambers and the energy tracker show you? Quote what you observed.',
  },
  {
    key: 'reasoning' as const,
    label: 'Reasoning',
    hint: 'Connect the evidence to the science: what do mechanical waves need that electromagnetic waves do not?',
  },
];

export default function WaveExplainPage() {
  const [values, setValues] = useState({ claim: '', evidence: '', reasoning: '' });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { announce } = useAnnouncer();
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);

  const submit = () => {
    const missing = FIELDS.find((f) => values[f.key].trim().length === 0);
    if (missing) {
      setError(`${missing.label} is missing — fill it in before submitting.`);
      setSaved(false);
      announce(`${missing.label} is missing.`);
      return;
    }
    setError(null);
    addEvidence({
      outcomeCode: '7.1.1',
      kind: 'explanation',
      summary: `CER — sound in a vacuum: CLAIM: ${values.claim.trim()} | EVIDENCE: ${values.evidence.trim()} | REASONING: ${values.reasoning.trim()}`,
    });
    const current = outcomes['7.1.1'] ?? 'not-attempted';
    setOutcomeLevel('7.1.1', nextLevelAfterSuccess(current));
    setSaved(true);
    announce('Explanation saved as evidence.');
  };

  return (
    <Page
      title="Explain"
      lead="Build a claim–evidence–reasoning argument: why does sound fail in a vacuum while light crosses it easily?"
    >
      <div className="card stack" data-control-id="wave-lab.cer-editor">
        <p>
          Astronauts on the Moon could see Earth but could not shout to each
          other through space — they needed radios. Use what you observed in the
          Explore activities to explain why.
        </p>
        {FIELDS.map((f) => (
          <label key={f.key} className="notice-capture__label">
            {f.label}
            <span className="seg-control__note">{f.hint}</span>
            <textarea
              className="notice-capture__input"
              rows={3}
              value={values[f.key]}
              onChange={(e) => {
                setValues((v) => ({ ...v, [f.key]: e.target.value }));
                setSaved(false);
              }}
              data-testid={`cer-${f.key}`}
            />
          </label>
        ))}
        <div className="seg-control__options">
          <button type="button" className="btn btn--primary" onClick={submit} data-testid="cer-submit">
            Save my explanation as evidence
          </button>
        </div>
        {error ? (
          <p className="field__error" role="status" data-testid="cer-error">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="notice-capture__status" role="status" data-testid="cer-saved">
            <span aria-hidden="true">✓</span> Saved to your evidence (outcome
            7.1.1). Export it any time from the{' '}
            <Link to="/progress">Progress page</Link>.
          </p>
        ) : null}
      </div>
    </Page>
  );
}
