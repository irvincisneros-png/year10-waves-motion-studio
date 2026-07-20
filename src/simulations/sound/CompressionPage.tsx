import { useCallback, useMemo, useState } from 'react';
import { Page } from '../../components/Page';
import { CanvasScene } from '../../components/sim/CanvasScene';
import { SimControl } from '../../components/sim/SimControl';
import { SimToolbar } from '../../components/sim/SimToolbar';
import { NoticeCapture } from '../../components/sim/NoticeCapture';
import { LineGraph } from '../../components/graphs/LineGraph';
import { useSimClock } from '../../components/sim/useSimClock';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useSettingsStore } from '../../store/settingsStore';
import { displacement, periodOfWave, wavelengthOf, netDisplacementOverCycles, type WaveParams } from '../../science/waves';
import {
  pressureAt,
  pressureVsTime,
  bandAt,
  longitudinalParticles,
  SOUND_MEDIUM_PRESETS,
  soundMediumById,
} from '../../science/sound';
import { formatSigFigs } from '../../science/units';

/**
 * Compression and rarefaction (outcome 7.2.1): FOUR linked representations of
 * ONE engine state (app plan §6.1):
 *  1. the vibrating source,
 *  2. the air-particle displacement field (with taggable particles),
 *  3. the compression / rarefaction pressure bands,
 *  4. the pressure-versus-time trace at a movable microphone.
 * Everything is driven by a single sound wave evaluated at a slow-motion replay
 * time so the pattern is watchable at audible frequencies (labelled a model).
 * A travelling energy marker is distinct from the particles; a tagged-particle
 * net-displacement check mirrors Stage 2's invariant 20.2.
 */

// Slow-motion replay factor: audible periods are milliseconds, so we replay the
// real physics slowly to make compressions visible. Labelled in the honesty box.
const PLAYBACK = 0.004;
// A fixed physical window: changing frequency or medium changes how many
// wavelengths fit inside it instead of silently rescaling the chamber.
const VIEW_SPAN_M = (4 * 343) / 440;

const TAGGABLE = [0.15, 0.4, 0.65, 0.9] as const; // fractions of the view span

