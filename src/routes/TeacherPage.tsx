import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { masteryQuestionBank } from '../assessment/masteryQuestions';
import { Page } from '../components/Page';
import { outcomeMap, type Outcome } from '../content/outcomes';
import { ACTIVE_OUTCOME_CODES, DEFERRED_OUTCOME_CODES, OUTCOME_RELEASE_REGISTRY } from '../content/releaseRegistry';
import { IMPORT_MAX_BYTES } from '../store/progressData';
import { useProgressStore } from '../store/progressStore';
import { TEACHER_LAYERS, useSettingsStore, type TeacherLayer } from '../store/settingsStore';
import './TeacherPage.css';

const LAYER_LABELS: Record<TeacherLayer, string> = {
  labels: 'Tagged simulation-control labels',
  values: 'Tagged simulation-control values',
  equations: 'Tagged wave-equation panels',
  particles: 'Particle-bearing Canvas views',
  vectors: 'Tagged force-vector overlays',
  trails: 'Canvas motion and trail views',
  answers: 'Tagged mastery answer feedback',
};

const PRESETS = [
  { label: 'Mechanical wave measurement', path: '/waves/measure?preset=rope' },
  { label: 'Electromagnetic wave equation', path: '/waves/measure?preset=em' },
  { label: 'X-ray spectrum evidence', path: '/spectrum?region=xray' },
  { label: 'Visible-light stellar lines', path: '/astronomy?band=visible&star=sun-like' },
  { label: 'Mixed mastery session', path: '/mastery' },
] as const;

const SHEETS = {
  investigation: {
    title: 'Controlled investigation sheet',
    prompts: ['Aim and testable question', 'Independent, dependent and controlled variables', 'Method and safety considerations', 'Results table and graph', 'Pattern, conclusion, limitation and improvement'],
  },
  cer: {
    title: 'Claim–Evidence–Reasoning report',
    prompts: ['Claim that answers the question', 'Two relevant evidence points with sources', 'Reasoning that links evidence to science', 'Counterclaim or model limitation', 'Proportional conclusion'],
  },
  mastery: {
    title: 'Mastery reflection sheet',
    prompts: ['Outcome and question attempted', 'First answer and feedback received', 'Science misconception corrected', 'Reworked explanation or calculation', 'Next evidence point to attempt'],
  },
} as const;

type SheetKey = keyof typeof SHEETS;
type Strand = Outcome['strand'];

