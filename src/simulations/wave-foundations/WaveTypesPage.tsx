import { useCallback, useState } from 'react';
import { Page } from '../../components/Page';
import { CanvasScene } from '../../components/sim/CanvasScene';
import { SimControl } from '../../components/sim/SimControl';
import { SimToolbar } from '../../components/sim/SimToolbar';
import { useSimClock } from '../../components/sim/useSimClock';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useProgressStore } from '../../store/progressStore';
import { nextLevelAfterAttempt, nextLevelAfterSuccess } from '../../store/evidenceHelpers';
import { useSettingsStore } from '../../store/settingsStore';
import { displacement, periodOfWave, wavelengthOf, type WaveParams } from '../../science/waves';
import { formatSigFigs } from '../../science/units';
import { WaveAnatomyDiagram, ALL_ANATOMY_LABELS, type AnatomyLabel } from './WaveAnatomyDiagram';

/**
 * Transverse/longitudinal comparison (outcome 7.1.3): BOTH representations of
 * ONE wave state, a keyboard-operable point probe, a mark-period tool that
 * rejects mismatched point pairs, the five anatomy label toggles, and the
 * "representation trap" challenge with misconception-specific feedback.
 */

const CHAMBER = 6; // m
const WAVE: WaveParams = { amplitude: 0.5, frequency: 1.5, speed: 3 }; // λ = 2 m, T ≈ 0.667 s

const LABEL_NAMES: Record<AnatomyLabel, string> = {
  crest: 'Show crest label',
  trough: 'Show trough label',
  equilibrium: 'Show equilibrium label',
  amplitude: 'Show amplitude label',
  wavelength: 'Show wavelength label',
};

type TrapAnswer = 'yes' | 'no';

