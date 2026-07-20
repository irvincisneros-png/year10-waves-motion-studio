import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useProgressStore } from '../../store/progressStore';
import { nextLevelAfterSuccess } from '../../store/evidenceHelpers';

const FIELDS = [
  {
    key: 'claim' as const,
    label: 'Claim',
    hint: 'State why an approaching siren is detected at a higher pitch even though the siren keeps emitting the same frequency.',
  },
  {
    key: 'evidence' as const,
    label: 'Evidence',
    hint: 'Use the wavefront spacing, source-frequency readout, and detected-frequency graph from the Doppler model.',
  },
  {
    key: 'reasoning' as const,
    label: 'Reasoning',
    hint: 'Connect the bunched wavefronts to shorter arrival intervals and therefore a higher detected frequency.',
  },
];

/** Stage 3 Explain phase: saved CER evidence for the Doppler misconception. */
export default function SoundExplainPage() {
  const [values, setValues] = useState({ claim: '', evidence: '', reasoning: '' });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const { announce } = useAnnouncer();
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);

  const submit = () => {
    const missing = FIELDS.find((field) => values[field.key].trim().length === 0);
    if (missing) {
      setError(`${missing.label} is missing — fill it in before submitting.`);
      setSaved(false);
      announce(`${missing.label} is missing.`);
      return;
    }

    setError(null);
    addEvidence({
      outcomeCode: '7.2.3',
      kind: 'explanation',
      summary: `CER — Doppler arrival timing: CLAIM: ${values.claim.trim()} | EVIDENCE: ${values.evidence.trim()} | REASONING: ${values.reasoning.trim()}`,
    });
    setOutcomeLevel(
      '7.2.3',
      nextLevelAfterSuccess(outcomes['7.2.3'] ?? 'not-attempted'),
    );
    setSaved(true);
    announce('Explanation saved as evidence.');
  };

  return (
    <Page
      title="Explain"
      lead="Use claim–evidence–reasoning to explain the Doppler shift without changing the source frequency."
    >
      <div className="card stack" data-control-id="sound-lab.cer-editor">
        <p>
          An ambulance approaches, passes, then recedes. Its siren mechanism emits the same note,
          but a stationary listener detects a higher pitch before it passes and a lower pitch
          afterwards. Explain the change using wavefront arrival timing.
        </p>
        {FIELDS.map((field) => (
          <label key={field.key} className="notice-capture__label">
            {field.label}
            <span className="seg-control__note">{field.hint}</span>
            <textarea
              className="notice-capture__input"
              rows={3}
              value={values[field.key]}
              onChange={(event) => {
                setValues((current) => ({ ...current, [field.key]: event.target.value }));
                setSaved(false);
              }}
              data-testid={`sound-cer-${field.key}`}
            />
          </label>
        ))}
        <div className="seg-control__options">
          <button type="button" className="btn btn--primary" onClick={submit} data-testid="sound-cer-submit">
            Save my explanation as evidence
          </button>
        </div>
        {error ? (
          <p className="field__error" role="status" data-testid="sound-cer-error">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="notice-capture__status" role="status" data-testid="sound-cer-saved">
            <span aria-hidden="true">✓</span> Saved to your evidence (outcome 7.2.3). Export it
            from the <Link to="/progress">Progress page</Link>.
          </p>
        ) : null}
      </div>
    </Page>
  );
}