function downloadText(content: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function TeacherPage() {
  const presentationMode = useSettingsStore((state) => state.presentationMode);
  const setPresentationMode = useSettingsStore((state) => state.setPresentationMode);
  const layerVisibility = useSettingsStore((state) => state.layerVisibility);
  const setLayerVisibility = useSettingsStore((state) => state.setLayerVisibility);
  const exportAnonymousJSON = useProgressStore((state) => state.exportAnonymousJSON);
  const exportJSON = useProgressStore((state) => state.exportJSON);
  const importJSON = useProgressStore((state) => state.importJSON);
  const resetModule = useProgressStore((state) => state.resetModule);
  const resetAll = useProgressStore((state) => state.resetAll);
  const [presetPath, setPresetPath] = useState<string>(PRESETS[0].path);
  const [coverageFilter, setCoverageFilter] = useState('all');
  const [sheetKey, setSheetKey] = useState<SheetKey>('investigation');
  const [module, setModule] = useState<Strand>('waves');
  const [feedback, setFeedback] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const sheet = SHEETS[sheetKey];
  const deepLink = `${window.location.href.split('#')[0]}#${presetPath}`;
  const coverageRows = OUTCOME_RELEASE_REGISTRY.filter((entry) =>
    coverageFilter === 'all'
    || entry.status === coverageFilter
    || entry.verificationStatus === coverageFilter
    || outcomeMap[entry.code].strand === coverageFilter,
  );
  const misconceptionPrompts = useMemo(() => {
    const seen = new Set<string>();
    return masteryQuestionBank.filter((question) => {
      if (question.misconception.startsWith('none') || seen.has(question.misconception)) return false;
      seen.add(question.misconception);
      return true;
    }).slice(0, 12);
  }, []);

  const handleImport = (file: File | undefined) => {
    if (!file) return;
    if (file.size > IMPORT_MAX_BYTES) {
      setFeedback('Import rejected: file exceeds 1 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = importJSON(String(reader.result ?? ''));
      setFeedback(result.ok ? 'Progress backup imported.' : `Import rejected: ${result.error}`);
      if (inputRef.current) inputRef.current.value = '';
    };
    reader.onerror = () => setFeedback('Import rejected: the file could not be read.');
    reader.readAsText(file);
  };

  return (
    <Page title="Teacher tools" lead="Projection, lesson-link, coverage, print and local progress tools. No account is needed and no student data leaves the device.">
      <section className="card stack" aria-labelledby="teacher-presentation">
        <h2 id="teacher-presentation">Presentation mode and tagged overlays</h2>
        <label className="toggle"><input type="checkbox" checked={presentationMode} onChange={(event) => setPresentationMode(event.target.checked)} data-testid="toggle-presentation" /><span className="toggle__text"><span className="toggle__label">Presentation mode</span><span className="toggle__hint">Enlarges the base text; tagged equation panels also use their projection size.</span></span></label>
        <p>Overlay switches affect only elements explicitly tagged for that layer. Canvas layers hide the visual scene while its text/table alternative remains available.</p>
        <fieldset className="teacher-layer-grid"><legend>Show or hide tagged overlays</legend>{TEACHER_LAYERS.map((layer) => <label className="toggle" key={layer}><input type="checkbox" checked={layerVisibility[layer]} onChange={(event) => setLayerVisibility(layer, event.target.checked)} data-testid={`teacher-layer-${layer}`} data-control-id={`teacher.show-hide-${layer}-toggle`} /><span className="toggle__text"><span className="toggle__label">{LAYER_LABELS[layer]}</span></span></label>)}</fieldset>
        <div className="teacher-preview" aria-label="Display layer preview"><span data-teacher-layer="labels">Label: wave crest</span><output data-teacher-layer="values">2.0 Hz</output><strong data-teacher-layer="equations">v = fλ</strong><span data-teacher-layer="particles">● ● ●</span><span data-teacher-layer="vectors">→ force</span><span data-teacher-layer="trails">···· trail</span><span data-teacher-layer="answers">✓ answer feedback</span></div>
      </section>

      <section className="card stack" aria-labelledby="teacher-links">
        <h2 id="teacher-links">Student-data-free lesson links</h2>
        <p>Only reviewed routes and preset parameters can be generated; links never include progress or written responses.</p>
        <label>Lesson preset<select value={presetPath} onChange={(event) => setPresetPath(event.target.value)} data-testid="teacher-preset-select" data-control-id="teacher.deep-link-generator">{PRESETS.map((preset) => <option key={preset.path} value={preset.path}>{preset.label}</option>)}</select></label>
        <label>Generated deep link<input readOnly value={deepLink} data-testid="teacher-deep-link" /></label>
        <Link className="btn btn--primary teacher-inline-link" to={presetPath}>Open preset</Link>
      </section>

      <section className="card stack" aria-labelledby="teacher-coverage">
        <h2 id="teacher-coverage">Outcome coverage</h2>
        <p>Release scope and verification are separate: “active” means shipped, while “verified (builder)” still awaits independent review.</p>
        <label>Filter coverage<select value={coverageFilter} onChange={(event) => setCoverageFilter(event.target.value)} data-control-id="teacher.outcome-coverage-view"><option value="all">All outcomes</option><option value="active">Active release only</option><option value="deferred">Deferred only</option><option value="verified">Independently verified</option><option value="verified (builder)">Builder-verified</option><option value="waves">Waves</option><option value="sound">Sound</option><option value="light">Light</option><option value="motion">Motion</option><option value="forces">Forces</option><option value="society">Society</option></select></label>
        <div className="teacher-table-wrap" tabIndex={0} role="region" aria-label="Outcome coverage table">
          <table>
            <thead><tr><th>Outcome</th><th>Release scope</th><th>Verification</th><th>Activity</th><th>Implementation routes</th></tr></thead>
            <tbody>{coverageRows.map((entry) => (
              <tr key={entry.code}>
                <th>{entry.code}</th>
                <td>{entry.status}</td>
                <td>{entry.verificationStatus}</td>
                <td>{entry.activity}</td>
                <td>{entry.routes.length > 0 ? entry.routes.map((route, index) => <span key={route}>{index > 0 ? ', ' : ''}<Link to={route}>{route}</Link></span>) : 'Not shipped'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p>{ACTIVE_OUTCOME_CODES.length} active outcomes; {DEFERRED_OUTCOME_CODES.length} explicitly deferred.</p>
      </section>

      <section className="card stack" aria-labelledby="teacher-prompts" data-control-id="teacher.misconception-prompts-panel">
        <h2 id="teacher-prompts">Misconception prompts and suggested questions</h2>
        {misconceptionPrompts.map((question) => <details key={question.id}><summary>{question.outcomeCode}: {question.misconception}</summary><p><strong>Ask:</strong> {question.prompt}</p><p><strong>Listen for:</strong> {question.explanation}</p></details>)}
      </section>

      <section className="card stack teacher-print-tools" aria-labelledby="teacher-print">
        <h2 id="teacher-print">Printable learning sheets</h2>
        <label>Sheet template<select value={sheetKey} onChange={(event) => setSheetKey(event.target.value as SheetKey)} data-testid="teacher-sheet-select" data-control-id="teacher.printable-sheet-generator"><option value="investigation">Controlled investigation</option><option value="cer">Claim–Evidence–Reasoning</option><option value="mastery">Mastery reflection</option></select></label>
        <button type="button" className="btn" onClick={() => window.print()}>Print selected sheet</button>
        <article className="teacher-sheet" data-testid="teacher-print-sheet"><h3>{sheet.title}</h3><p>Name: ____________________ Date: __________ Outcome: __________</p>{sheet.prompts.map((prompt, index) => <section key={prompt}><h4>{index + 1}. {prompt}</h4><div className="teacher-writing-lines" aria-hidden="true" /></section>)}</article>
      </section>

      <section className="card stack teacher-progress-tools" aria-labelledby="teacher-progress">
        <h2 id="teacher-progress">Local progress management</h2>
        <p>Anonymous summaries omit written text, IDs and timestamps. Local backups can contain student writing. The <Link to="/progress">Progress page</Link> provides the complete per-outcome view.</p>
        <div className="button-row"><button type="button" className="btn" data-control-id="teacher.progress-export-button" onClick={() => downloadText(exportAnonymousJSON(), 'wavemotion-anonymous-summary.json')}>Export anonymous summary</button><button type="button" className="btn" onClick={() => downloadText(exportJSON(), 'wavemotion-local-backup.json')}>Export local backup</button><label className="btn">Import local backup<input ref={inputRef} type="file" accept="application/json,.json" className="u-visually-hidden" aria-label="Import local progress backup" data-control-id="teacher.progress-import-button" onChange={(event) => handleImport(event.target.files?.[0])} /></label></div>
        <div className="teacher-reset-row"><label>Module to reset<select value={module} onChange={(event) => setModule(event.target.value as Strand)}>{['waves', 'sound', 'light', 'motion', 'forces', 'society'].map((strand) => <option key={strand}>{strand}</option>)}</select></label><button type="button" className="btn btn--danger" data-control-id="teacher.reset-module-button" onClick={() => { if (window.confirm(`Reset all ${module} evidence on this device?`)) { resetModule(module); setFeedback(`${module} evidence reset.`); } }}>Reset selected module</button><button type="button" className="btn btn--danger" data-control-id="teacher.reset-all-button" onClick={() => { if (window.confirm('Reset ALL progress and evidence on this device? This cannot be undone.')) { resetAll(); setFeedback('All progress reset.'); } }}>Reset all progress</button></div>
        <p role="status">{feedback}</p>
      </section>
    </Page>
  );
}
