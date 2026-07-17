import { useCallback, useEffect, useMemo, useState } from 'react';
import { Page } from '../../components/Page';
import { CanvasScene } from '../../components/sim/CanvasScene';
import { SimToolbar } from '../../components/sim/SimToolbar';
import { NoticeCapture } from '../../components/sim/NoticeCapture';
import { useSimClock } from '../../components/sim/useSimClock';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useSettingsStore } from '../../store/settingsStore';
import { pulseDisplacement, pulseHasExited } from '../../science/pulse';
import { formatSigFigs } from '../../science/units';

/**
 * Energy transfer without net particle transfer (outcome 7.1.2).
 * Students tag particles, send an energy pulse across the medium, and read a
 * live table showing each tagged particle's displacement returning to ≈ 0
 * after the pulse passes — the visible counterpart of invariant 20.2.
 */

const LEN = 10;
const SPEED = 2.5; // model m/s
const AMP = 0.6;
const WIDTH = 0.7;

/** Taggable particles: label → equilibrium position (m). */
const TAGGABLE: { label: string; eq: number }[] = [
  { label: 'B', eq: 2 },
  { label: 'D', eq: 4 },
  { label: 'F', eq: 6 },
  { label: 'H', eq: 8 },
];

export default function EnergyTransferPage() {
  const [tagged, setTagged] = useState<Set<string>>(new Set(['D']));
  const [pulseStart, setPulseStart] = useState<number | null>(null);
  const [pulseFinished, setPulseFinished] = useState(false);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);

  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const lowGraphics = useSettingsStore((s) => s.lowGraphics);
  const { announce } = useAnnouncer();

  const clock = useSimClock({
    running,
    speed,
    reducedMotion,
    active: pulseStart !== null && !pulseFinished,
  });
  const t = clock.t;

  const pulse = useMemo(
    () =>
      pulseStart !== null
        ? { amplitude: AMP, speed: SPEED, width: WIDTH, startTime: pulseStart }
        : null,
    [pulseStart],
  );

  useEffect(() => {
    if (!pulse || pulseFinished) return;
    if (pulseHasExited(pulse, LEN, t)) {
      setPulseFinished(true);
      announce('The pulse has crossed the chamber. Check the tagged-particle table: net displacement is approximately zero.');
    }
  }, [t, pulse, pulseFinished, announce]);

  const dispAt = useCallback(
    (x: number): number => (pulse ? pulseDisplacement(pulse, x, t) : 0),
    [pulse, t],
  );

  const particleCount = lowGraphics ? 20 : 40;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const y0 = h / 2;
      const px = (x: number) => (x / LEN) * (w - 24) + 12;
      const dispPx = (d: number) => -d * (h * 0.3);

      // Medium particles.
      ctx.fillStyle = '#056977';
      for (let i = 0; i < particleCount; i++) {
        const eq = (LEN * i) / (particleCount - 1);
        ctx.beginPath();
        ctx.arc(px(eq), y0 + dispPx(dispAt(eq)), 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tagged particles: bigger, violet ring + letter label (never colour-only).
      for (const p of TAGGABLE) {
        if (!tagged.has(p.label)) continue;
        const x = px(p.eq);
        const y = y0 + dispPx(dispAt(p.eq));
        ctx.strokeStyle = '#5b34c9';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#5b34c9';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.label, x, y - 14);
        // Home (equilibrium) marker.
        ctx.strokeStyle = '#b9b0a0';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, y0 - 8);
        ctx.lineTo(x, y0 + 8);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Energy marker.
      if (pulse) {
        const pos = SPEED * (t - pulse.startTime);
        if (pos <= LEN) {
          const mx = px(pos);
          ctx.fillStyle = '#8a5a0e';
          ctx.beginPath();
          ctx.moveTo(mx, 8);
          ctx.lineTo(mx + 7, 16);
          ctx.lineTo(mx, 24);
          ctx.lineTo(mx - 7, 16);
          ctx.closePath();
          ctx.fill();
          ctx.font = '11px system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillStyle = '#8a5a0e';
          ctx.fillText('energy →', mx + 10, 19);
        }
      }
    },
    [dispAt, tagged, pulse, t, particleCount],
  );

  const sendPulse = () => {
    if (pulse && !pulseFinished) return;
    setPulseFinished(false);
    setPulseStart(t);
    announce('Energy pulse sent from the left edge.');
  };

  const reset = () => {
    setTagged(new Set(['D']));
    setPulseStart(null);
    setPulseFinished(false);
    setRunning(true);
    setSpeed(1);
    clock.reset();
    announce('Reset to default');
  };

  const toggleTag = (label: string) => {
    setTagged((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const pulseInFlight = pulse !== null && !pulseFinished;
  const tCoarse = Math.round(t * 4) / 4;

  return (
    <Page
      title="Energy transfer"
      lead="Tag particles, send one pulse of energy across the medium, and watch what actually travels — and what doesn't."
    >
      <div className="wave-stage stack">
        <SimToolbar
          running={running}
          onToggleRun={() => setRunning((r) => !r)}
          onStep={clock.step}
          speed={speed}
          onSpeed={setSpeed}
          onReset={reset}
          resetLabel="energy transfer view"
        />

        <p className="wave-stage__readouts">
          <span>
            Elapsed: <output data-testid="sim-time">{formatSigFigs(t)} s</output>
          </span>
          <span>
            Pulse speed: <strong>{formatSigFigs(SPEED)} m/s (model)</strong>
          </span>
        </p>

        <div className="wave-controls">
          <div className="seg-control" data-control-id="wave-lab.tag-particle-toggles">
            <span className="seg-control__legend" aria-hidden="true">
              Tag particles to track
            </span>
            <div>
              {TAGGABLE.map((p) => (
                <label key={p.label} className="check-row">
                  <input
                    type="checkbox"
                    checked={tagged.has(p.label)}
                    onChange={() => toggleTag(p.label)}
                    aria-label={`Tag particle ${p.label}`}
                    data-testid={`tag-${p.label}`}
                  />
                  Particle {p.label} (at {p.eq} m)
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn--primary"
          onClick={sendPulse}
          disabled={pulseInFlight}
          aria-disabled={pulseInFlight}
          data-testid="send-pulse"
          data-control-id="wave-lab.energy-pulse-button"
        >
          Send energy pulse
        </button>

        <CanvasScene
          label="A row of medium particles; tagged particles are ringed and labelled; an energy marker crosses left to right as the pulse passes"
          height={150}
          frameKey={`${t}|${[...tagged].join()}|${pulseStart}|${lowGraphics}`}
          draw={draw}
          alternative={
            <p>
              {pulse
                ? pulseFinished
                  ? `The pulse has crossed the whole chamber (t = ${formatSigFigs(tCoarse)} s). Every tagged particle is back at its home position.`
                  : `Pulse front at ${formatSigFigs(Math.min(SPEED * (t - pulse.startTime), LEN))} m of ${LEN} m (t = ${formatSigFigs(tCoarse)} s). Particles rise and fall as it passes, then return to rest.`
                : 'No pulse yet — press "Send energy pulse".'}
            </p>
          }
          testId="energy-canvas"
        />

        <div className="data-table-wrap">
          <table className="data-table" data-control-id="wave-lab.tagged-particle-table">
            <caption>Tagged particle tracker</caption>
            <thead>
              <tr>
                <th scope="col">Particle</th>
                <th scope="col">Home position (m)</th>
                <th scope="col">Displacement now (m)</th>
                <th scope="col">Net displacement after pulse (m)</th>
              </tr>
            </thead>
            <tbody data-testid="tagged-table-body">
              {[...TAGGABLE.filter((p) => tagged.has(p.label))].map((p) => {
                const d = dispAt(p.eq);
                return (
                  <tr key={p.label}>
                    <th scope="row">Particle {p.label}</th>
                    <td>{p.eq.toFixed(1)}</td>
                    <td>{formatSigFigs(Math.round(d * 1000) / 1000)}</td>
                    <td data-testid={`net-${p.label}`}>
                      {pulseFinished
                        ? `${formatSigFigs(Math.abs(Math.round(d * 1e6) / 1e6))} ≈ 0`
                        : pulse
                          ? 'pulse still crossing…'
                          : '—'}
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
          The <strong>energy marker</strong> crosses the whole chamber; the{' '}
          <strong>particles do not</strong> — each one oscillates about its home
          position and finishes where it started (net displacement ≈ 0). Energy
          is transferred without any net transfer of particles.
        </p>

        <NoticeCapture
          controlId="wave-lab.energy-notice-input"
          outcomeCode="7.1.2"
          label="What do you notice? Track a tagged particle while the energy marker crosses."
          evidenceKind="Energy-transfer observation"
          testId="energy-notice"
        />
      </div>
    </Page>
  );
}
