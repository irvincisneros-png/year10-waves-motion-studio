import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Page } from '../../components/Page';
import { CanvasScene } from '../../components/sim/CanvasScene';
import { SimControl } from '../../components/sim/SimControl';
import { SimToolbar } from '../../components/sim/SimToolbar';
import { useSimClock } from '../../components/sim/useSimClock';
import { LineGraph } from '../../components/graphs/LineGraph';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useSettingsStore } from '../../store/settingsStore';
import { useProgressStore } from '../../store/progressStore';
import { nextLevelAfterAttempt, nextLevelAfterSuccess } from '../../store/evidenceHelpers';
import {
  displacement,
  displacementVsPosition,
  displacementVsTime,
  periodOfWave,
  wavelengthOf,
  type WaveParams,
} from '../../science/waves';
import { MEASUREMENT_PRESETS, measurementPresetById } from '../../science/constants';
import { createRng } from '../../science/rng';
import {
  formatSigFigs,
  formatWithUnit,
  fromHertz,
  fromMeters,
  DISTANCE_UNITS,
  FREQUENCY_UNITS,
  type DistanceUnit,
  type FrequencyUnit,
} from '../../science/units';
import { RulerTool, RULER_DEFAULT, type RulerState } from './RulerTool';
import { LambdaCalculator } from './LambdaCalculator';
import { TrialResults } from './TrialResults';
import type { Trial } from '../../investigations/types';

/**
 * Wave measurement laboratory (outcomes 7.1.5 + 7.1.6): placeable ruler /
 * timer / probe tools, medium presets, unit conversion, the v = fλ calculator,
 * a controlled-variable investigation (λ vs 1/f at fixed v) with trials table,
 * graph, interpretation + limitation prompts, CSV/JSON export, and an optional
 * deterministic seeded measurement-noise mode.
 */

const FREQ_STEP: Record<string, number> = {
  rope: 0.05,
  water: 0.1,
  sound: 5,
  em: 2.5e6,
};

const DEFAULT_SEED = 1234;