export default function WaveTypesPage() {
  const [orientation, setOrientation] = useState<'transverse' | 'longitudinal'>('transverse');
  const [probePct, setProbePct] = useState(50);
  const [firstMark, setFirstMark] = useState<number | null>(null);
  const [periodResult, setPeriodResult] = useState<
    | { kind: 'measured'; period: number }
    | { kind: 'mismatch' }
    | null
  >(null);
  const [labels, setLabels] = useState<Set<AnatomyLabel>>(new Set(ALL_ANATOMY_LABELS));
  const [trapAnswer, setTrapAnswer] = useState<TrapAnswer | null>(null);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);

  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const lowGraphics = useSettingsStore((s) => s.lowGraphics);
  const { announce } = useAnnouncer();
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);

  const clock = useSimClock({ running, speed, reducedMotion, active: true });
  const t = clock.t;

  const probeX = (probePct / 100) * CHAMBER;
  const probeDispRaw = displacement(WAVE, probeX, t);
  // Zero-clamp float noise (e.g. sin(3π) ≈ 2e-16) at the DISPLAY layer only.
  const probeDisp = Math.abs(probeDispRaw) < 1e-9 ? 0 : probeDispRaw;
  const T = periodOfWave(WAVE);
  const lambda = wavelengthOf(WAVE);

  const particleCount = lowGraphics ? 24 : 48;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const px = (x: number) => (x / CHAMBER) * (w - 24) + 12;
      const half = h / 2;
      const yT = half / 2; // transverse panel centre
      const dispPxT = (d: number) => -d * (half * 0.55);

      const panel = (active: boolean, y: number, height: number) => {
        ctx.strokeStyle = active ? '#056977' : '#ddd5c8';
        ctx.lineWidth = active ? 2.5 : 1;
        ctx.strokeRect(6, y + 4, w - 12, height - 8);
      };
      panel(orientation === 'transverse', 0, half);
      panel(orientation === 'longitudinal', half, half);

      // ---- Transverse panel: curve + particles (displacement vertical).
      ctx.strokeStyle = '#056977';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const N = 140;
      for (let i = 0; i < N; i++) {
        const x = (CHAMBER * i) / (N - 1);
        const y = yT + dispPxT(displacement(WAVE, x, t));
        if (i === 0) ctx.moveTo(px(x), y);
        else ctx.lineTo(px(x), y);
      }
      ctx.stroke();
      ctx.fillStyle = '#056977';
      for (let i = 0; i < particleCount; i++) {
        const eq = (CHAMBER * i) / (particleCount - 1);
        ctx.beginPath();
        ctx.arc(px(eq), yT + dispPxT(displacement(WAVE, eq, t)), 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#2f3646';
      ctx.fillText('transverse — displacement ⟂ propagation →', 14, 18);

      // ---- Longitudinal panel: same state, displacement along x.
      const yL = half + half / 2;
      ctx.fillStyle = '#5b34c9';
      for (let i = 0; i < particleCount; i++) {
        const eq = (CHAMBER * i) / (particleCount - 1);
        const d = displacement(WAVE, eq, t);
        ctx.beginPath();
        ctx.arc(px(eq + d * 0.35), yL, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#2f3646';
      ctx.fillText('longitudinal — displacement ∥ propagation →', 14, half + 18);

      // ---- Probe marker on both panels (one wave state).
      const probePxX = px(probeX);
      ctx.strokeStyle = '#8a5a0e';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(probePxX, 6);
      ctx.lineTo(probePxX, h - 6);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#8a5a0e';
      ctx.beginPath();
      ctx.arc(probePxX, yT + dispPxT(probeDisp), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px(probeX + probeDisp * 0.35), yL, 6, 0, Math.PI * 2);
      ctx.fill();
    },
    [orientation, t, probeX, probeDisp, particleCount],
  );

  const markPeriod = () => {
    if (firstMark === null) {
      setFirstMark(t);
      setPeriodResult(null);
      announce('First point marked. Step or wait until the wave looks the same here again, then mark the second point.');
      return;
    }
    const dt = Math.abs(t - firstMark);
    const n = Math.round(dt / T);
    if (n >= 1 && Math.abs(dt - n * T) < 0.12 * T) {
      setPeriodResult({ kind: 'measured', period: dt / n });
      announce(`Measured period ${formatSigFigs(dt / n)} seconds.`);
    } else {
      setPeriodResult({ kind: 'mismatch' });
      announce('Not a full period — mark two crests or two troughs.');
    }
    setFirstMark(null);
  };

  const clearMarks = () => {
    setFirstMark(null);
    setPeriodResult(null);
  };

  const setOrientationAndClear = (o: 'transverse' | 'longitudinal') => {
    setOrientation(o);
    clearMarks();
  };

  const answerTrap = (a: TrapAnswer) => {
    setTrapAnswer(a);
    const current = outcomes['7.1.3'] ?? 'not-attempted';
    if (a === 'no') {
      addEvidence({
        outcomeCode: '7.1.3',
        kind: 'check',
        summary: 'Representation trap answered correctly: the graph is not the particle path.',
      });
      setOutcomeLevel('7.1.3', nextLevelAfterSuccess(current));
    } else {
      setOutcomeLevel('7.1.3', nextLevelAfterAttempt(current));
    }
  };

  const reset = () => {
    setOrientation('transverse');
    setProbePct(50);
    clearMarks();
    setTrapAnswer(null);
    setLabels(new Set(ALL_ANATOMY_LABELS));
    setRunning(true);
    setSpeed(1);
    clock.reset();
    announce('Reset to default');
  };

  const toggleLabel = (l: AnatomyLabel) => {
    setLabels((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
  };

  const directionWord =
    orientation === 'transverse'
      ? probeDisp >= 0
        ? 'upward'
        : 'downward'
      : probeDisp >= 0
        ? 'forward (+x)'
        : 'backward (−x)';

  const tCoarse = Math.round(t * 4) / 4;

  return (
    <Page
      title="Wave types"
      lead="One wave state, two representations: transverse and longitudinal views driven by exactly the same engine state."
    >
      <div className="wave-stage stack">
        <SimToolbar
          running={running}
          onToggleRun={() => setRunning((r) => !r)}
          onStep={clock.step}
          speed={speed}
          onSpeed={setSpeed}
          onReset={reset}
          resetLabel="wave types view"
        />

        <p className="wave-stage__readouts">
          <span>
            Elapsed: <output data-testid="sim-time">{formatSigFigs(t)} s</output>
          </span>
          <span>
            Wave: <strong>f = {formatSigFigs(WAVE.frequency)} Hz</strong>,{' '}
            <strong>v = {formatSigFigs(WAVE.speed)} m/s</strong>,{' '}
            <strong>λ = {formatSigFigs(lambda)} m</strong>
          </span>
        </p>

        <div className="wave-controls">
          <fieldset className="seg-control" data-control-id="wave-lab.wave-orientation-toggle">
            <legend className="seg-control__legend">Wave orientation</legend>
            <div className="seg-control__options" role="radiogroup" aria-label="Wave orientation">
              {(
                [
                  ['transverse', 'Transverse'],
                  ['longitudinal', 'Longitudinal'],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="seg-control__option">
                  <input
                    type="radio"
                    name="orientation"
                    checked={orientation === value}
                    onChange={() => setOrientationAndClear(value)}
                    data-testid={`orientation-${value}`}
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="seg-control__note" data-testid="orientation-description">
              {orientation === 'transverse'
                ? 'Displacement is perpendicular to the direction the wave travels.'
                : 'Displacement is parallel to the direction the wave travels — compressions and rarefactions.'}
            </p>
          </fieldset>

          <SimControl
            id="wave-lab.point-probe-drag"
            label="Point probe position"
            min={0}
            max={100}
            step={1}
            value={probePct}
            onChange={setProbePct}
            format={(v) =>
              `Probe at x = ${formatSigFigs((v / 100) * CHAMBER)} m`
            }
            hint="Arrow keys move the probe along the wave."
            testId="point-probe"
          />
        </div>

        <p className="wave-stage__readouts" data-testid="probe-readout">
          <span>
            Probe: x = <strong>{formatSigFigs(probeX)} m</strong>, displacement ={' '}
            <strong>
              {probeDisp >= 0 ? '+' : '−'}
              {formatSigFigs(Math.abs(probeDisp))} m ({directionWord})
            </strong>
            , t = <strong>{formatSigFigs(t)} s</strong>
          </span>
        </p>

        <CanvasScene
          label="Linked transverse and longitudinal views of the same wave, with a probe line crossing both"
          height={260}
          frameKey={`${t}|${orientation}|${probePct}|${lowGraphics}`}
          draw={draw}
          alternative={
            <p>
              One wave state (f = {formatSigFigs(WAVE.frequency)} Hz, v ={' '}
              {formatSigFigs(WAVE.speed)} m/s, λ = {formatSigFigs(lambda)} m) shown
              two ways at t = {formatSigFigs(tCoarse)} s. Transverse view:
              particles move at right angles to travel. Longitudinal view: the
              same particles move along the travel direction, bunching into
              compressions and spreading into rarefactions. Probe at{' '}
              {formatSigFigs(probeX)} m reads displacement{' '}
              {formatSigFigs(probeDisp)} m in both views.
            </p>
          }
          testId="types-canvas"
        />

        <div className="card stack">
          <h2>Measure the period</h2>
          <p>
            Pause and step until the wave at the probe looks the same twice (for
            example crest → next crest), marking each moment.
          </p>
          <button
            type="button"
            className="btn"
            onClick={markPeriod}
            data-testid="mark-period"
            data-control-id="wave-lab.clock-readout-control"
          >
            Mark period at probe position
          </button>
          <p role="status" data-testid="period-readout">
            {firstMark !== null
              ? `First point marked at t = ${formatSigFigs(firstMark)} s — mark the matching point one full cycle later.`
              : periodResult === null
                ? 'No period measured yet.'
                : periodResult.kind === 'measured'
                  ? `Measured period: ${formatSigFigs(periodResult.period)} s (source frequency ${formatSigFigs(WAVE.frequency)} Hz → expected ${formatSigFigs(T)} s)`
                  : 'Not a full period — mark two crests or two troughs.'}
          </p>
        </div>

        <div className="card stack">
          <h2>Wave anatomy</h2>
          <div className="seg-control" data-control-id="wave-lab.label-toggles">
            <span className="seg-control__legend" aria-hidden="true">
              Diagram labels
            </span>
            <div>
              {ALL_ANATOMY_LABELS.map((l) => (
                <label key={l} className="check-row">
                  <input
                    type="checkbox"
                    checked={labels.has(l)}
                    onChange={() => toggleLabel(l)}
                    aria-label={LABEL_NAMES[l]}
                    data-testid={`label-toggle-${l}`}
                  />
                  {LABEL_NAMES[l].replace('Show ', '').replace(' label', '')}
                </label>
              ))}
            </div>
          </div>
          <WaveAnatomyDiagram show={labels} />
        </div>

        <div className="card stack" data-control-id="wave-lab.representation-trap-answer">
          <h2>The representation trap</h2>
          <p>
            A sound wave is often drawn as a smooth up-and-down curve. Does that
            pressure graph mean sound particles physically move up and down?
          </p>
          <div className="seg-control__options">
            <button
              type="button"
              className="btn"
              aria-pressed={trapAnswer === 'yes'}
              onClick={() => answerTrap('yes')}
              data-testid="trap-yes"
            >
              Yes, particles move up and down
            </button>
            <button
              type="button"
              className="btn"
              aria-pressed={trapAnswer === 'no'}
              onClick={() => answerTrap('no')}
              data-testid="trap-no"
            >
              No, only the graph value changes
            </button>
          </div>
          {trapAnswer === 'yes' ? (
            <p className="feedback feedback--incorrect" data-testid="trap-feedback">
              <span aria-hidden="true">✗</span>
              <span>
                <strong>Not correct.</strong> The graph represents
                pressure/displacement versus position or time, not the physical
                path of air particles. Sound is longitudinal: the particles move
                back and forth along the direction of travel.
              </span>
            </p>
          ) : null}
          {trapAnswer === 'no' ? (
            <p className="feedback feedback--correct" data-testid="trap-feedback">
              <span aria-hidden="true">✓</span>
              <span>
                <strong>Correct.</strong> The curve is a graph of
                pressure/displacement against position or time — a
                representation, not the particles' actual up-and-down motion.
                Evidence saved for outcome 7.1.3.
              </span>
            </p>
          ) : null}
        </div>

        <p className="notice">
          <span>Model honesty: water-surface waves are <em>not</em> perfectly
          transverse — real water particles move in near-circular paths — so
          ropes and springs are the clean transverse examples here.</span>
        </p>
      </div>
    </Page>
  );
}
