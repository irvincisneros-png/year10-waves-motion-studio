import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Page } from '../../components/Page';
import { CanvasScene } from '../../components/sim/CanvasScene';
import { SimControl } from '../../components/sim/SimControl';
import { useSimClock } from '../../components/sim/useSimClock';
import { LineGraph } from '../../components/graphs/LineGraph';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useSettingsStore } from '../../store/settingsStore';
import { displacement, wavelengthOf, type WaveParams } from '../../science/waves';
import { MEASUREMENT_PRESETS, measurementPresetById } from '../../science/constants';
import { formatSigFigs } from '../../science/units';
import { RulerTool, RULER_DEFAULT, type RulerState } from './RulerTool';
import { LambdaCalculator } from './LambdaCalculator';

type Series = 'frequency' | 'amplitude';
type InvestigationStage = 'predict' | 'investigate' | 'explain' | 'submit';

interface PracticalTrial {
  id: string;
  series: Series;
  frequencyHz: number;
  amplitudePct: number;
  measuredWavelengthM: number;
  calculatedSpeedMps: number;
  errorPct: number;
}

interface Answers {
  relationship: string;
  speed: string;
  amplitude: string;
  limitation: string;
}

interface Draft {
  name: string;
  className: string;
  hypothesis: string;
  answers: Answers;
  trials: PracticalTrial[];
  presetId: string;
}

const FREQ_STEP: Record<string, number> = { rope: 0.05, water: 0.1, sound: 5, em: 2.5e6 };
const DRAFT_KEY = 'wavemotion.wave-practical.v2';
const FREQUENCY_AMPLITUDE = 60;
const AMPLITUDE_FREQUENCY_MULTIPLIER = 1;
const MEASUREMENT_TOLERANCE_PCT = 8;
const EMPTY_ANSWERS: Answers = { relationship: '', speed: '', amplitude: '', limitation: '' };

function includesAll(text: string, groups: string[][]) {
  const normal = text.toLowerCase();
  return groups.every((group) => group.some((word) => normal.includes(word)));
}

function answerChecks(answers: Answers) {
  return {
    relationship:
      answers.relationship.trim().length >= 35 &&
      includesAll(answers.relationship, [['frequency', ' f '], ['wavelength', 'lambda', 'λ'], ['decrease', 'shorter', 'inverse', 'halves']]),
    speed:
      answers.speed.trim().length >= 35 &&
      includesAll(answers.speed, [['speed'], ['same', 'similar', 'constant'], ['medium', 'rope']]),
    amplitude:
      answers.amplitude.trim().length >= 30 &&
      includesAll(answers.amplitude, [['amplitude'], ['speed'], ['same', 'unchanged', 'constant', 'does not']]),
    limitation: answers.limitation.trim().length >= 30,
  };
}