export default function MeasurementLabPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPreset = searchParams.get('preset') ?? 'rope';
  const preset = measurementPresetById(requestedPreset) ?? MEASUREMENT_PRESETS[0];

  const [frequency, setFrequency] = useState(preset.defaultFreqHz);
  const [ruler, setRuler] = useState<RulerState>(RULER_DEFAULT);
  const [probePct, setProbePct] = useState(50);
  const [freqUnit, setFreqUnit] = useState<FrequencyUnit>('Hz');
  const [lengthUnit, setLengthUnit] = useState<DistanceUnit>('m');
  const [timer, setTimer] = useState<{ startT: number | null; stopped: number | null }>({
    startT: null,
    stopped: null,
  });
  const [noiseOn, setNoiseOn] = useState(false);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [calcResetKey, setCalcResetKey] = useState(0);
  const [interpretation, setInterpretation] = useState('');
  const [limitations, setLimitations] = useState('');
  const [promptStatus, setPromptStatus] = useState<Record<string, string>>({});

  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const lowGraphics = useSettingsStore((s) => s.lowGraphics);
  const { announce } = useAnnouncer();
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);

  const clock = useSimClock({ running, speed, reducedMotion, active: true });
  const t = clock.t;

  const wave: WaveParams = useMemo(
    () => ({ amplitude: 1, frequency, speed: preset.speedMps }),
    [frequency, preset.speedMps],
  );
  const lambda = wavelengthOf(wave);
  const T = periodOfWave(wave);
  const chamberLen = 4 * (preset.speedMps / preset.defaultFreqHz);
  const probeX = (probePct / 100) * chamberLen;

  /** Seeded measurement noise (±2%) applied to RULER READINGS only — the
   * underlying wave state is never touched (SCIENCE_REVIEW §18). */
  const readSpan = useCallback(
    (exactSpanM: number, r: RulerState): number => {
      if (!noiseOn || exactSpanM === 0) return exactSpanM;
      const rng = createRng(seed + Math.round(r.startPct) * 101 + Math.round(r.endPct));
      return exactSpanM * (1 + rng.noise(0.02));
    },
    [noiseOn, seed],
  );

  const spanExact = ((ruler.endPct - ruler.startPct) / 100) * chamberLen;
  const spanReading = readSpan(spanExact, ruler);

  const changePreset = (id: string) => {
    const next = measurementPresetById(id) ?? MEASUREMENT_PRESETS[0];
    setSearchParams(id === 'rope' ? {} : { preset: id }, { replace: true });
    // Speed range is re-clamped by construction: frequency snaps to the new
    // preset's default, inside its valid range.
    setFrequency(next.defaultFreqHz);
    setRuler(RULER_DEFAULT);
    setTimer({ startT: null, stopped: null });
    announce(`Preset ${next.label}: speed ${formatSigFigs(next.speedMps)} metres per second`);
  };

  const reset = () => {
    if (trials.length > 0) {
      const ok = window.confirm('Reset the lab and clear all recorded trials?');
      if (!ok) return;
    }
    setSearchParams({}, { replace: true });
    setFrequency(MEASUREMENT_PRESETS[0].defaultFreqHz);
    setRuler(RULER_DEFAULT);
    setProbePct(50);
    setFreqUnit('Hz');
    setLengthUnit('m');
    setTimer({ startT: null, stopped: null });
    setNoiseOn(false);
    setSeed(DEFAULT_SEED);
    setTrials([]);
    setRunning(true);
    setSpeed(1);
    setCalcResetKey((k) => k + 1);
    setInterpretation('');
    setLimitations('');
    setPromptStatus({});
    clock.reset();
    announce('Reset to default');
  };

  const toggleTimer = () => {
    if (timer.startT === null) {
      setTimer({ startT: t, stopped: null });
      announce('Timing started.');
    } else if (timer.stopped === null) {
      setTimer({ startT: timer.startT, stopped: t });
      announce(`Timing stopped at ${formatSigFigs(t - timer.startT)} seconds.`);
    } else {
      setTimer({ startT: t, stopped: null });
      announce('Timing restarted.');
    }
  };

  const timerElapsed =
    timer.startT === null ? 0 : (timer.stopped ?? t) - timer.startT;

  const addTrial = () => {
    if (spanReading <= 0) return;
    const trial: Trial = {
      id: crypto.randomUUID(),
      medium: preset.label,
      frequencyHz: frequency,
      wavelengthM: spanReading,
      speedMps: frequency * spanReading, // computed speed f × λ(measured)
    };
    setTrials((prev) => [...prev, trial]);
    announce(
      `Trial added: frequency ${formatSigFigs(frequency)} hertz, measured wavelength ${formatSigFigs(spanReading)} metres.`,
    );
  };

  const savePrompt = (
    key: 'interpretation' | 'limitations',
    text: string,
    outcomeCode: '7.1.6' | '7.1.5',
    kind: string,
  ) => {
    if (text.trim().length === 0) {
      setPromptStatus((s) => ({ ...s, [key]: 'empty' }));
      return;
    }
    addEvidence({ outcomeCode, kind: 'investigation', summary: `${kind}: ${text.trim()}` });
    const current = outcomes[outcomeCode] ?? 'not-attempted';
    setOutcomeLevel(
      outcomeCode,
      trials.length >= 3 ? nextLevelAfterSuccess(current) : nextLevelAfterAttempt(current),
    );
    setPromptStatus((s) => ({ ...s, [key]: 'saved' }));
    announce('Saved as investigation evidence.');
  };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const y0 = h / 2;
      const px = (x: number) => (x / chamberLen) * (w - 24) + 12;
      const dispPx = (d: number) => -d * (h * 0.3);

      // Wave curve.
      ctx.strokeStyle = '#056977';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const N = 180;
      for (let i = 0; i < N; i++) {
        const x = (chamberLen * i) / (N - 1);
        const y = y0 + dispPx(displacement(wave, x, t));
        if (i === 0) ctx.moveTo(px(x), y);
        else ctx.lineTo(px(x), y);
      }
      ctx.stroke();

      // Particles.
      const count = lowGraphics ? 16 : 32;
      ctx.fillStyle = '#056977';
      for (let i = 0; i < count; i++) {
        const eq = (chamberLen * i) / (count - 1);
        ctx.beginPath();
        ctx.arc(px(eq), y0 + dispPx(displacement(wave, eq, t)), 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ruler overlay.
      if (ruler.endPct > ruler.startPct) {
        const x1 = px((ruler.startPct / 100) * chamberLen);
        const x2 = px((ruler.endPct / 100) * chamberLen);
        ctx.strokeStyle = '#8a5a0e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, 14);
        ctx.lineTo(x2, 14);
        ctx.stroke();
        for (const x of [x1, x2]) {
          ctx.beginPath();
          ctx.moveTo(x, 8);
          ctx.lineTo(x, 20);
          ctx.stroke();
        }
      }

      // Probe marker.
      ctx.strokeStyle = '#5b34c9';
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(px(probeX), 6);
      ctx.lineTo(px(probeX), h - 6);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#5b34c9';
      ctx.beginPath();
      ctx.arc(px(probeX), y0 + dispPx(displacement(wave, probeX, t)), 6, 0, Math.PI * 2);
      ctx.fill();
    },
    [wave, t, chamberLen, ruler, probeX, lowGraphics],
  );

  // Synchronised graphs from engine series.
  const dvpSeries = displacementVsPosition(wave, 0, chamberLen, 120, t);
  const dvtWindow = 3 * T;
  const dvtSeries = displacementVsTime(wave, probeX, Math.max(0, t - dvtWindow), Math.max(t, 1e-6), 120);

  const probeDispRaw = displacement(wave, probeX, t);
  // Zero-clamp float noise at the DISPLAY layer only.
  const probeDisp = Math.abs(probeDispRaw) < 1e-9 ? 0 : probeDispRaw;
  const tCoarse = Math.round(t * 4) / 4;

  return (
    <Page
      title="Measurement lab"
      lead="Place a ruler, timer and probe on a travelling wave, record trials, and test λ = v/f for yourself."
    >
      <div className="wave-stage stack">
        <SimToolbar
          running={running}
          onToggleRun={() => setRunning((r) => !r)}
          onStep={clock.step}
          speed={speed}
          onSpeed={setSpeed}
          onReset={reset}
          resetLabel="wave measurement lab"
          presets={MEASUREMENT_PRESETS.map((p) => ({ id: p.id, label: p.label }))}
          presetId={preset.id}
          onPreset={changePreset}
          presetLabel="Measurement preset"
        />

        <p className="wave-stage__readouts">
          <span>
            Elapsed: <output data-testid="sim-time">{formatSigFigs(t)} s</output>
          </span>
          <span>
            Medium speed:{' '}
            <strong data-testid="measure-speed">
              {formatSigFigs(preset.speedMps)} m/s
            </strong>
          </span>
          <span>
            Source frequency:{' '}
            <strong data-testid="measure-frequency">
              {formatWithUnit(fromHertz(frequency, freqUnit), freqUnit)}
            </strong>
          </span>
          <span>
            Model wavelength λ = v/f:{' '}
            <strong data-testid="measure-lambda">
              {formatWithUnit(fromMeters(lambda, lengthUnit), lengthUnit)}
            </strong>
          </span>
          <span>
            Period T = 1/f: <strong>{formatSigFigs(T)} s</strong>
          </span>
        </p>

        <p className="seg-control__note">{preset.note}</p>

        <div className="wave-controls">
          <SimControl
            id="wave-lab.measure-frequency-slider"
            label="Source frequency"
            min={preset.freqRangeHz[0]}
            max={preset.freqRangeHz[1]}
            step={FREQ_STEP[preset.id] ?? 0.1}
            value={frequency}
            onChange={setFrequency}
            format={(v) => `Frequency: ${formatWithUnit(fromHertz(v, freqUnit), freqUnit)}`}
            hint="The source sets frequency; the medium keeps its own speed."
            testId="measure-frequency-slider"
          />
          <SimControl
            id="wave-lab.probe-tool-drag"
            label="Measurement probe position"
            min={0}
            max={100}
            step={1}
            value={probePct}
            onChange={setProbePct}
            format={(v) =>
              `Probe at x = ${formatWithUnit(fromMeters((v / 100) * chamberLen, lengthUnit), lengthUnit)}`
            }
            testId="measure-probe"
          />

          <div className="field">
            <label className="field__label" htmlFor="freq-unit">
              Frequency display unit
            </label>
            <select
              id="freq-unit"
              className="field__unit"
              value={freqUnit}
              onChange={(e) => setFreqUnit(e.target.value as FrequencyUnit)}
              data-testid="freq-unit-select"
              data-control-id="wave-lab.frequency-unit-select"
            >
              {FREQUENCY_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="length-unit">
              Length display unit
            </label>
            <select
              id="length-unit"
              className="field__unit"
              value={lengthUnit}
              onChange={(e) => setLengthUnit(e.target.value as DistanceUnit)}
              data-testid="length-unit-select"
              data-control-id="wave-lab.length-unit-select"
            >
              {DISTANCE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <RulerTool
            ruler={ruler}
            onChange={setRuler}
            chamberLengthM={chamberLen}
            lengthUnit={lengthUnit}
            readSpan={readSpan}
          />

          <div className="field" data-control-id="wave-lab.timer-tool-control">
            <span className="field__label">Timer</span>
            <button type="button" className="btn" onClick={toggleTimer} aria-label="Timer" data-testid="timer-button">
              {timer.startT !== null && timer.stopped === null ? 'Stop timing' : 'Start timing'}
            </button>
            <p className="sim-control__value">
              Elapsed: <output data-testid="timer-elapsed">{formatSigFigs(timerElapsed)} s</output>
            </p>
          </div>

          <div className="seg-control" data-control-id="wave-lab.noise-mode-toggle">
            <span className="seg-control__legend" aria-hidden="true">
              Measurement noise
            </span>
            <div>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={noiseOn}
                  onChange={(e) => setNoiseOn(e.target.checked)}
                  aria-label="Seeded measurement noise"
                  data-testid="noise-toggle"
                />
                Seeded measurement noise (±2% on ruler readings)
              </label>
              <label className="field__label" htmlFor="noise-seed">
                Noise seed
                <input
                  id="noise-seed"
                  className="field__input"
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(Number(e.target.value) || DEFAULT_SEED)}
                  disabled={!noiseOn}
                  data-testid="noise-seed"
                />
              </label>
              <p className="seg-control__note">
                Same seed ⇒ same readings. Noise touches measurements only —
                never the wave itself.
              </p>
            </div>
          </div>
        </div>

        <CanvasScene
          label="A travelling wave with a ruler overlay along the top and a probe line"
          height={180}
          frameKey={`${t}|${preset.id}|${frequency}|${probePct}|${ruler.startPct}|${ruler.endPct}|${lowGraphics}`}
          draw={draw}
          alternative={
            <p>
              {preset.label}: wave moving at {formatSigFigs(preset.speedMps)} m/s
              with source frequency{' '}
              {formatWithUnit(fromHertz(frequency, freqUnit), freqUnit)} (t ={' '}
              {formatSigFigs(tCoarse)} s). Model wavelength λ = v/f ={' '}
              {formatWithUnit(fromMeters(lambda, lengthUnit), lengthUnit)}. Probe
              at {formatWithUnit(fromMeters(probeX, lengthUnit), lengthUnit)}{' '}
              reads displacement {formatSigFigs(probeDisp)} (relative). Ruler
              span:{' '}
              {formatWithUnit(fromMeters(spanReading, lengthUnit), lengthUnit)}.
            </p>
          }
          testId="measure-canvas"
        />

        <div className="wave-controls">
          <LineGraph
            title="Displacement–position snapshot (read λ here)"
            xLabel="position (m)"
            yLabel="displacement (relative)"
            series={[{ label: 'Snapshot now', points: dvpSeries }]}
            yDomain={[-1.2, 1.2]}
            height={240}
            testId="graph-dvp"
          />
          <LineGraph
            title="Displacement–time at the probe (read T here)"
            xLabel="time (s)"
            yLabel="displacement (relative)"
            series={[{ label: 'Probe history', points: dvtSeries }]}
            yDomain={[-1.2, 1.2]}
            height={240}
            testId="graph-dvt"
          />
        </div>

        <div className="seg-control__options">
          <button
            type="button"
            className="btn btn--primary"
            onClick={addTrial}
            disabled={spanReading <= 0}
            aria-disabled={spanReading <= 0}
            aria-describedby="add-trial-hint"
            data-testid="add-trial"
            data-control-id="wave-lab.add-trial-button"
          >
            Add measurement to trial table
          </button>
          <span id="add-trial-hint" className="seg-control__note">
            {spanReading <= 0
              ? 'Measure a wavelength with the ruler first (stretch it crest to crest).'
              : `Will record f = ${formatSigFigs(frequency)} Hz with your measured λ = ${formatSigFigs(spanReading)} m.`}
          </span>
        </div>

        <TrialResults
          trials={trials}
          onDelete={(id) => setTrials((prev) => prev.filter((t2) => t2.id !== id))}
          fixedSpeedMps={preset.speedMps}
          presetLabel={preset.label}
        />

        <LambdaCalculator resetKey={calcResetKey} />

        <div className="card stack" data-control-id="wave-lab.investigation-prompts">
          <h2>Interpret your investigation</h2>
          <p>
            Keep the medium (speed) fixed and change only the frequency — that
            is your controlled-variable fair test.
          </p>
          <label className="notice-capture__label">
            What does your λ vs 1/f graph show about the relationship?
            <textarea
              className="notice-capture__input"
              rows={3}
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              data-testid="interpretation-input"
            />
          </label>
          <div className="seg-control__options">
            <button
              type="button"
              className="btn"
              onClick={() => savePrompt('interpretation', interpretation, '7.1.6', 'Graph interpretation')}
              data-testid="interpretation-save"
            >
              Save interpretation as evidence
            </button>
            {promptStatus.interpretation === 'saved' ? (
              <p className="notice-capture__status" role="status">
                <span aria-hidden="true">✓</span> Saved (outcome 7.1.6).
              </p>
            ) : null}
            {promptStatus.interpretation === 'empty' ? (
              <p className="notice-capture__status notice-capture__status--warn" role="status">
                Write your interpretation before saving.
              </p>
            ) : null}
          </div>

          <label className="notice-capture__label">
            What are the limitations of this virtual investigation?
            <textarea
              className="notice-capture__input"
              rows={3}
              value={limitations}
              onChange={(e) => setLimitations(e.target.value)}
              data-testid="limitations-input"
            />
          </label>
          <div className="seg-control__options">
            <button
              type="button"
              className="btn"
              onClick={() => savePrompt('limitations', limitations, '7.1.5', 'Limitation reflection')}
              data-testid="limitations-save"
            >
              Save limitations as evidence
            </button>
            {promptStatus.limitations === 'saved' ? (
              <p className="notice-capture__status" role="status">
                <span aria-hidden="true">✓</span> Saved (outcome 7.1.5).
              </p>
            ) : null}
            {promptStatus.limitations === 'empty' ? (
              <p className="notice-capture__status notice-capture__status--warn" role="status">
                Write at least one limitation before saving.
              </p>
            ) : null}
          </div>
        </div>

        <p className="notice">
          <span>This virtual investigation does <strong>not</strong> replace
          supervised hands-on practical work. Model: uniform, lossless,
          non-dispersive medium; the vertical displacement scale is relative
          (exaggerated for visibility). Speeds:{' '}
          {preset.medium.modelled
            ? 'modelled teaching value, not a measured constant.'
            : `${preset.medium.source} (reviewed ${preset.medium.reviewDate}).`}</span>
        </p>
      </div>
    </Page>
  );
}
