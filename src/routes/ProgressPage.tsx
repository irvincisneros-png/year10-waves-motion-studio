import { useRef, useState } from 'react';
import { Page } from '../components/Page';
import { outcomeMap } from '../content/outcomes';
import { ACTIVE_OUTCOME_CODES } from '../content/releaseRegistry';
import { useProgressStore } from '../store/progressStore';
import { IMPORT_MAX_BYTES, type OutcomeLevel } from '../store/progressData';
import './ProgressPage.css';

const LEVEL_DISPLAY: Record<OutcomeLevel, { icon: string; label: string; className: string }> = {
  'not-attempted': { icon: '○', label: 'Not attempted', className: 'level--none' },
  developing: { icon: '◐', label: 'Developing', className: 'level--developing' },
  secure: { icon: '●', label: 'Secure', className: 'level--secure' },
};

const STRAND_LABELS: Record<string, string> = {
  waves: 'Waves',
  sound: 'Sound',
  light: 'Light',
  motion: 'Motion',
  forces: 'Forces',
  society: 'Society',
};

type Feedback = { kind: 'success' | 'error'; text: string } | null;

/**
 * Progress overview: evidence level per syllabus outcome, plus export /
 * sanitised import / reset-all controls. Evidence is recorded by the
 * laboratories from Stage 2 onwards; the store and controls are fully
 * functional now.
 */
export default function ProgressPage() {
  const outcomes = useProgressStore((s) => s.outcomes);
  const evidence = useProgressStore((s) => s.evidence);
  const exportJSON = useProgressStore((s) => s.exportJSON);
  const exportAnonymousJSON = useProgressStore((s) => s.exportAnonymousJSON);
  const exportAnonymousCSV = useProgressStore((s) => s.exportAnonymousCSV);
  const importJSON = useProgressStore((s) => s.importJSON);
  const resetAll = useProgressStore((s) => s.resetAll);

  const [feedback, setFeedback] = useState<Feedback>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadText = (content: string, type: string, filename: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setFeedback({ kind: 'success', text: `Exported ${filename}.` });
  };

  const handleImportFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > IMPORT_MAX_BYTES) {
      setFeedback({
        kind: 'error',
        text: `Import rejected: the file is larger than ${Math.round(IMPORT_MAX_BYTES / 1024)} KB.`,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = importJSON(String(reader.result ?? ''));
      setFeedback(
        result.ok
          ? { kind: 'success', text: 'Progress imported successfully.' }
          : { kind: 'error', text: `Import rejected: ${result.error}` },
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      setFeedback({ kind: 'error', text: 'Import rejected: the file could not be read.' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleResetAll = () => {
    const confirmed = window.confirm(
      'Reset ALL progress and evidence on this device? This cannot be undone.',
    );
    if (confirmed) {
      resetAll();
      setFeedback({ kind: 'success', text: 'All progress has been reset.' });
    }
  };

  const codes = ACTIVE_OUTCOME_CODES;
  const attempted = codes.filter((c) => (outcomes[c] ?? 'not-attempted') !== 'not-attempted');

  return (
    <Page
      title="Progress"
      lead="Your evidence level for each syllabus outcome. Evidence is collected as you work through the laboratories; everything stays on this device."
    >
      <div className="progress-actions">
        <button type="button" className="btn btn--primary" onClick={() => downloadText(exportAnonymousJSON(), 'application/json', 'wavemotion-anonymous-summary.json')}>
          Export anonymous summary (JSON)
        </button>
        <button type="button" className="btn" onClick={() => downloadText(exportAnonymousCSV(), 'text/csv', 'wavemotion-anonymous-summary.csv')}>
          Export anonymous summary (CSV)
        </button>
        <button type="button" className="btn" onClick={() => window.print()}>
          Print anonymous summary
        </button>
        <button type="button" className="btn" onClick={() => downloadText(exportJSON(), 'application/json', 'wavemotion-local-backup.json')}>
          Export local backup (includes written evidence)
        </button>
        <label className="btn progress-actions__import">
          Import progress…
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="u-visually-hidden"
            aria-label="Import progress from a JSON file"
            data-testid="import-input"
            onChange={(e) => handleImportFile(e.target.files?.[0])}
          />
        </label>
        <button type="button" className="btn btn--danger" onClick={handleResetAll}>
          Reset all progress
        </button>
      </div>

      <div aria-live="polite" className="progress-feedback">
        {feedback ? (
          <p
            className={`notice ${feedback.kind === 'error' ? 'notice--warn' : ''}`}
            data-testid="progress-feedback"
          >
            {feedback.text}
          </p>
        ) : null}
      </div>

      <p className="progress-summary">
        {attempted.length} of {codes.length} outcomes attempted ·{' '}
        {evidence.length} evidence {evidence.length === 1 ? 'entry' : 'entries'}{' '}
        recorded
      </p>

      <p className="notice">
        Anonymous summaries contain only outcome levels and evidence counts—no
        written responses, names, IDs or timestamps. The local backup is for
        transfer between your own devices and may contain student-written text.
      </p>

      <div className="progress-table-wrap">
        <table className="progress-table">
          <caption className="u-visually-hidden">
            Evidence level for each Waves and Motion syllabus outcome
          </caption>
          <thead>
            <tr>
              <th scope="col">Outcome</th>
              <th scope="col">Strand</th>
              <th scope="col">Description</th>
              <th scope="col">Level</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((code) => {
              const outcome = outcomeMap[code];
              const level = outcomes[code] ?? 'not-attempted';
              const display = LEVEL_DISPLAY[level];
              return (
                <tr key={code}>
                  <th scope="row">{code}</th>
                  <td>{STRAND_LABELS[outcome.strand]}</td>
                  <td className="progress-table__desc">{outcome.text}</td>
                  <td>
                    <span className={`level ${display.className}`}>
                      <span aria-hidden="true">{display.icon}</span>{' '}
                      {display.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </Page>
  );
}
