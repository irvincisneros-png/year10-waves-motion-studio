import { useCallback, useEffect, useMemo, useState } from 'react';
import { Page } from '../../components/Page';
import { CanvasScene } from '../../components/sim/CanvasScene';
import { SimControl } from '../../components/sim/SimControl';
import { SimToolbar } from '../../components/sim/SimToolbar';
import { NoticeCapture } from '../../components/sim/NoticeCapture';
import { LineGraph } from '../../components/graphs/LineGraph';
import { useSimClock } from '../../components/sim/useSimClock';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useSettingsStore } from '../../store/settingsStore';
import { formatSigFigs } from '../../science/units';
import {
  DOPPLER_PRESETS,
  dopplerPresetById,
  detectedFrequencySeries,
  detectedFrequencyClosedForm,
  wavefrontEdges,
  sourcePosition,
  observerPosition,
  type DopplerConfig,
} from '../../science/doppler';
import { SOUND_SPEED_AIR_20C } from '../../science/sound';
import { AudioEnablePanel } from './AudioEnablePanel';
import { useToneAudio } from './useToneAudio';

/**
 * Doppler effect (outcome 7.2.3): a 1D arrival-timing simulation. Emitted
 * wavefronts, a moving source and observer, preset motions, a detected-
 * frequency-vs-time graph, and an OPTIONAL pitch that tracks the detected
 * frequency (same audio safety gate). The source-frequency readout visibly does
 * NOT change while the detected-frequency readout does — the whole point of the
 * misconception fix (SCIENCE_REVIEW §12.3, §21.5).
 */

const SOUND_SPEED = SOUND_SPEED_AIR_20C; // 343 m/s
const SOURCE_FREQ = 500; // Hz (fixed source note)
const WINDOW_S = 2.5; // real seconds simulated
const PLAYBACK = 0.35; // slow-motion replay so wavefronts are watchable
const VIEW_MIN = -20;
const VIEW_MAX = 120;

function detectedNearest(series: { at: number; value: number }[], t: number): number | null {
  if (series.length === 0) return null;
  let best = series[0];
  for (const s of series) if (Math.abs(s.at - t) < Math.abs(best.at - t)) best = s;
  return best.value;
}

