import { useCallback, useMemo, useState } from 'react';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { Page } from '../../components/Page';
import { CanvasScene } from '../../components/sim/CanvasScene';
import { SimControl } from '../../components/sim/SimControl';
import { SimToolbar } from '../../components/sim/SimToolbar';
import { WaveRunnerBrief, type WaveRunnerStep } from '../../components/sim/WaveRunnerBrief';
import { useSimClock } from '../../components/sim/useSimClock';
import { outcomeMap } from '../../content/outcomes';
import {
  WAVE_COMPARISON_CHAMBER_LENGTH,
  WAVE_COMPARISON_SPEED,
  createWaveComparisonRun,
  evaluateGraphRepresentationTrap,
  evaluateWaveFeatureProbe,
  waveComparisonScenarioForReplay,
  waveComparisonStateAt,
  waveDirectionRelationship,
  type GraphRepresentationAnswer,
  type WaveFeatureKind,
  type WaveFeatureProbeResult,
  type WaveComparisonRun,
} from '../../science/waveComparison';
import { formatSigFigs } from '../../science/units';
import { useSettingsStore } from '../../store/settingsStore';
import './Outcome713Page.css';
import './OutcomeGamePolish.css';

const TOUR_STEPS = [
  {
    title: 'Watch one state in two directions',
    body: 'The upper rope moves perpendicular to travel. The lower spring particles move parallel to travel, bunching and spreading.',
  },
  {
    title: 'Pause and place the gold probe',
    body: 'Move the probe onto the assigned crest or trough, then onto the assigned compression or rarefaction. The engine checks the live feature positions.',
  },
  {
    title: 'Separate a model from particle motion',
    body: 'Finish by comparing the direction arrows and deciding what a plotted wave curve actually represents.',
  },
] as const;

type TransverseFeature = 'crest' | 'trough';
type LongitudinalFeature = 'compression' | 'rarefaction';
type DirectionAnswer = 'correct' | 'reversed' | null;

const FEATURE_PAIRS: Record<WaveFeatureKind, {
  transverse: TransverseFeature;
  longitudinal: LongitudinalFeature;
}> = {
  crest: { transverse: 'crest', longitudinal: 'compression' },
  trough: { transverse: 'trough', longitudinal: 'rarefaction' },
  compression: { transverse: 'trough', longitudinal: 'compression' },
  rarefaction: { transverse: 'crest', longitudinal: 'rarefaction' },
};

const FEATURE_LABELS: Record<WaveFeatureKind, string> = {
  crest: 'crest',
  trough: 'trough',
  compression: 'compression',
  rarefaction: 'rarefaction',
};

interface ComparisonResult {
  score: number;
  maxScore: 100;
  checks: {
    transverseFeature: boolean;
    longitudinalFeature: boolean;
    directions: boolean;
    graph: boolean;
  };
}

function signed(value: number): string {
  const safe = Math.abs(value) < 0.0005 ? 0 : value;
  return `${safe >= 0 ? '+' : '−'}${formatSigFigs(Math.abs(safe))}`;
}