export default function CompressionPage() {
  const [frequency, setFrequency] = useState(440);
  const [mediumId, setMediumId] = useState('air-20');
  const [tagged, setTagged] = useState<Set<number>>(new Set([0.4]));
  const [energyMarker, setEnergyMarker] = useState(true);
  const [micPct, setMicPct] = useState(50);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);

  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const lowGraphics = useSettingsStore((s) => s.lowGraphics);
  const { announce } = useAnnouncer();

  const medium = soundMediumById(mediumId) ?? SOUND_MEDIUM_PRESETS[0];

  const clock = useSimClock({ running, speed, reducedMotion, active: true });
  const tSlow = clock.t * PLAYBACK;

  const wave: WaveParams = useMemo(
    () => ({ amplitude: 1, frequency, speed: medium.speedMps }),
    [frequency, medium.speedMps],
  );
  const lambda = wavelengthOf(wave);
  const T = periodOfWave(wave);
  const viewSpan = VIEW_SPAN_M;
  const wavelengthsInView = viewSpan / lambda;
  const micX = (micPct / 100) * viewSpan;

  const particleCount = lowGraphics ? 40 : 80;

  // ---- Representation 1: the vibrating source (displacement at x = 0). ----
  const drawSource = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const d = displacement(wave, 0, tSlow); // −1..+1
      // A loudspeaker cone that pushes right (compression) and pulls left.
      ctx.fillStyle = '#545c6e';
      ctx.fillRect(cx - 24 + d * 16, cy - 26, 8, 52);
      ctx.strokeStyle = '#056977';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 16 + d * 16, cy - 26);
      ctx.lineTo(cx + 20 + d * 16, cy - 12);
      ctx.lineTo(cx + 20 + d * 16, cy + 12);
      ctx.lineTo(cx - 16 + d * 16, cy + 26);
      ctx.stroke();
      ctx.fillStyle = '#8a5a0e';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d >= 0 ? 'pushing → (compression)' : 'pulling ← (rarefaction)', cx, h - 8);
    },
    [wave, tSlow],
  );

  // ---- Representations 2 + 3: particle field + pressure bands + mic. ----
  const drawField = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const y0 = h / 2;
      const px = (x: number) => (x / viewSpan) * (w - 24) + 12;

      // Pressure bands (rep 3): faint vertical shading + C/R letters (never
      // colour-only — letters carry the meaning).
      const bandSamples = 60;
      for (let i = 0; i < bandSamples; i++) {
        const x = (viewSpan * i) / bandSamples;
        const p = pressureAt(wave, x, tSlow);
        const alpha = Math.min(0.28, Math.abs(p) * 0.28);
        ctx.fillStyle = p > 0 ? `rgba(5,105,119,${alpha})` : `rgba(138,90,14,${alpha})`;
        ctx.fillRect(px(x), 6, (w - 24) / bandSamples + 1, h - 12);
      }

      // Air particles (rep 2): longitudinal positions (bunching = compression).
      const equilibria = Array.from({ length: particleCount }, (_, i) => (viewSpan * i) / (particleCount - 1));
      const displayScale = Math.min(lambda * 0.09, viewSpan * 0.02);
      const parts = longitudinalParticles(wave, equilibria, tSlow, displayScale);
      ctx.fillStyle = '#2f3646';
      for (const p of parts) {
        ctx.beginPath();
        ctx.arc(px(p.position), y0, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tagged particles: violet ring + home marker + letter.
      TAGGABLE.forEach((frac, idx) => {
        if (!tagged.has(frac)) return;
        const eq = frac * viewSpan;
        const d = displacement(wave, eq, tSlow);
        const displayScale = Math.min(lambda * 0.09, viewSpan * 0.02);
        const x = px(eq + d * displayScale);
        ctx.strokeStyle = '#5b34c9';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y0, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#b9b0a0';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(px(eq), y0 - 12);
        ctx.lineTo(px(eq), y0 + 12);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#5b34c9';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String.fromCharCode(80 + idx), x, y0 - 14); // P, Q, R, S
      });

      // Compression / rarefaction band labels at pressure extrema in view.
      ctx.font = 'bold 12px system-ui, sans-serif';
      for (let i = 0; i < bandSamples; i++) {
        const x = (viewSpan * i) / bandSamples;
        const band = bandAt(wave, x, tSlow, 0.92);
        if (band === 'compression') {
          ctx.fillStyle = '#056977';
          ctx.fillText('C', px(x), 20);
        } else if (band === 'rarefaction') {
          ctx.fillStyle = '#8a5a0e';
          ctx.fillText('R', px(x), h - 8);
        }
      }

      // Energy marker (distinct diamond, never a particle).
      if (energyMarker) {
        const pos = (medium.speedMps * tSlow) % viewSpan;
        const mx = px(pos);
        ctx.fillStyle = '#8a5a0e';
        ctx.beginPath();
        ctx.moveTo(mx, 6);
        ctx.lineTo(mx + 7, 14);
        ctx.lineTo(mx, 22);
        ctx.lineTo(mx - 7, 14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#8a5a0e';
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('energy →', mx + 10, 16);
      }

      // Microphone marker (rep 4 sample position).
      const mxMic = px(micX);
      ctx.strokeStyle = '#5b34c9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mxMic, 6);
      ctx.lineTo(mxMic, h - 6);
      ctx.stroke();
      ctx.fillStyle = '#5b34c9';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎤', mxMic, h - 6);
    },
    [wave, tSlow, viewSpan, lambda, tagged, energyMarker, micX, particleCount, medium.speedMps],
  );

  // ---- Representation 4: pressure-vs-time at the microphone. ----
  const traceWindow = 3 * T;
  const traceStart = Math.max(0, tSlow - traceWindow);
  const pressureTrace = pressureVsTime(wave, micX, traceStart, Math.max(tSlow, 1e-9), 160).map((s) => ({
    at: (s.at - traceStart) * 1000, // ms within the window
    value: s.value,
  }));

  const micPressure = pressureAt(wave, micX, tSlow);
  const micBand = bandAt(wave, micX, tSlow);

  const toggleTag = (frac: number) => {
    setTagged((prev) => {
      const next = new Set(prev);
      if (next.has(frac)) next.delete(frac);
      else next.add(frac);
      return next;
    });
  };

  const reset = () => {
    setFrequency(440);
    setMediumId('air-20');
    setTagged(new Set([0.4]));
    setEnergyMarker(true);
    setMicPct(50);
    setRunning(true);
    setSpeed(1);
    clock.reset();
    announce('Reset to default');
  };

  const tCoarse = Math.round(clock.t * 4) / 4;

  return (
    <Page
      title="Compression & rarefaction"
      lead="One sound wave, four linked views: the vibrating source, the air particles, the pressure bands, and the pressure a microphone records over time."
    >
      <div className="wave-stage stack">
        <SimToolbar
          running={running}
          onToggleRun={() => setRunning((r) => !r)}
          onStep={clock.step}
          speed={speed}
          onSpeed={setSpeed}
          onReset={reset}
          resetLabel="compression view"
        />

        <p className="wave-stage__readouts">
          <span>
            Elapsed (replay): <output data-testid="sim-time">{formatSigFigs(tCoarse)} s</output>
          </span>
          <span>
            Speed of sound:{' '}
            <strong data-testid="sound-speed">{formatSigFigs(medium.speedMps)} m/s</strong>
          </span>
          <span>
            Frequency: <strong data-testid="sound-frequency">{formatSigFigs(frequency)} Hz</strong>
          </span>
          <span>
            Wavelength λ = v/f: <strong data-testid="sound-wavelength">{formatSigFigs(lambda)} m</strong>
          </span>
          <span>
            Period T = 1/f: <strong>{formatSigFigs(T * 1000)} ms</strong>
          </span>
        </p>

        <div className="wave-controls">
          <SimControl
            id="sound-lab.source-vibration-slider"
            label="Source vibration frequency"
            min={20}
            max={2000}
            step={10}
            value={frequency}
            onChange={setFrequency}
            format={(v) => `Frequency: ${formatSigFigs(v)} Hz`}
            hint="Higher frequency ⇒ more compressions packed into the same distance."
            testId="source-vibration-slider"
          />

          <div className="field">
            <label className="field__label" htmlFor="sound-medium">
              Medium and temperature
            </label>
            <select
              id="sound-medium"
              className="field__unit"
              value={mediumId}
              onChange={(e) => {
                setMediumId(e.target.value);
                const m = soundMediumById(e.target.value);
                if (m) announce(`${m.label}: ${formatSigFigs(m.speedMps)} metres per second`);
              }}
              data-testid="medium-temp-select"
              data-control-id="sound-lab.medium-temperature-preset-select"
            >
              {SOUND_MEDIUM_PRESETS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} — {formatSigFigs(m.speedMps)} m/s
                </option>
              ))}
            </select>
            <p className="seg-control__note" data-testid="medium-source-note">
              {medium.modelled ? 'Modelled from v = 331.3·√(1 + T/273.15). ' : ''}
              {medium.source} (reviewed {medium.reviewDate}).
            </p>
          </div>

          <SimControl
            id="sound-lab.microphone-probe"
            label="Microphone position"
            min={0}
            max={100}
            step={1}
            value={micPct}
            onChange={setMicPct}
            format={(v) => `Microphone at x = ${formatSigFigs((v / 100) * viewSpan)} m`}
            hint="Move the microphone to sample the pressure trace at a different point."
            testId="microphone-probe"
          />

          <div className="seg-control">
            <span className="seg-control__legend" aria-hidden="true">
              Overlays
            </span>
            <div>
              <label className="check-row" data-control-id="sound-lab.energy-marker-toggle">
                <input
                  type="checkbox"
                  checked={energyMarker}
                  onChange={(e) => setEnergyMarker(e.target.checked)}
                  aria-label="Show energy marker"
                  data-testid="energy-marker-toggle"
                />
                Show energy marker
              </label>
              <p className="seg-control__note">Energy travels; the air particles do not.</p>
            </div>
          </div>

          <div className="seg-control" data-control-id="sound-lab.tag-particles-toggle">
            <span className="seg-control__legend" aria-hidden="true">
              Tag particles to track their motion
            </span>
            <div>
              {TAGGABLE.map((frac, idx) => (
                <label key={frac} className="check-row">
                  <input
                    type="checkbox"
                    checked={tagged.has(frac)}
                    onChange={() => toggleTag(frac)}
                    aria-label={`Tag particle ${String.fromCharCode(80 + idx)}`}
                    data-testid={`tag-${String.fromCharCode(80 + idx)}`}
                  />
                  Particle {String.fromCharCode(80 + idx)}
                </label>
              ))}
              <p className="seg-control__note">
                Tagged particles oscillate about a fixed point — they do not travel with the wave.
              </p>
            </div>
          </div>
        </div>

        <div className="linked-reps">
          <div className="rep-panel">
            <span className="rep-panel__label">1 · Vibrating source</span>
            <CanvasScene
              label="A loudspeaker cone pushing forward to make a compression and pulling back to make a rarefaction"
              height={110}
              frameKey={`${tSlow}|${frequency}|${mediumId}|${lowGraphics}`}
              draw={drawSource}
              alternative={
                <p data-testid="source-alt">
                  The source vibrates at {formatSigFigs(frequency)} Hz. Right now it is{' '}
                  {displacement(wave, 0, tSlow) >= 0 ? 'pushing forward (making a compression)' : 'pulling back (making a rarefaction)'}.
                </p>
              }
              testId="source-canvas"
            />
          </div>

          <div className="rep-panel">
            <span className="rep-panel__label">2 + 3 · Air particles and pressure bands</span>
            <CanvasScene
              label="A strip of air particles bunching into compressions (marked C, higher pressure) and spreading into rarefactions (marked R, lower pressure), with a microphone marker"
              height={150}
              frameKey={`${tSlow}|${frequency}|${mediumId}|${[...tagged].join()}|${energyMarker}|${micPct}|${lowGraphics}`}
              draw={drawField}
              alternative={
                <p data-testid="field-alt">
                  A fixed {formatSigFigs(viewSpan)} m window shows{' '}
                  {formatSigFigs(wavelengthsInView)} wavelengths (λ = {formatSigFigs(lambda)} m).{' '}
                  Particles bunch into compressions (C, high
                  pressure) and spread into rarefactions (R, low pressure). The microphone at
                  x = {formatSigFigs(micX)} m currently sits in a{' '}
                  {micBand === 'neutral' ? 'transition (near rest pressure)' : micBand} region.{' '}
                  The energy marker is {energyMarker ? 'shown as a labelled diamond' : 'hidden'};
                  it is never an air particle.
                </p>
              }
              testId="field-canvas"
            />
          </div>

          <div className="rep-panel">
            <span className="rep-panel__label">4 · Pressure at the microphone (over time)</span>
            <LineGraph
              title={`Pressure vs time at the microphone (period T = ${formatSigFigs(T * 1000)} ms)`}
              xLabel="time (ms)"
              yLabel="pressure (relative)"
              series={[{ label: 'Microphone pressure', points: pressureTrace }]}
              yDomain={[-1.2, 1.2]}
              height={220}
              testId="pressure-trace"
            />
            <p className="wave-stage__readouts">
              <span data-testid="mic-pressure-readout">
                Microphone pressure now:{' '}
                <strong>
                  {micPressure >= 0 ? '+' : '−'}
                  {formatSigFigs(Math.abs(micPressure))} (relative)
                </strong>{' '}
                — {micBand === 'neutral' ? 'near rest pressure' : micBand}
              </span>
            </p>
          </div>
        </div>

        <div className="card stack">
          <h2>Tagged-particle check: does the air travel to your ear?</h2>
          <div className="data-table-wrap">
            <table className="data-table" data-control-id="sound-lab.tagged-particle-table">
              <caption>Each tagged air particle after 5 whole cycles</caption>
              <thead>
                <tr>
                  <th scope="col">Particle</th>
                  <th scope="col">Home position (m)</th>
                  <th scope="col">Displacement now (relative units)</th>
                  <th scope="col">Net displacement after 5 cycles (relative units)</th>
                </tr>
              </thead>
              <tbody data-testid="tagged-table-body">
                {TAGGABLE.filter((f) => tagged.has(f)).map((frac) => {
                  const idx = TAGGABLE.indexOf(frac);
                  const letter = String.fromCharCode(80 + idx);
                  const eq = frac * viewSpan;
                  const dRaw = displacement(wave, eq, tSlow);
                  const d = Math.abs(dRaw) < 1e-9 ? 0 : dRaw;
                  const net = Math.abs(netDisplacementOverCycles(wave, eq, 5));
                  const netClamped = net < 1e-9 ? 0 : net;
                  return (
                    <tr key={frac}>
                      <th scope="row">Particle {letter}</th>
                      <td>{formatSigFigs(eq)}</td>
                      <td>{formatSigFigs(Math.round(d * 1000) / 1000)}</td>
                      <td data-testid={`net-${letter}`}>
                        {formatSigFigs(netClamped)} ≈ 0
                      </td>
                    </tr>
                  );
                })}
                {tagged.size === 0 ? (
                  <tr>
                    <td colSpan={4}>No particles tagged — tick at least one above.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <p className="notice">
            <span>
              Every tagged particle returns to its home position (net displacement ≈ 0): the air
              does <strong>not</strong> travel from the source to your ear. Only the
              compression–rarefaction <strong>pattern</strong> and its energy move forward.
            </span>
          </p>
        </div>

        <NoticeCapture
          controlId="sound-lab.compression-notice-input"
          outcomeCode="7.2.1"
          label="What do you notice? Relate the pressure bands (C and R) to the shape of the microphone trace."
          evidenceKind="Compression/rarefaction observation"
          testId="compression-notice"
        />

        <p className="notice notice--warn">
          <span>
            Model note: audible sound vibrates hundreds of times a second, so this view is a{' '}
            <strong>slow-motion replay</strong> (about {formatSigFigs(1 / PLAYBACK)}× slower than
            real time) to make the compressions visible. The chamber is a fixed{' '}
            {formatSigFigs(VIEW_SPAN_M)} m wide; particle movement is display-exaggerated. Pressure
            and displacement are relative model values, not calibrated pascals or measured metres.
          </span>
        </p>
      </div>
    </Page>
  );
}
