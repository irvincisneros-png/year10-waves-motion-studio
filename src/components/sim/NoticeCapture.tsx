import { useState } from 'react';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useProgressStore } from '../../store/progressStore';
import { nextLevelAfterSuccess } from '../../store/evidenceHelpers';
import './NoticeCapture.css';

/**
 * "What do you notice?" capture. A non-empty observation is saved to the
 * progress store as evidence against the activity's outcome and nudges that
 * outcome's level forward. Empty submissions are rejected with a message —
 * never silently saved.
 */
export interface NoticeCaptureProps {
  /** Stable control id for the inventory. */
  controlId: string;
  outcomeCode: string;
  /** Unique accessible name for this route. */
  label: string;
  /** Evidence summary prefix, e.g. "Medium vs vacuum observation". */
  evidenceKind: string;
  testId?: string;
}

export function NoticeCapture({ controlId, outcomeCode, label, evidenceKind, testId }: NoticeCaptureProps) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'saved' | 'empty'>('idle');
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);
  const { announce } = useAnnouncer();

  const save = () => {
    if (text.trim().length === 0) {
      setStatus('empty');
      announce('Write what you noticed before saving.');
      return;
    }
    addEvidence({
      outcomeCode,
      kind: 'exploration',
      summary: `${evidenceKind}: ${text.trim()}`,
    });
    const current = outcomes[outcomeCode] ?? 'not-attempted';
    setOutcomeLevel(outcomeCode, nextLevelAfterSuccess(current));
    setStatus('saved');
    announce('Observation saved as evidence.');
  };

  return (
    <div className="notice-capture" data-control-id={controlId}>
      <label className="notice-capture__label">
        {label}
        <textarea
          className="notice-capture__input"
          rows={3}
          value={text}
          data-testid={testId}
          onChange={(e) => {
            setText(e.target.value);
            if (status !== 'idle') setStatus('idle');
          }}
        />
      </label>
      <div className="notice-capture__row">
        <button type="button" className="btn" onClick={save} data-testid={testId ? `${testId}-save` : undefined}>
          Save observation as evidence
        </button>
        {status === 'saved' ? (
          <p className="notice-capture__status" role="status">
            <span aria-hidden="true">✓</span> Saved to your progress evidence
            (outcome {outcomeCode}).
          </p>
        ) : null}
        {status === 'empty' ? (
          <p className="notice-capture__status notice-capture__status--warn" role="status">
            Write what you noticed before saving.
          </p>
        ) : null}
      </div>
    </div>
  );
}