export default function Outcome713Page() {
  const firstScenario = waveComparisonScenarioForReplay(0);
  const [replayIndex, setReplayIndex] = useState(0);
  const [amplitude, setAmplitude] = useState(firstScenario.amplitude);
  const [frequency, setFrequency] = useState(firstScenario.frequency);
  const [targetFeature, setTargetFeature] = useState<WaveFeatureKind>(firstScenario.targetFeature);
  const [run, setRun] = useState<WaveComparisonRun | null>(null);
  const [probeX, setProbeX] = useState(WAVE_COMPARISON_CHAMBER_LENGTH / 2);
  const [transverseLock, setTransverseLock] = useState<WaveFeatureProbeResult | null>(null);
  const [longitudinalLock, setLongitudinalLock] = useState<WaveFeatureProbeResult | null>(null);
  const [directionAnswer, setDirectionAnswer] = useState<DirectionAnswer>(null);
  const [graphAnswer, setGraphAnswer] = useState<GraphRepresentationAnswer | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [message, setMessage] = useState('Launch the linked wave, pause it, then place the probe on each assigned feature.');
  const [running, setRunning] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(0.5);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const lowGraphics = useSettingsStore((state) => state.lowGraphics);
  const { announce } = useAnnouncer();
  const clock = useSimClock({
    running,
    speed: playbackSpeed,
    reducedMotion,
    active: run !== null,
  });

  const scenario = waveComparisonScenarioForReplay(replayIndex);
  const previewRun = useMemo(() => createWaveComparisonRun({
    replayIndex,
    controls: { amplitude, frequency },
    phase: scenario.phase,
    targetFeature,
  }), [amplitude, frequency, replayIndex, scenario.phase, targetFeature]);
  const activeRun = run ?? previewRun;
  const comparisonState = useMemo(
    () => waveComparisonStateAt(activeRun, run ? clock.t : 0),
    [activeRun, clock.t, run],
  );
  const targets = FEATURE_PAIRS[targetFeature];
  const transverseRelationship = waveDirectionRelationship('transverse');
  const longitudinalRelationship = waveDirectionRelationship('longitudinal');
  const graphState = evaluateGraphRepresentationTrap(graphAnswer);

  const clearEvidence = useCallback(() => {
    setTransverseLock(null);
    setLongitudinalLock(null);
    setDirectionAnswer(null);
    setGraphAnswer(null);
    setResult(null);
    setMessage('Launch the linked wave, pause it, then place the probe on each assigned feature.');
  }, []);

  const prepareControlChange = useCallback(() => {
    setRun(null);
    clearEvidence();
    setRunning(true);
    clock.reset();
  }, [clearEvidence, clock]);

  const launch = () => {
    const nextRun = createWaveComparisonRun({
      replayIndex,
      controls: { amplitude, frequency },
      phase: scenario.phase,
      targetFeature,
    });
    setRun(nextRun);
    clearEvidence();
    clock.reset();
    setRunning(true);
    announce(`Linked transverse and longitudinal wave launched. Find a ${targets.transverse} and a ${targets.longitudinal}.`);
  };

  const reset = () => {
    const initial = waveComparisonScenarioForReplay(0);
    setReplayIndex(0);
    setAmplitude(initial.amplitude);
    setFrequency(initial.frequency);
    setTargetFeature(initial.targetFeature);
    setProbeX(WAVE_COMPARISON_CHAMBER_LENGTH / 2);
    setRun(null);
    clearEvidence();
    setRunning(true);
    setPlaybackSpeed(0.5);
    clock.reset();
    announce('Twin Wave Observatory reset to the first feature pair.');
  };

  const replayChallenge = () => {
    const nextIndex = replayIndex + 1;
    const nextScenario = waveComparisonScenarioForReplay(nextIndex);
    setReplayIndex(nextIndex);
    setAmplitude(nextScenario.amplitude);
    setFrequency(nextScenario.frequency);
    setTargetFeature(nextScenario.targetFeature);
    setProbeX(WAVE_COMPARISON_CHAMBER_LENGTH / 2);
    setRun(null);
    clearEvidence();
    setRunning(true);
    clock.reset();
    const nextTargets = FEATURE_PAIRS[nextScenario.targetFeature];
    announce(`New comparison challenge: find a ${nextTargets.transverse} and a ${nextTargets.longitudinal}.`);
  };

  const lockFeature = (kind: WaveFeatureKind) => {
    if (!run) {
      setMessage('Launch the linked wave before locking a live feature.');
      announce('Launch the linked wave before locking a feature.');
      return;
    }
    const probeResult = evaluateWaveFeatureProbe(comparisonState, kind, probeX);
    if (kind === 'crest' || kind === 'trough') setTransverseLock(probeResult);
    else setLongitudinalLock(probeResult);
    setResult(null);
    setRunning(false);
    const distanceText = formatSigFigs(probeResult.distance);
    setMessage(probeResult.correct
      ? `${FEATURE_LABELS[kind]} locked: the probe is within ${formatSigFigs(probeResult.tolerance)} m of the engine feature.`
      : `${FEATURE_LABELS[kind]} missed by ${distanceText} m. Move the probe towards the labelled feature and try again.`);
    announce(probeResult.correct
      ? `${FEATURE_LABELS[kind]} feature locked correctly.`
      : `${FEATURE_LABELS[kind]} feature not locked. Move the probe and try again.`);
  };

  const checkChallenge = () => {
    const checks = {
      transverseFeature: transverseLock?.correct === true,
      longitudinalFeature: longitudinalLock?.correct === true,
      directions: directionAnswer === 'correct',
      graph: graphState.correct === true,
    };
    const score = Object.values(checks).filter(Boolean).length * 25;
    const nextResult: ComparisonResult = { score, maxScore: 100, checks };
    setResult(nextResult);
    if (score === 100) {
      setMessage('Twin Wave comparison complete: the feature evidence and both representation checks agree with the model.');
      announce('Twin Wave comparison complete. One hundred out of one hundred points.');
    } else {
      setMessage('Some comparison evidence needs another pass. Use the feedback below, then relock or revise your choices.');
      announce(`Comparison check scored ${score} out of 100. Review the highlighted evidence.`);
    }
  };

  const drawScene = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const left = 56;
      const right = width - 42;
      const trackWidth = Math.max(120, right - left);
      const upperY = height * 0.28;
      const lowerY = height * 0.73;
      const compact = width < 560;
      const amplitudeScale = Math.min(92, height * 0.2) / Math.max(0.2, comparisonState.wave.amplitude);
      const xFor = (x: number) => left + (x / WAVE_COMPARISON_CHAMBER_LENGTH) * trackWidth;
      const transverseY = (displacement: number) => upperY - displacement * amplitudeScale;

      const background = ctx.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, '#07172a');
      background.addColorStop(0.55, '#0a2c3e');
      background.addColorStop(1, '#1c1940');
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(193, 219, 230, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(18, height / 2);
      ctx.lineTo(width - 18, height / 2);
      ctx.stroke();

      for (const y of [upperY, lowerY]) {
        ctx.strokeStyle = 'rgba(188, 218, 230, 0.3)';
        ctx.setLineDash([5, 6]);
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = '#dceaf2';
      ctx.font = '700 12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(compact ? 'TRANSVERSE · displacement ⟂' : 'TRANSVERSE · displacement ⟂ travel', 18, 24);
      ctx.fillText(compact ? 'LONGITUDINAL · displacement ∥' : 'LONGITUDINAL · displacement ∥ travel', 18, height / 2 + 24);

      ctx.strokeStyle = '#58d3df';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      comparisonState.particles.forEach((particle, index) => {
        const x = xFor(particle.transversePosition.x);
        const y = transverseY(particle.transversePosition.y);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      const particleStride = lowGraphics ? 2 : 1;
      comparisonState.particles.forEach((particle, index) => {
        if (index % particleStride !== 0) return;
        ctx.fillStyle = '#74e0e8';
        ctx.beginPath();
        ctx.arc(xFor(particle.transversePosition.x), transverseY(particle.transversePosition.y), lowGraphics ? 3 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = particle.longitudinalBand === 'compression'
          ? '#ffd166'
          : particle.longitudinalBand === 'rarefaction'
            ? '#bda8ff'
            : '#d6e2ec';
        ctx.beginPath();
        ctx.arc(xFor(particle.longitudinalPosition.x), lowerY, lowGraphics ? 3 : 4, 0, Math.PI * 2);
        ctx.fill();
      });

      const drawFeature = (kind: WaveFeatureKind, y: number, color: string) => {
        const features = comparisonState.features[kind];
        for (const feature of features) {
          const x = xFor(feature.x);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(x, y - 18);
          ctx.lineTo(x, y + 18);
          ctx.stroke();
        }
        const labelled = features.find((feature) => feature.x > WAVE_COMPARISON_CHAMBER_LENGTH * 0.12);
        if (labelled) {
          ctx.fillStyle = color;
          ctx.font = '600 11px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(kind, xFor(labelled.x), y - 24);
        }
      };
      drawFeature('crest', upperY - comparisonState.wave.amplitude * amplitudeScale, '#8ce7ee');
      drawFeature('trough', upperY + comparisonState.wave.amplitude * amplitudeScale, '#8ce7ee');
      drawFeature('compression', lowerY, '#ffd166');
      drawFeature('rarefaction', lowerY + 34, '#bda8ff');

      const nearestParticle = comparisonState.particles.reduce((nearest, particle) => (
        Math.abs(particle.equilibrium - probeX) < Math.abs(nearest.equilibrium - probeX)
          ? particle
          : nearest
      ));
      const probePx = xFor(probeX);
      ctx.strokeStyle = '#ffdf86';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(probePx, 8);
      ctx.lineTo(probePx, height - 8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffdf86';
      ctx.beginPath();
      ctx.arc(probePx, transverseY(nearestParticle.sharedDisplacement), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(xFor(nearestParticle.longitudinalPosition.x), lowerY, 6, 0, Math.PI * 2);
      ctx.fill();

      if (!compact) {
        ctx.strokeStyle = '#f4f8fb';
        ctx.fillStyle = '#f4f8fb';
        ctx.lineWidth = 2;
        for (const y of [upperY - 58, lowerY - 46]) {
          ctx.beginPath();
          ctx.moveTo(width - 132, y);
          ctx.lineTo(width - 66, y);
          ctx.lineTo(width - 76, y - 6);
          ctx.moveTo(width - 66, y);
          ctx.lineTo(width - 76, y + 6);
          ctx.stroke();
        }
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('wave travels →', width - 40, upperY - 72);
        ctx.fillText('wave travels →', width - 40, lowerY - 60);
      }
    },
    [comparisonState, lowGraphics, probeX],
  );

  const changeAmplitude = (value: number) => {
    setAmplitude(value);
    prepareControlChange();
  };
  const changeFrequency = (value: number) => {
    setFrequency(value);
    prepareControlChange();
  };

  const probeParticle = comparisonState.particles.reduce((nearest, particle) => (
    Math.abs(particle.equilibrium - probeX) < Math.abs(nearest.equilibrium - probeX)
      ? particle
      : nearest
  ));
  const frameKey = `${clock.t}|${activeRun.runKey}|${probeX}|${lowGraphics}|${run ? 'active' : 'ready'}`;
  const outcome = outcomeMap['7.1.3'];
  const featurePairLocked = Boolean(transverseLock?.correct && longitudinalLock?.correct);
  const missionComplete = result?.score === result?.maxScore;
  const missionSteps: readonly WaveRunnerStep[] = [
    { label: 'Launch both views', state: run ? 'complete' : 'active' },
    { label: 'Lock features', state: featurePairLocked ? 'complete' : run ? 'active' : 'locked' },
    { label: 'Translate motion', state: missionComplete ? 'complete' : featurePairLocked ? 'active' : 'locked' },
  ];

  return (
    <Page
      title="7.1.3 Twin Wave Observatory"
      heading={<><span className="outcome-713__code">7.1.3</span> Twin Wave Observatory</>}
      lead={<span>{outcome.text}</span>}
    >
      <div className="outcome-713">
        <div className="outcome-713__command-row">
          <p className="outcome-713__eyebrow">Linked wave lab · one engine state</p>
          {tourOpen ? null : (
            <button
              type="button"
              className="outcome-713__text-button"
              data-control-id="outcome-7-1-3.tour-open"
              onClick={() => { setTourStep(0); setTourOpen(true); }}
            >
              Show quick tour
            </button>
          )}
        </div>

        <WaveRunnerBrief
          sector="Wave Translator"
          title="Decode one wave through two different models"
          objective={`Launch the shared state, lock a ${targets.transverse} and a ${targets.longitudinal}, then compare how particles move.`}
          status={missionComplete ? 'Both wave languages translated correctly.' : featurePairLocked ? 'Feature pair locked. Finish the direction comparison.' : run ? `Move the gold probe onto the assigned ${targets.transverse} and ${targets.longitudinal}.` : 'The linked generator is standing by.'}
          points={100}
          complete={missionComplete}
          theme="observatory"
          steps={missionSteps}
        />

        {tourOpen ? (
          <aside className="outcome-713__tour" aria-label="Three-step simulator tour">
            <div className="outcome-713__tour-index" aria-hidden="true">
              {TOUR_STEPS.map((_, index) => <span key={index} data-active={index === tourStep} />)}
            </div>
            <div>
              <p className="outcome-713__tour-kicker">Quick tour · {tourStep + 1} of 3</p>
              <h2>{TOUR_STEPS[tourStep].title}</h2>
              <p>{TOUR_STEPS[tourStep].body}</p>
            </div>
            <div className="outcome-713__tour-actions">
              <button type="button" className="outcome-713__text-button" data-control-id="outcome-7-1-3.tour-dismiss" onClick={() => setTourOpen(false)}>
                Skip tour
              </button>
              <button
                type="button"
                className="btn"
                data-control-id="outcome-7-1-3.tour-next"
                onClick={() => tourStep === TOUR_STEPS.length - 1 ? setTourOpen(false) : setTourStep((step) => step + 1)}
              >
                {tourStep === TOUR_STEPS.length - 1 ? 'Start comparing' : 'Next'}
              </button>
            </div>
          </aside>
        ) : null}

        <section className="outcome-713__deck" aria-labelledby="outcome-713-deck-title">
          <div className="outcome-713__deck-heading">
            <div>
              <p className="outcome-713__eyebrow">Twin wave observatory</p>
              <h2 id="outcome-713-deck-title">How does the medium move?</h2>
            </div>
            <button type="button" className="outcome-713__launch" data-control-id="outcome-7-1-3.launch" data-testid="outcome-713-launch" onClick={launch}>
              <span aria-hidden="true">▶</span>
              {run ? 'Restart linked wave' : 'Launch linked wave'}
            </button>
          </div>

          <div className="outcome-713__viewport">
            <CanvasScene
              label="The same wave state shown as a transverse rope and a longitudinal spring, with a gold probe crossing both views."
              height={360}
              frameKey={frameKey}
              draw={drawScene}
              testId="outcome-713-canvas"
              teacherLayer="particles"
              alternative={
                <div className="outcome-713__table-wrap">
                  <table className="outcome-713__state-table">
                    <caption>Live comparison of one shared wave state</caption>
                    <thead>
                      <tr><th scope="col">Property</th><th scope="col">Transverse view</th><th scope="col">Longitudinal view</th></tr>
                    </thead>
                    <tbody>
                      <tr><th scope="row">Particle displacement</th><td>Perpendicular to propagation</td><td>Parallel to propagation</td></tr>
                      <tr><th scope="row">Named features</th><td>Crests and troughs</td><td>Compressions and rarefactions</td></tr>
                      <tr><th scope="row">Probe at {formatSigFigs(probeX)} m</th><td>{signed(probeParticle.sharedDisplacement)} model m vertically</td><td>{signed(probeParticle.longitudinalDisplayDisplacement)} display m horizontally · {probeParticle.longitudinalBand}</td></tr>
                      <tr><th scope="row">Shared state</th><td colSpan={2}>f = {formatSigFigs(comparisonState.wave.frequency)} Hz · λ = {formatSigFigs(comparisonState.wavelength)} m · v = {WAVE_COMPARISON_SPEED} m/s</td></tr>
                    </tbody>
                  </table>
                </div>
              }
            />
          </div>

          <div className="outcome-713__instrument-bar" aria-label="Live Twin Wave readouts">
            <p><span>Elapsed</span><strong>{formatSigFigs(run ? clock.t : 0)} s</strong></p>
            <p><span>Frequency</span><strong>{formatSigFigs(comparisonState.wave.frequency)} Hz</strong></p>
            <p><span>Wavelength</span><strong>{formatSigFigs(comparisonState.wavelength)} m</strong></p>
            <p><span>Wave speed</span><strong>{WAVE_COMPARISON_SPEED} m/s</strong></p>
            <p><span>Probe</span><strong>x = {formatSigFigs(probeX)} m</strong></p>
          </div>

          <SimToolbar
            running={running}
            onToggleRun={() => setRunning((value) => !value)}
            onStep={clock.step}
            speed={playbackSpeed}
            onSpeed={setPlaybackSpeed}
            onReset={reset}
            resetLabel="Twin Wave Observatory"
          />

          <div className="outcome-713__controls">
            <SimControl id="outcome-7-1-3.amplitude" label="Shared amplitude" min={0.2} max={0.8} step={0.05} value={amplitude} onChange={changeAmplitude} format={(value) => `${value.toFixed(2)} model m`} hint="Changes displacement size in both views, not speed." testId="outcome-713-amplitude" />
            <SimControl id="outcome-7-1-3.frequency" label="Shared frequency" min={0.75} max={2.5} step={0.05} value={frequency} onChange={changeFrequency} format={(value) => `${value.toFixed(2)} Hz`} hint="At fixed medium speed, higher frequency gives a shorter wavelength." testId="outcome-713-frequency" />
            <SimControl id="outcome-7-1-3.probe" label="Gold feature probe" min={0} max={WAVE_COMPARISON_CHAMBER_LENGTH} step={0.02} value={probeX} onChange={setProbeX} format={(value) => `x = ${value.toFixed(2)} m`} hint="Pause, then use arrow keys for precise feature locks." testId="outcome-713-probe" />
          </div>

          <div className="outcome-713__comparison-strip">
            <div className="outcome-713__comparison-card">
              <span aria-hidden="true">↕</span>
              <div><strong>Transverse</strong><p>Particle displacement is {transverseRelationship.angleDegrees}° to travel: {transverseRelationship.relationship}.</p></div>
            </div>
            <div className="outcome-713__comparison-card outcome-713__comparison-card--longitudinal">
              <span aria-hidden="true">↔</span>
              <div><strong>Longitudinal</strong><p>Particle displacement is {longitudinalRelationship.angleDegrees}° to travel: {longitudinalRelationship.relationship}.</p></div>
            </div>
          </div>

          <div className="outcome-713__lock-panel">
            <div>
              <p className="outcome-713__eyebrow">Feature lock · live engine positions</p>
              <h3>Find a {targets.transverse}, then a {targets.longitudinal}</h3>
              <p>Pause or use reduced-motion stepping. Place the gold probe within 5% of one wavelength of each labelled feature, then lock the evidence.</p>
            </div>
            <div className="outcome-713__lock-actions">
              <button type="button" className="btn" data-locked={transverseLock?.correct === true} data-control-id="outcome-7-1-3.lock-transverse" onClick={() => lockFeature(targets.transverse)}>
                {transverseLock?.correct ? `✓ ${targets.transverse} locked` : `Lock ${targets.transverse}`}
              </button>
              <button type="button" className="btn" data-locked={longitudinalLock?.correct === true} data-control-id="outcome-7-1-3.lock-longitudinal" onClick={() => lockFeature(targets.longitudinal)}>
                {longitudinalLock?.correct ? `✓ ${targets.longitudinal} locked` : `Lock ${targets.longitudinal}`}
              </button>
            </div>
          </div>

          <p className="outcome-713__honesty"><strong>Model honesty:</strong> this ideal 1D model uses a rope as the clean transverse example and a spring as the clean longitudinal example. Real water-surface particles move in near-circular paths. Longitudinal spacing is display-scaled to keep particle order physically readable.</p>
        </section>

        <section className="outcome-713__challenge" aria-labelledby="outcome-713-challenge-title">
          <div className="outcome-713__challenge-copy">
            <p className="outcome-713__eyebrow">Feature comparison challenge</p>
            <h2 id="outcome-713-challenge-title">Use the two models, then explain the difference</h2>
            <p>Objective: lock one valid feature in each representation, compare particle displacement with propagation, and avoid treating a plotted curve as the particle path.</p>
          </div>

          <div className="outcome-713__evidence-grid" aria-label="Feature lock evidence">
            <div className="outcome-713__evidence-card"><strong>1 · Transverse {targets.transverse}</strong><p className={`outcome-713__result ${result?.checks.transverseFeature ? 'is-correct' : 'is-incorrect'}`}>{transverseLock?.correct ? `✓ Locked at ${formatSigFigs(transverseLock.probeX)} m` : transverseLock ? 'Probe missed the live feature' : 'No valid lock yet'}</p></div>
            <div className="outcome-713__evidence-card"><strong>2 · Longitudinal {targets.longitudinal}</strong><p className={`outcome-713__result ${result?.checks.longitudinalFeature ? 'is-correct' : 'is-incorrect'}`}>{longitudinalLock?.correct ? `✓ Locked at ${formatSigFigs(longitudinalLock.probeX)} m` : longitudinalLock ? 'Probe missed the live feature' : 'No valid lock yet'}</p></div>
            <div className="outcome-713__evidence-card"><strong>Shared model state</strong><p>Both views use f = {formatSigFigs(comparisonState.wave.frequency)} Hz, λ = {formatSigFigs(comparisonState.wavelength)} m and v = {WAVE_COMPARISON_SPEED} m/s.</p></div>
          </div>

          <div className="outcome-713__questions">
            <fieldset className="outcome-713__question" data-control-id="outcome-7-1-3.direction-answer">
              <legend><strong>3 · Compare the directions</strong></legend>
              <p>Which statement matches the particle arrows?</p>
              <div className="outcome-713__answer-options">
                <label><input type="radio" name="wave-directions" checked={directionAnswer === 'correct'} onChange={() => { setDirectionAnswer('correct'); setResult(null); }} />Transverse is perpendicular; longitudinal is parallel</label>
                <label><input type="radio" name="wave-directions" checked={directionAnswer === 'reversed'} onChange={() => { setDirectionAnswer('reversed'); setResult(null); }} />Transverse is parallel; longitudinal is perpendicular</label>
              </div>
            </fieldset>
            <fieldset className="outcome-713__question" data-control-id="outcome-7-1-3.graph-answer">
              <legend><strong>4 · Representation trap</strong></legend>
              <p>What does a smooth wave curve show?</p>
              <div className="outcome-713__answer-options">
                <label><input type="radio" name="graph-trap" checked={graphAnswer === 'quantity-versus-position'} onChange={() => { setGraphAnswer('quantity-versus-position'); setResult(null); }} />A quantity such as displacement or pressure versus position</label>
                <label><input type="radio" name="graph-trap" checked={graphAnswer === 'particle-path'} onChange={() => { setGraphAnswer('particle-path'); setResult(null); }} />The physical path travelled by each particle</label>
              </div>
            </fieldset>
          </div>

          <div className="outcome-713__challenge-actions">
            <button type="button" className="btn btn--primary" data-control-id="outcome-7-1-3.challenge-check" data-testid="outcome-713-challenge-check" onClick={checkChallenge}>Check comparison</button>
            <button type="button" className="btn" data-control-id="outcome-7-1-3.challenge-replay" data-testid="outcome-713-challenge-replay" onClick={replayChallenge}>New feature challenge</button>
          </div>

          <p className="outcome-713__result" role="status">{message}</p>
          {result ? (
            <div className={`outcome-713__reward ${result.score === result.maxScore ? 'is-complete' : ''}`} role="status" aria-live="polite">
              <div className="outcome-713__score-ring" aria-hidden="true">{result.score}</div>
              <div><p className="outcome-713__reward-title">{result.score === result.maxScore ? 'Wave comparison expert unlocked' : 'Comparison needs another pass'}</p><p>{result.score}/{result.maxScore} points. {result.score === result.maxScore ? 'You identified both feature families and compared the defining particle directions.' : 'Each feature lock and reasoning check is worth 25 points.'}</p></div>
            </div>
          ) : null}

          <details data-control-id="outcome-7-1-3.how-it-works">
            <summary>How one engine state drives both models</summary>
            <p>The same scalar displacement and phase are mapped vertically for the transverse rope and horizontally for the longitudinal spring. Compressions and rarefactions come from how neighbouring particles bunch and spread, so they are not interchangeable with crests and troughs.</p>
          </details>
        </section>
      </div>
    </Page>
  );
}