export default function DopplerPage() {
  const [presetId, setPresetId] = useState('stationary');
  const [sourceVel, setSourceVel] = useState(0);
  const [observerVel, setObserverVel] = useState(0);
  const [viewMode, setViewMode] = useState<'1d' | '2d'>('1d');
  const [pitchAudio, setPitchAudio] = useState(false);
  const [visualOnly, setVisualOnly] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);

  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const lowGraphics = useSettingsStore((s) => s.lowGraphics);
  const { announce } = useAnnouncer();
  const audio = useToneAudio();

  const clock = useSimClock({ running, speed, reducedMotion, active: true });
  const tSlow = Math.min(clock.t * PLAYBACK, WINDOW_S);

  const cfg: DopplerConfig = useMemo(
    () => ({
      sourceFreqHz: SOURCE_FREQ,
      soundSpeedMps: SOUND_SPEED,
      sourceVelMps: sourceVel,
      observerVelMps: observerVel,
    }),
    [sourceVel, observerVel],
  );

  const series = useMemo(() => detectedFrequencySeries(cfg, WINDOW_S), [cfg]);
  const detectedNow = detectedNearest(series, tSlow);
  const closed = detectedFrequencyClosedForm(cfg);
  const steadyDetected = closed.ok ? closed.value : null;

  // Optional pitch: track the detected frequency (gated behind enable-sound).
  useEffect(() => {
    if (pitchAudio && audio.phase === 'enabled' && detectedNow !== null) {
      audio.setFrequency(detectedNow);
    }
  }, [pitchAudio, audio, detectedNow]);
  useEffect(() => {
    // Muting is the only thing that makes the optional pitch audible.
    if (audio.phase === 'enabled') audio.setMuted(!pitchAudio);
  }, [pitchAudio, audio]);

  const applyPreset = (id: string) => {
    const preset = dopplerPresetById(id);
    if (!preset) return;
    setPresetId(id);
    setSourceVel(preset.sourceVelMps);
    setObserverVel(preset.observerVelMps);
    clock.reset();
    announce(`${preset.label}. ${preset.summary}`);
  };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const px = (x: number) => ((x - VIEW_MIN) / (VIEW_MAX - VIEW_MIN)) * (w - 20) + 10;
      const sx = sourcePosition(cfg, tSlow);
      const ox = observerPosition(cfg, tSlow);
      const fronts = wavefrontEdges(cfg, tSlow, lowGraphics ? 12 : 24);

      if (viewMode === '1d') {
        const axisY = h * 0.55;
        ctx.strokeStyle = '#ddd5c8';
        ctx.beginPath();
        ctx.moveTo(10, axisY);
        ctx.lineTo(w - 10, axisY);
        ctx.stroke();

        // Wavefront edges as vertical ticks (crest positions).
        ctx.strokeStyle = '#b9d8dd';
        ctx.lineWidth = 1.5;
        for (const f of fronts) {
          for (const edge of [f.left, f.right]) {
            if (edge < VIEW_MIN || edge > VIEW_MAX) continue;
            ctx.beginPath();
            ctx.moveTo(px(edge), axisY - 22);
            ctx.lineTo(px(edge), axisY + 22);
            ctx.stroke();
          }
        }

        // Source (violet square) + observer (cyan ear).
        ctx.fillStyle = '#5b34c9';
        ctx.fillRect(px(sx) - 7, axisY - 7, 14, 14);
        ctx.fillStyle = '#5b34c9';
        ctx.font = '11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('source', px(sx), axisY - 14);

        ctx.fillStyle = '#056977';
        ctx.beginPath();
        ctx.arc(px(ox), axisY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText('observer', px(ox), axisY + 24);
      } else {
        // 2D extension: concentric circles from where the source emitted them.
        const cy = h / 2;
        for (const f of fronts) {
          const r = ((SOUND_SPEED * (tSlow - f.emittedAt)) / (VIEW_MAX - VIEW_MIN)) * (w - 20);
          if (r <= 0) continue;
          ctx.strokeStyle = '#b9d8dd';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px(f.emittedFrom), cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = '#5b34c9';
        ctx.fillRect(px(sx) - 7, cy - 7, 14, 14);
        ctx.fillStyle = '#056977';
        ctx.beginPath();
        ctx.arc(px(ox), cy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#2f3646';
        ctx.fillText('source', px(sx), cy - 14);
        ctx.fillText('observer', px(ox), cy + 24);
      }
    },
    [cfg, tSlow, viewMode, lowGraphics],
  );

  const reset = () => {
    setPresetId('stationary');
    setSourceVel(0);
    setObserverVel(0);
    setViewMode('1d');
    setPitchAudio(false);
    setRunning(true);
    setSpeed(1);
    clock.reset();
    if (audio.phase === 'enabled') audio.setMuted(true);
    announce('Reset to default.');
  };

  const preset = dopplerPresetById(presetId);
  const detectedGraph = series.map((s) => ({ at: s.at, value: s.value }));
  const sourceLine = [
    { at: 0, value: SOURCE_FREQ },
    { at: WINDOW_S, value: SOURCE_FREQ },
  ];
  const dirWord = (v: number) => (v > 0 ? 'moving right' : v < 0 ? 'moving left' : 'stationary');

  return (
    <Page
      title="Doppler effect"
      lead="Watch wavefronts bunch and stretch as a source moves. The source frequency never changes — only the timing of the wavefronts reaching the observer does."
    >
      <div className="wave-stage stack">
        <SimToolbar
          running={running}
          onToggleRun={() => setRunning((r) => !r)}
          onStep={clock.step}
          speed={speed}
          onSpeed={setSpeed}
          onReset={reset}
          resetLabel="Doppler simulation"
          presets={DOPPLER_PRESETS.map((p) => ({ id: p.id, label: p.label }))}
          presetId={presetId}
          onPreset={applyPreset}
          presetLabel="Doppler scenario preset"
        />

        <p className="doppler-readouts">
          <span>
            Source frequency:{' '}
            <strong data-testid="source-frequency">{formatSigFigs(SOURCE_FREQ)} Hz</strong>{' '}
            <span className="fixed-badge">fixed — never changes</span>
          </span>
          <span>
            Detected frequency now:{' '}
            <strong data-testid="detected-frequency">
              {detectedNow !== null ? `${formatSigFigs(detectedNow)} Hz` : '—'}
            </strong>
          </span>
          <span>
            Steady-state detected:{' '}
            <strong data-testid="steady-detected">
              {steadyDetected !== null ? `${formatSigFigs(steadyDetected)} Hz` : '—'}
            </strong>
          </span>
        </p>

        <div className="wave-controls">
          <SimControl
            id="sound-lab.doppler-source-velocity-slider"
            label="Source velocity"
            min={-120}
            max={120}
            step={1}
            value={sourceVel}
            onChange={(v) => {
              setSourceVel(v);
              setPresetId('custom');
            }}
            format={(v) => `Source: ${v >= 0 ? '+' : ''}${formatSigFigs(v)} m/s (${dirWord(v)})`}
            hint="Subsonic only — sonic booms are out of scope."
            testId="source-velocity-slider"
          />
          <SimControl
            id="sound-lab.doppler-observer-velocity-slider"
            label="Observer velocity"
            min={-120}
            max={120}
            step={1}
            value={observerVel}
            onChange={(v) => {
              setObserverVel(v);
              setPresetId('custom');
            }}
            format={(v) => `Observer: ${v >= 0 ? '+' : ''}${formatSigFigs(v)} m/s (${dirWord(v)})`}
            hint="The observer starts to the right of the source."
            testId="observer-velocity-slider"
          />

          <fieldset className="seg-control" data-control-id="sound-lab.doppler-view-mode-toggle">
            <legend className="seg-control__legend">View dimension</legend>
            <div className="seg-control__options" role="radiogroup" aria-label="View dimension">
              {(
                [
                  ['1d', '1D track'],
                  ['2d', '2D (extension)'],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="seg-control__option">
                  <input
                    type="radio"
                    name="view-mode"
                    checked={viewMode === value}
                    onChange={() => setViewMode(value)}
                    data-testid={`view-${value}`}
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="seg-control__note">
              {viewMode === '2d'
                ? 'Extension view — exactly the same physics as the 1D model, drawn as expanding circles.'
                : 'The required 1D wavefront view.'}
            </p>
          </fieldset>
        </div>

        <CanvasScene
          label="A source and an observer on a track, with wavefronts bunching ahead of an approaching source and stretching behind a receding one"
          height={200}
          frameKey={`${tSlow}|${sourceVel}|${observerVel}|${viewMode}|${lowGraphics}`}
          draw={draw}
          alternative={
            <p data-testid="doppler-alt">
              Source at {formatSigFigs(sourcePosition(cfg, tSlow))} m ({dirWord(sourceVel)} at{' '}
              {formatSigFigs(Math.abs(sourceVel))} m/s); observer at{' '}
              {formatSigFigs(observerPosition(cfg, tSlow))} m ({dirWord(observerVel)}). The source
              still emits {formatSigFigs(SOURCE_FREQ)} Hz; the observer currently detects{' '}
              {detectedNow !== null ? `${formatSigFigs(detectedNow)} Hz` : 'the source frequency'}.
            </p>
          }
          testId="doppler-canvas"
        />

        <LineGraph
          title="Detected frequency vs time (the source frequency stays flat)"
          xLabel="time (s)"
          yLabel="frequency (Hz)"
          series={[
            { label: 'Detected frequency', points: detectedGraph, mode: 'line', colour: 'var(--accent-cyan-ink)' },
            { label: 'Source frequency (unchanged)', points: sourceLine, mode: 'line', colour: 'var(--accent-violet-ink)' },
          ]}
          height={240}
          testId="detected-graph"
        />

        <AudioEnablePanel
          audio={audio}
          acknowledged={acknowledged}
          onAcknowledge={() => setAcknowledged(true)}
          visualOnly={visualOnly}
          onVisualOnly={setVisualOnly}
          level={pitchAudio ? 0.2 : 0}
        />
        <label className="check-row" data-control-id="sound-lab.doppler-pitch-audio-toggle">
          <input
            type="checkbox"
            checked={pitchAudio}
            disabled={audio.phase !== 'enabled'}
            aria-disabled={audio.phase !== 'enabled'}
            onChange={(e) => setPitchAudio(e.target.checked)}
            data-testid="pitch-audio-toggle"
          />
          Play the detected pitch (needs sound enabled) — the detected-frequency graph is always the visual equivalent
        </label>

        <div className="card stack">
          <h2>Why does the pitch change?</h2>
          <p>
            {preset ? preset.summary : 'Set the velocities to design your own scenario.'} As the
            source moves, wavefronts <strong>bunch up ahead of it</strong> (they arrive more often,
            so the detected pitch is higher) and <strong>stretch out behind it</strong> (they arrive
            less often, so the detected pitch is lower). The siren itself keeps emitting the same
            note the whole time.
          </p>
        </div>

        <NoticeCapture
          controlId="sound-lab.doppler-notice-input"
          outcomeCode="7.2.3"
          label="Explain, using wavefront arrival timing, why the detected pitch is higher while the source approaches."
          evidenceKind="Doppler arrival-timing explanation"
          testId="doppler-notice"
        />

        <p className="notice notice--warn">
          <span>
            Model note: this is a one-dimensional, subsonic arrival-timing model. The wave speed
            relative to the air is fixed at {formatSigFigs(SOUND_SPEED)} m/s and the source
            frequency is fixed at {formatSigFigs(SOURCE_FREQ)} Hz. Sonic booms and supersonic
            shock waves are out of scope. The animation is a slow-motion replay.
          </span>
        </p>
      </div>
    </Page>
  );
}