export default function MeasurementLabPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPreset = searchParams.get('preset') ?? 'rope';
  const initialPreset = measurementPresetById(requestedPreset) ?? MEASUREMENT_PRESETS[0];
  const [presetId, setPresetId] = useState(initialPreset.id);
  const preset = measurementPresetById(presetId) ?? MEASUREMENT_PRESETS[0];
  const [frequency, setFrequency] = useState(preset.defaultFreqHz);
  const [amplitudePct, setAmplitudePct] = useState(FREQUENCY_AMPLITUDE);
  const [series, setSeries] = useState<Series>('frequency');
  const [ruler, setRuler] = useState<RulerState>(RULER_DEFAULT);
  const [trials, setTrials] = useState<PracticalTrial[]>([]);
  const [feedback, setFeedback] = useState('Measure one wavelength from crest to crest, then record the trial.');
  const [running, setRunning] = useState(true);
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [checked, setChecked] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [calcResetKey, setCalcResetKey] = useState(0);
  const [stage, setStage] = useState<InvestigationStage>('predict');

  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const lowGraphics = useSettingsStore((s) => s.lowGraphics);
  const { announce } = useAnnouncer();
  const clock = useSimClock({ running, speed: 1, reducedMotion, active: true });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Partial<Draft>;
        if (typeof draft.name === 'string') setName(draft.name);
        if (typeof draft.className === 'string') setClassName(draft.className);
        if (typeof draft.hypothesis === 'string') setHypothesis(draft.hypothesis);
        if (draft.answers) setAnswers({ ...EMPTY_ANSWERS, ...draft.answers });
        if (Array.isArray(draft.trials)) setTrials(draft.trials);
        if (draft.presetId && measurementPresetById(draft.presetId)) {
          setPresetId(draft.presetId);
          const restored = measurementPresetById(draft.presetId)!;
          setFrequency(restored.defaultFreqHz);
        }
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    const draft: Draft = { name, className, hypothesis, answers, trials, presetId: preset.id };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [name, className, hypothesis, answers, trials, preset.id, draftReady]);

  const effectiveFrequency =
    series === 'amplitude' ? preset.defaultFreqHz * AMPLITUDE_FREQUENCY_MULTIPLIER : frequency;
  const effectiveAmplitude = series === 'frequency' ? FREQUENCY_AMPLITUDE : amplitudePct;
  const wave: WaveParams = useMemo(
    () => ({ amplitude: effectiveAmplitude / 100, frequency: effectiveFrequency, speed: preset.speedMps }),
    [effectiveAmplitude, effectiveFrequency, preset.speedMps],
  );
  const lambda = wavelengthOf(wave);
  const chamberLen = 4 * (preset.speedMps / preset.defaultFreqHz);
  const spanM = ((ruler.endPct - ruler.startPct) / 100) * chamberLen;
  const frequencyTrials = trials.filter((trial) => trial.series === 'frequency');
  const amplitudeTrials = trials.filter((trial) => trial.series === 'amplitude');
  const checks = answerChecks(answers);
  const reportReady =
    name.trim().length >= 2 &&
    hypothesis.trim().length >= 20 &&
    frequencyTrials.length >= 3 &&
    amplitudeTrials.length >= 2 &&
    Object.values(checks).every(Boolean);
  const evidenceReady = frequencyTrials.length >= 3 && amplitudeTrials.length >= 2;
  const explanationReady = Object.values(checks).every(Boolean);

  const goToStage = (next: InvestigationStage) => {
    setStage(next);
    window.requestAnimationFrame(() => {
      document.getElementById(`investigation-stage-${next}`)?.focus();
    });
  };

  const choosePreset = (id: string) => {
    if (trials.length > 0) return;
    const next = measurementPresetById(id) ?? MEASUREMENT_PRESETS[0];
    setPresetId(next.id);
    setSearchParams(next.id === 'rope' ? {} : { preset: next.id }, { replace: true });
    setFrequency(next.defaultFreqHz);
    setRuler(RULER_DEFAULT);
    setFeedback(`Medium set to ${next.label}. It will lock after your first valid trial.`);
  };

  const changeFrequency = (value: number) => {
    setFrequency(value);
    setRuler(RULER_DEFAULT);
    setFeedback('Frequency changed. Re-measure one wavelength before recording.');
  };

  const switchSeries = (next: Series) => {
    setSeries(next);
    setRuler(RULER_DEFAULT);
    setChecked(false);
    setFeedback(
      next === 'frequency'
        ? `Part A: amplitude is held at ${FREQUENCY_AMPLITUDE}%. Change frequency only.`
        : `Part B: frequency is held at ${formatSigFigs(preset.defaultFreqHz)} Hz. Change amplitude only.`,
    );
  };

  const placeRuler = () => {
    const wavelengthPct = (lambda / chamberLen) * 100;
    setRuler({ startPct: 0, endPct: Math.min(100, wavelengthPct) });
    setFeedback('Ruler placed from one crest to the next. Check the wave, then record the reading.');
    announce('Ruler placed crest to crest.');
  };

  const recordTrial = () => {
    if (spanM <= 0) {
      setFeedback('No wavelength recorded. Place the ruler from one crest to the next first.');
      return;
    }
    const errorPct = Math.abs((spanM - lambda) / lambda) * 100;
    if (errorPct > MEASUREMENT_TOLERANCE_PCT) {
      setFeedback(`That span is ${formatSigFigs(errorPct)}% from one wavelength. Reposition the ruler crest to crest (within ${MEASUREMENT_TOLERANCE_PCT}%).`);
      return;
    }
    const duplicate = trials.some((trial) =>
      trial.series === series &&
      (series === 'frequency'
        ? Math.abs(trial.frequencyHz - effectiveFrequency) < 1e-9
        : trial.amplitudePct === effectiveAmplitude),
    );
    if (duplicate) {
      setFeedback(`You already recorded this ${series}. Choose a different value for a controlled series.`);
      return;
    }
    const trial: PracticalTrial = {
      id: crypto.randomUUID(),
      series,
      frequencyHz: effectiveFrequency,
      amplitudePct: effectiveAmplitude,
      measuredWavelengthM: spanM,
      calculatedSpeedMps: effectiveFrequency * spanM,
      errorPct,
    };
    setTrials((current) => [...current, trial]);
    setFeedback(`Valid ${series} trial recorded. Calculated speed: ${formatSigFigs(trial.calculatedSpeedMps)} m/s.`);
    setRuler(RULER_DEFAULT);
    announce('Valid controlled trial recorded.');
  };

  const reset = () => {
    if (!window.confirm('Clear the whole practical, including name, results and answers?')) return;
    localStorage.removeItem(DRAFT_KEY);
    setPresetId(initialPreset.id);
    setFrequency(initialPreset.defaultFreqHz);
    setAmplitudePct(FREQUENCY_AMPLITUDE);
    setSeries('frequency');
    setRunning(true);
    setRuler(RULER_DEFAULT);
    setTrials([]);
    setName('');
    setClassName('');
    setHypothesis('');
    setAnswers(EMPTY_ANSWERS);
    setChecked(false);
    setCalcResetKey((key) => key + 1);
    setStage('predict');
    setFeedback('Practical cleared. Begin with your hypothesis.');
    clock.reset();
  };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const mid = height / 2;
      const px = (x: number) => (x / chamberLen) * (width - 24) + 12;
      const displacementPx = (value: number) => -value * height * 0.36;
      ctx.strokeStyle = '#8ea1aa';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(12, mid);
      ctx.lineTo(width - 12, mid);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#056977';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let index = 0; index < 180; index += 1) {
        const x = (chamberLen * index) / 179;
        const y = mid + displacementPx(displacement(wave, x, clock.t));
        if (index === 0) ctx.moveTo(px(x), y);
        else ctx.lineTo(px(x), y);
      }
      ctx.stroke();
      const count = lowGraphics ? 16 : 32;
      ctx.fillStyle = '#056977';
      for (let index = 0; index < count; index += 1) {
        const x = (chamberLen * index) / (count - 1);
        ctx.beginPath();
        ctx.arc(px(x), mid + displacementPx(displacement(wave, x, clock.t)), 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (ruler.endPct > ruler.startPct) {
        const x1 = 12 + (ruler.startPct / 100) * (width - 24);
        const x2 = 12 + (ruler.endPct / 100) * (width - 24);
        ctx.strokeStyle = '#8a5a0e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, 16);
        ctx.lineTo(x2, 16);
        ctx.stroke();
        for (const x of [x1, x2]) {
          ctx.beginPath();
          ctx.moveTo(x, 8);
          ctx.lineTo(x, 24);
          ctx.stroke();
        }
      }
    },
    [chamberLen, clock.t, lowGraphics, ruler, wave],
  );

  const graphPoints = frequencyTrials.map((trial) => ({
    at: 1 / trial.frequencyHz,
    value: trial.measuredWavelengthM,
  }));
  const maxInverse = Math.max(...graphPoints.map((point) => point.at), 1 / preset.defaultFreqHz);
  const graphSeries = [
    {
      label: 'Expected λ = v × (1/f)',
      points: [
        { at: 0, value: 0 },
        { at: maxInverse * 1.05, value: preset.speedMps * maxInverse * 1.05 },
      ],
      mode: 'line' as const,
    },
    { label: 'Your valid trials', points: graphPoints, mode: 'scatter' as const },
  ];

  return (
    <Page
      title="Measurement lab"
      lead="Predict → investigate wave features (7.1.5) → use v = fλ (7.1.6) → submit one PDF. Work through the numbered steps from left to right."
    >
      <div className="wave-investigation">
        <div className="investigation-screen-only stack">
          <nav className="guided-stepper" aria-label="Investigation steps" data-control-id="wave-lab.guided-step-navigation">
            <button type="button" className={stage === 'predict' ? 'guided-step is-current' : 'guided-step'} aria-current={stage === 'predict' ? 'step' : undefined} onClick={() => goToStage('predict')}>
              <span className="guided-step__number">1</span><span><strong>Predict</strong><small>{hypothesis.trim().length >= 20 ? 'Done' : 'Write a hypothesis'}</small></span>
            </button>
            <button type="button" className={stage === 'investigate' ? 'guided-step is-current' : 'guided-step'} aria-current={stage === 'investigate' ? 'step' : undefined} onClick={() => goToStage('investigate')}>
              <span className="guided-step__number">2</span><span><strong>Investigate</strong><small>7.1.5 · A {frequencyTrials.length}/3 · B {amplitudeTrials.length}/2</small></span>
            </button>
            <button type="button" className={stage === 'explain' ? 'guided-step is-current' : 'guided-step'} aria-current={stage === 'explain' ? 'step' : undefined} onClick={() => goToStage('explain')}>
              <span className="guided-step__number">3</span><span><strong>Explain</strong><small>7.1.6 · {explanationReady ? 'Done' : 'Formula + evidence'}</small></span>
            </button>
            <button type="button" className={stage === 'submit' ? 'guided-step is-current' : 'guided-step'} aria-current={stage === 'submit' ? 'step' : undefined} onClick={() => goToStage('submit')}>
              <span className="guided-step__number">4</span><span><strong>Submit</strong><small>{reportReady ? 'Report ready' : 'Finish and print'}</small></span>
            </button>
          </nav>

          {stage === 'predict' ? (
            <section className="card stack guided-stage-card investigation-brief" aria-labelledby="investigation-stage-predict" data-testid="guided-stage-predict">
              <div className="guided-stage-heading">
                <div><p className="investigation-kicker">Step 1 of 4</p><h2 id="investigation-stage-predict" tabIndex={-1}>Predict before you test</h2></div>
                <span className="guided-time">About 2 minutes</span>
              </div>
              <div className="outcome-map" aria-label="Syllabus outcomes covered">
                <article><strong>7.1.5 · Investigate wave features</strong><p>Change amplitude and frequency, measure wavelength, and calculate speed. Four available models span mechanical, surface, longitudinal and electromagnetic waves; keep one model fixed during your fair test.</p></article>
                <article><strong>7.1.6 · Use the wave formula</strong><p>Use <span className="formula-inline">v = fλ</span> and <span className="formula-inline">λ = v/f</span> to explain how frequency, speed and wavelength are related.</p></article>
              </div>
              <p className="do-now"><strong>Do this now:</strong> write what you think will happen to wavelength when frequency increases, and whether amplitude will change wave speed in the same medium.</p>
              <label className="notice-capture__label">
                Your hypothesis
                <textarea rows={2} className="notice-capture__input" value={hypothesis} onChange={(event) => setHypothesis(event.target.value)} data-testid="wave-hypothesis" data-control-id="wave-lab.investigation-hypothesis" placeholder="I predict that when frequency increases… I predict that changing amplitude…" />
              </label>
              <p className="model-note"><strong>Virtual practical:</strong> no physical equipment hazard. The model is idealised; real waves may lose energy through damping.</p>
              <div className="guided-stage-actions" data-control-id="wave-lab.guided-step-actions">
                <span>{hypothesis.trim().length >= 20 ? '✓ Hypothesis saved.' : 'Write at least one complete prediction before continuing.'}</span>
                <button type="button" className="btn btn--primary" disabled={hypothesis.trim().length < 20} onClick={() => goToStage('investigate')}>Next: investigate waves</button>
              </div>
            </section>
          ) : null}

          {stage === 'investigate' ? (
          <section className="card stack guided-stage-card" aria-labelledby="investigation-stage-investigate" data-testid="guided-stage-investigate">
            <div className="investigation-section-heading">
              <div><p className="investigation-kicker">Step 2 of 4 · Outcome 7.1.5</p><h2 id="investigation-stage-investigate" tabIndex={-1}>Investigate wave features</h2></div>
              <div className="investigation-progress" aria-label="Practical progress">
                <span className={frequencyTrials.length >= 3 ? 'is-complete' : ''}>Part A {frequencyTrials.length}/3</span>
                <span className={amplitudeTrials.length >= 2 ? 'is-complete' : ''}>Part B {amplitudeTrials.length}/2</span>
              </div>
            </div>
            <p className="do-now"><strong>Do this now:</strong> {series === 'frequency' ? 'change frequency, place the ruler crest to crest, then record. Repeat for three different frequencies.' : 'change amplitude, place the ruler, then record. Repeat for two different amplitudes.'}</p>

            <div className="investigation-workspace">
              <div className="investigation-control-panel stack">
                <label className="field medium-lock">
                  <span className="field__label">1. Choose one wave model</span>
                  <select value={preset.id} onChange={(event) => choosePreset(event.target.value)} disabled={trials.length > 0} data-testid="sim-preset" data-control-id="wave-lab.measurement-preset-select" aria-describedby="medium-lock-note">
                    {MEASUREMENT_PRESETS.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}
                  </select>
                  <span id="medium-lock-note" className="seg-control__note">{trials.length > 0 ? `Locked to ${preset.label} so every trial is a fair comparison.` : `${preset.medium.conditions}. Your choice locks after trial 1.`}</span>
                </label>

                <div className="series-tabs" role="group" aria-label="Investigation part" data-control-id="wave-lab.investigation-series-toggle">
                  <button type="button" className={series === 'frequency' ? 'btn btn--primary' : 'btn'} aria-pressed={series === 'frequency'} onClick={() => switchSeries('frequency')} data-testid="series-frequency">Part A · Frequency</button>
                  <button type="button" className={series === 'amplitude' ? 'btn btn--primary' : 'btn'} aria-pressed={series === 'amplitude'} onClick={() => switchSeries('amplitude')} data-testid="series-amplitude">Part B · Amplitude</button>
                </div>

                <div className="variable-banner" role="status">
                  {series === 'frequency' ? (
                    <><strong>Change:</strong> frequency<br /><strong>Keep fixed:</strong> {preset.label} and amplitude {FREQUENCY_AMPLITUDE}%</>
                  ) : (
                    <><strong>Change:</strong> amplitude<br /><strong>Keep fixed:</strong> {preset.label} and frequency {formatSigFigs(preset.defaultFreqHz)} Hz</>
                  )}
                </div>

                <div className="wave-controls">
                  <SimControl id="wave-lab.measure-frequency-slider" label="Source frequency" min={preset.freqRangeHz[0]} max={preset.freqRangeHz[1]} step={FREQ_STEP[preset.id] ?? 0.1} value={effectiveFrequency} onChange={changeFrequency} disabled={series !== 'frequency'} format={(value) => `${formatSigFigs(value)} Hz`} hint={series === 'frequency' ? 'Change for each Part A trial.' : 'Locked for Part B.'} testId="measure-frequency-slider" />
                  <SimControl id="wave-lab.measure-amplitude-slider" label="Amplitude" min={20} max={100} step={10} value={effectiveAmplitude} onChange={setAmplitudePct} disabled={series !== 'amplitude'} format={(value) => `${value}%`} hint={series === 'amplitude' ? 'Change for each Part B trial.' : 'Locked for Part A.'} testId="measure-amplitude-slider" />
                </div>
              </div>

              <div className="investigation-visual-panel stack">
                <div className="lab-quick-controls" role="group" aria-label="Wave display controls">
                  <button type="button" className="btn" aria-pressed={!running} onClick={() => setRunning((value) => !value)} data-testid="sim-pause" data-control-id="global.pause-button">{running ? 'Pause wave' : 'Animate wave'}</button>
                  <button type="button" className="btn" onClick={reset} data-testid="sim-reset" data-control-id="global.reset-button">Reset investigation</button>
                </div>
                <div className="wave-stage__readouts" aria-live="polite">
                  <span>Speed: <strong data-testid="measure-speed">{formatSigFigs(preset.speedMps)} m/s</strong></span>
                  <span>Frequency: <strong data-testid="measure-frequency">{formatSigFigs(effectiveFrequency)} Hz</strong></span>
                  <span>Amplitude: <strong>{effectiveAmplitude}%</strong></span>
                  <span>Ruler: <strong data-testid="ruler-reading-summary">{formatSigFigs(spanM)} m</strong></span>
                </div>
                <div className="record-actions">
                  <button type="button" className="btn" onClick={placeRuler} data-testid="place-ruler" data-control-id="wave-lab.guided-ruler-button">1. Place ruler crest to crest</button>
                  <button type="button" className="btn btn--primary" onClick={recordTrial} data-testid="add-trial" data-control-id="wave-lab.add-trial-button">2. Record this trial</button>
                </div>
                <CanvasScene label={`Wave displacement graph for ${preset.label}; use the ruler to measure one wavelength crest to crest`} height={180} frameKey={`${clock.t}|${preset.id}|${effectiveFrequency}|${effectiveAmplitude}|${ruler.startPct}|${ruler.endPct}|${lowGraphics}`} draw={draw} alternative={<p>{preset.label} displacement graph at {formatSigFigs(effectiveFrequency)} Hz and amplitude {effectiveAmplitude}%. The model speed is fixed at {formatSigFigs(preset.speedMps)} m/s. Ruler span is {formatSigFigs(spanM)} m.</p>} testId="measure-canvas" />
                <RulerTool ruler={ruler} onChange={setRuler} chamberLengthM={chamberLen} lengthUnit="m" readSpan={(value) => value} />
                <p className={feedback.startsWith('Valid') ? 'feedback feedback--correct' : 'feedback feedback--incorrect'} role="status" data-testid="trial-feedback"><span aria-hidden="true">{feedback.startsWith('Valid') ? '✓' : 'ℹ'}</span><span>{feedback}</span></p>
              </div>
            </div>

            <div className="investigation-results stack">
              <h3 id="results-heading">Your results</h3>
              <PracticalTable trials={trials} onDelete={(id) => setTrials((current) => current.filter((trial) => trial.id !== id))} />
              {frequencyTrials.length >= 2 ? <LineGraph title={`Part A — wavelength against 1/frequency (${preset.label})`} xLabel="1/frequency (s)" yLabel="wavelength (m)" xDomain={[0, maxInverse * 1.05]} series={graphSeries} testId="lambda-graph" /> : null}
              <p className="model-note">The model keeps speed fixed for one unchanged medium. Amplitude changes displacement and energy, not speed. {preset.note}</p>
            </div>
            <div className="guided-stage-actions" data-control-id="wave-lab.guided-step-actions">
              <button type="button" className="btn" onClick={() => goToStage('predict')}>Back: prediction</button>
              <span>{evidenceReady ? '✓ Five controlled trials recorded.' : `Still needed: ${Math.max(0, 3 - frequencyTrials.length)} frequency and ${Math.max(0, 2 - amplitudeTrials.length)} amplitude trial(s).`}</span>
              <button type="button" className="btn btn--primary" disabled={!evidenceReady} onClick={() => goToStage('explain')}>Next: use the formula</button>
            </div>
          </section>
          ) : null}

          {stage === 'explain' ? (
            <div className="guided-stage-stack" data-testid="guided-stage-explain">
              <section className="card stack guided-stage-card calculation-handoff" aria-labelledby="investigation-stage-explain">
                <div className="guided-stage-heading"><div><p className="investigation-kicker">Step 3 of 4 · Outcome 7.1.6</p><h2 id="investigation-stage-explain" tabIndex={-1}>Use the wave formula to explain</h2></div><span className="guided-time">About 8 minutes</span></div>
                <p className="do-now"><strong>Do this now:</strong> follow the worked example, use the calculator with two known values, then answer the four evidence questions.</p>
                <div className="formula-relationship" aria-label="Wave equation relationships">
                  <div><span>Wave speed</span><strong>v = fλ</strong><small>frequency × wavelength</small></div>
                  <div><span>Wavelength</span><strong>λ = v/f</strong><small>speed ÷ frequency</small></div>
                  <div><span>Same medium</span><strong>v stays fixed</strong><small>higher f means shorter λ</small></div>
                </div>
                <div className="worked-example" aria-label="Worked wavelength example">
                  <span><strong>Write:</strong> λ = v/f</span>
                  <span><strong>Substitute:</strong> λ = 4 ÷ 2</span>
                  <span><strong>Answer:</strong> λ = 2 m</span>
                </div>
                <p className="model-note"><strong>Important:</strong> amplitude is not in <span className="formula-inline">v = fλ</span>. In the same medium, changing amplitude does not change wave speed.</p>
              </section>

              <LambdaCalculator resetKey={calcResetKey} />

              <section className="card stack" aria-labelledby="analysis-heading" data-control-id="wave-lab.investigation-analysis">
                <h3 id="analysis-heading">Explain your evidence</h3>
                <AnalysisField id="relationship" label="1. Describe the relationship between frequency and wavelength. Quote at least two results." value={answers.relationship} onChange={(value) => { setAnswers((current) => ({ ...current, relationship: value })); setChecked(false); }} passed={checked && checks.relationship} checked={checked} hint="Use the words frequency and wavelength, and state the direction of the relationship." />
                <AnalysisField id="speed" label="2. Use v = fλ to compare your Part A speeds. Why should they be similar?" value={answers.speed} onChange={(value) => { setAnswers((current) => ({ ...current, speed: value })); setChecked(false); }} passed={checked && checks.speed} checked={checked} hint="Link constant speed to the unchanged medium conditions." />
                <AnalysisField id="amplitude" label="3. What happened to wave speed when amplitude changed? Support your claim with Part B evidence." value={answers.amplitude} onChange={(value) => { setAnswers((current) => ({ ...current, amplitude: value })); setChecked(false); }} passed={checked && checks.amplitude} checked={checked} hint="Name amplitude and speed, then state whether speed changed." />
                <AnalysisField id="limitation" label="4. Identify one limitation of this simulator investigation and explain how it affects the evidence." value={answers.limitation} onChange={(value) => { setAnswers((current) => ({ ...current, limitation: value })); setChecked(false); }} passed={checked && checks.limitation} checked={checked} hint="For example: idealised medium, screen measurement, no damping, or limited values." />
                <button type="button" className="btn btn--primary" onClick={() => setChecked(true)} data-testid="check-analysis">Check my explanations</button>
                {checked ? <p className={explanationReady ? 'feedback feedback--correct' : 'feedback feedback--incorrect'} role="status" data-testid="analysis-feedback"><span aria-hidden="true">{explanationReady ? '✓' : 'ℹ'}</span><span>{explanationReady ? 'Your explanations include the required scientific ideas.' : 'Use the hints under any response marked “Add detail”, then check again.'}</span></p> : null}
              </section>

              <div className="guided-stage-actions" data-control-id="wave-lab.guided-step-actions">
                <button type="button" className="btn" onClick={() => goToStage('investigate')}>Back: investigation</button>
                <span>{explanationReady ? '✓ Explanations checked.' : 'Complete and check all four explanations.'}</span>
                <button type="button" className="btn btn--primary" disabled={!explanationReady} onClick={() => goToStage('submit')}>Next: finish report</button>
              </div>
            </div>
          ) : null}

          {stage === 'submit' ? (
          <section className="card stack report-actions guided-stage-card" aria-labelledby="investigation-stage-submit" data-testid="guided-stage-submit">
            <div className="guided-stage-heading"><div><p className="investigation-kicker">Step 4 of 4</p><h2 id="investigation-stage-submit" tabIndex={-1}>Name, check and submit</h2></div><span className="guided-time">About 2 minutes</span></div>
            <p className="do-now"><strong>Do this now:</strong> enter your name, check every item is ticked, then print and choose “Save as PDF”. Upload that PDF to Google Classroom.</p>
            <div className="student-fields" data-control-id="wave-lab.report-fields">
              <label className="field"><span className="field__label">Student name (required)</span><input className="field__input" value={name} onChange={(event) => setName(event.target.value)} data-testid="student-name" autoComplete="name" /></label>
              <label className="field"><span className="field__label">Class (optional)</span><input className="field__input" value={className} onChange={(event) => setClassName(event.target.value)} data-testid="student-class" /></label>
            </div>
            <ul className="report-checklist" aria-label="Report readiness checklist">
              <li className={hypothesis.trim().length >= 20 ? 'is-complete' : ''}>Hypothesis written</li>
              <li className={frequencyTrials.length >= 3 ? 'is-complete' : ''}>3 different frequency trials</li>
              <li className={amplitudeTrials.length >= 2 ? 'is-complete' : ''}>2 different amplitude trials</li>
              <li className={Object.values(checks).every(Boolean) ? 'is-complete' : ''}>Analysis checked</li>
              <li className={name.trim().length >= 2 ? 'is-complete' : ''}>Student name entered</li>
            </ul>
            <button type="button" className="btn btn--primary print-button" disabled={!reportReady} onClick={() => window.print()} data-testid="wave-investigation-print" data-control-id="wave-lab.print-report-button">Print / save completed report as PDF</button>
            <p className="seg-control__note">Your draft is saved only in this browser on this device. The PDF contains your complete investigation and answers.</p>
            <div className="guided-stage-actions" data-control-id="wave-lab.guided-step-actions"><button type="button" className="btn" onClick={() => goToStage('explain')}>Back: explanation</button><span>{reportReady ? '✓ Report ready to save.' : 'Finish any unticked item before printing.'}</span></div>
          </section>
          ) : null}
        </div>

        <details className="report-preview" data-control-id="wave-lab.report-preview">
          <summary>Preview completed report</summary>
        </details>
        <article className="wave-report" aria-label="Completed wave investigation report" data-testid="wave-report">
          <header><p className="investigation-kicker">WaveMotion Studio · Year 10 Waves</p><h2>Frequency, wavelength, amplitude and wave speed</h2><div className="report-identity"><span><strong>Student:</strong> {name || 'Not entered'}</span><span><strong>Class:</strong> {className || '—'}</span><span><strong>Date:</strong> {new Date().toLocaleDateString('en-AU')}</span></div></header>
          <section><h3>Purpose</h3><p>To investigate how frequency and amplitude affect wavelength and wave speed while the medium conditions remain constant.</p><p><strong>Medium:</strong> {preset.label} · <strong>Fixed model speed:</strong> {formatSigFigs(preset.speedMps)} m/s</p></section>
          <section><h3>Hypothesis</h3><p className="report-response">{hypothesis || 'Not completed'}</p></section>
          <section><h3>Method and controlled variables</h3><ol><li>Part A: the medium and amplitude ({FREQUENCY_AMPLITUDE}%) were held constant while frequency changed. One wavelength was measured crest to crest and speed was calculated using v = fλ.</li><li>Part B: the same medium and frequency ({formatSigFigs(preset.defaultFreqHz)} Hz) were held constant while amplitude changed. Wavelength and calculated speed were compared.</li></ol></section>
          <section><h3>Results</h3><PracticalTable trials={trials} /></section>
          <section><h3>Analysis</h3><ReportAnswer number="1" question="Relationship between frequency and wavelength" value={answers.relationship} /><ReportAnswer number="2" question="Why Part A speeds are similar" value={answers.speed} /><ReportAnswer number="3" question="Effect of amplitude on speed" value={answers.amplitude} /><ReportAnswer number="4" question="Limitation and effect on evidence" value={answers.limitation} /></section>
          <footer><p>Completed entirely in WaveMotion Studio. Model: uniform, lossless and non-dispersive; calculated speed v = fλ.</p></footer>
        </article>
      </div>
    </Page>
  );
}

function PracticalTable({ trials, onDelete }: { trials: PracticalTrial[]; onDelete?: (id: string) => void }) {
  return (
    <div className="data-table-wrap" data-control-id={onDelete ? 'wave-lab.trial-table' : undefined}>
      <table className="data-table practical-data-table">
        <caption>Controlled wave investigation results</caption>
        <thead><tr><th scope="col">Part</th><th scope="col">f (Hz)</th><th scope="col">Amplitude (%)</th><th scope="col">Measured λ (m)</th><th scope="col">v = fλ (m/s)</th><th scope="col">Error (%)</th>{onDelete ? <th scope="col">Remove</th> : null}</tr></thead>
        <tbody data-testid="trial-table-body">
          {trials.length === 0 ? <tr><td colSpan={onDelete ? 7 : 6}>No valid trials recorded yet.</td></tr> : trials.map((trial) => <tr key={trial.id}><th scope="row">{trial.series === 'frequency' ? 'A · frequency' : 'B · amplitude'}</th><td>{formatSigFigs(trial.frequencyHz)}</td><td>{trial.amplitudePct}</td><td>{formatSigFigs(trial.measuredWavelengthM)}</td><td>{formatSigFigs(trial.calculatedSpeedMps)}</td><td>{formatSigFigs(trial.errorPct)}</td>{onDelete ? <td><button type="button" className="btn" onClick={() => onDelete(trial.id)} aria-label={`Delete ${trial.series} trial at ${trial.series === 'frequency' ? `${formatSigFigs(trial.frequencyHz)} hertz` : `${trial.amplitudePct} percent amplitude`}`}>Delete</button></td> : null}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

function AnalysisField({ id, label, value, onChange, checked, passed, hint }: { id: keyof Answers; label: string; value: string; onChange: (value: string) => void; checked: boolean; passed: boolean; hint: string }) {
  return <label className="notice-capture__label" htmlFor={`analysis-${id}`}>{label}<textarea id={`analysis-${id}`} rows={4} className="notice-capture__input" value={value} onChange={(event) => onChange(event.target.value)} data-testid={`analysis-${id}`} aria-describedby={`analysis-${id}-hint`} /><span id={`analysis-${id}-hint`} className={checked ? (passed ? 'analysis-hint analysis-hint--pass' : 'analysis-hint analysis-hint--needs') : 'analysis-hint'}>{checked ? (passed ? '✓ Scientific idea included.' : `Add detail: ${hint}`) : hint}</span></label>;
}

function ReportAnswer({ number, question, value }: { number: string; question: string; value: string }) {
  return <div className="report-answer"><h4>{number}. {question}</h4><p className="report-response">{value || 'Not completed'}</p></div>;
}
