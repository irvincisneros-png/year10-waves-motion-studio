import { useCallback, useEffect, useState } from 'react';
import { Page } from '../../components/Page';
import { CanvasScene } from '../../components/sim/CanvasScene';
import { SimControl } from '../../components/sim/SimControl';
import { SimToolbar } from '../../components/sim/SimToolbar';
import { NoticeCapture } from '../../components/sim/NoticeCapture';
import { useSimClock } from '../../components/sim/useSimClock';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useSettingsStore } from '../../store/settingsStore';
import {
  continuousDisplacement,
  pulseDisplacement,
  pulseHasExited,
} from '../../science/pulse';
import { formatSigFigs } from '../../science/units';

/**
 * "Medium or vacuum?" (outcome 7.1.1): three synchronised chambers —
 * mechanical medium, evacuated chamber, EM field view — sharing one trigger.
 * Chamber speeds are ILLUSTRATIVE (not to scale) and labelled as such.
 */

const LEN = 10; // chamber length, model metres
const EM_DISPLAY_SPEED = 6; // illustrative only — labelled in the UI

const DEFAULTS = {
  mediumType: 'coupled' as 'coupled' | 'spring',
  coupling: 50,
  density: 1,
  sourceMode: 'pulse' as 'pulse' | 'continuous',
  amplitude: 40,
  frequency: 1,
  trails: false,
  energyMarker: true,
};

/** Mechanical propagation speed from coupling + density (model, m/s). */
function mechSpeed(coupling: number, density: number): number {
  return 4 * Math.sqrt((0.2 + coupling / 100) / density);
}

interface Disturbance {
  mode: 'pulse' | 'continuous';
  startTime: number;
}

export default function MediumChambersPage() {
  const [mediumType, setMediumType] = useState(DEFAULTS.mediumType);
  const [coupling, setCoupling] = useState(DEFAULTS.coupling);
  const [density, setDensity] = useState(DEFAULTS.density);
  const [sourceMode, setSourceMode] = useState(DEFAULTS.sourceMode);
  const [amplitude, setAmplitude] = useState(DEFAULTS.amplitude);
  const [frequency, setFrequency] = useState(DEFAULTS.frequency);
  const [trails, setTrails] = useState(DEFAULTS.trails);
  const [energyMarker, setEnergyMarker] = useState(DEFAULTS.energyMarker);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [disturbance, setDisturbance] = useState<Disturbance | null>(null);

  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const lowGraphics = useSettingsStore((s) => s.lowGraphics);
  const { announce } = useAnnouncer();

  const vMech = mechSpeed(coupling, density);
  const ampFrac = amplitude / 100;

  const [pulseFinished, setPulseFinished] = useState(false);

  // Scene is static (rAF stops) when nothing has been triggered, or once a
  // pulse has fully exited the slowest chamber.
  const clock = useSimClock({
    running,
    speed,
    reducedMotion,
    active: disturbance !== null && !(disturbance.mode === 'pulse' && pulseFinished),
  });
  const t = clock.t;

  // Detect pulse exit from the SLOWEST chamber so all three finish on screen.
  const slowestSpeed = Math.min(vMech, EM_DISPLAY_SPEED);
  useEffect(() => {
    if (disturbance?.mode !== 'pulse' || pulseFinished) return;
    const slowPulse = {
      amplitude: ampFrac,
      speed: slowestSpeed,
      width: 0.6,
      startTime: disturbance.startTime,
    };
    if (pulseHasExited(slowPulse, LEN, t)) setPulseFinished(true);
  }, [t, disturbance, pulseFinished, ampFrac, slowestSpeed]);

  const triggerDisabled =
    disturbance !== null && disturbance.mode === 'pulse' && !pulseFinished;

  /** Displacement in a chamber at position x, time now. */
  const chamberDisplacement = useCallback(
    (kind: 'mechanical' | 'vacuum' | 'em', x: number): number => {
      if (!disturbance || kind === 'vacuum') return 0;
      const v = kind === 'mechanical' ? vMech : EM_DISPLAY_SPEED;
      if (disturbance.mode === 'pulse') {
        return pulseDisplacement(
          { amplitude: ampFrac, speed: v, width: 0.6, startTime: disturbance.startTime },
          x,
          t,
        );
      }
      return continuousDisplacement(
        { amplitude: ampFrac, frequency, speed: v, startTime: disturbance.startTime },
        x,
        t,
      );
    },
    [disturbance, vMech, ampFrac, frequency, t],
  );

  /** Front / marker position for the energy marker. */
  const frontPosition = useCallback(
    (v: number): number | null => {
      if (!disturbance) return null;
      const elapsed = t - disturbance.startTime;
      if (elapsed < 0) return null;
      const pos = v * elapsed;
      return pos > LEN ? null : pos;
    },
    [disturbance, t],
  );

  const particleCount = Math.max(
    8,
    Math.round((lowGraphics ? 14 : 28) * density),
  );

  const drawChamber = useCallback(
    (kind: 'mechanical' | 'vacuum' | 'em') =>
      (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        const y0 = h / 2;
        const px = (x: number) => (x / LEN) * (w - 24) + 12;
        const dispPx = (d: number) => -d * (h * 0.32);

        // Source paddle at the left edge (vibrates even in vacuum).
        const sourceD = disturbance
          ? kind === 'vacuum'
            ? chamberVacuumSourceMotion()
            : chamberDisplacement(kind === 'em' ? 'em' : 'mechanical', 0)
          : 0;
        ctx.fillStyle = '#545c6e';
        ctx.fillRect(4, y0 - 22 + dispPx(sourceD), 5, 44);

        function chamberVacuumSourceMotion(): number {
          if (!disturbance) return 0;
          const elapsed = t - disturbance.startTime;
          if (elapsed < 0) return 0;
          if (disturbance.mode === 'pulse') {
            const arg = (elapsed - 0.3) / 0.15;
            return ampFrac * Math.exp(-arg * arg);
          }
          return ampFrac * Math.sin(2 * Math.PI * frequency * elapsed) * -1;
        }

        if (kind === 'vacuum') {
          // Empty chamber: no particles, no transmission.
          ctx.strokeStyle = '#ddd5c8';
          ctx.setLineDash([4, 6]);
          ctx.strokeRect(12, y0 - h * 0.36, w - 24, h * 0.72);
          ctx.setLineDash([]);
          return;
        }

        if (kind === 'mechanical') {
          const pts: { x: number; y: number }[] = [];
          for (let i = 0; i < particleCount; i++) {
            const eq = (LEN * i) / (particleCount - 1);
            const d = chamberDisplacement('mechanical', eq);
            pts.push({ x: px(eq), y: y0 + dispPx(d) });
          }
          if (mediumType === 'spring') {
            // Rope/spring: continuous line through the particles.
            ctx.strokeStyle = '#056977';
            ctx.lineWidth = 3;
            ctx.beginPath();
            pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
            ctx.stroke();
          } else {
            // Coupled particles: light links + circles.
            ctx.strokeStyle = '#b9d8dd';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
            ctx.stroke();
          }
          if (trails && !lowGraphics) {
            for (const dt of [0.12, 0.24]) {
              ctx.fillStyle = 'rgba(5,105,119,0.15)';
              for (let i = 0; i < particleCount; i++) {
                const eq = (LEN * i) / (particleCount - 1);
                const d = disturbance
                  ? disturbance.mode === 'pulse'
                    ? pulseDisplacement(
                        { amplitude: ampFrac, speed: vMech, width: 0.6, startTime: disturbance.startTime },
                        eq,
                        t - dt,
                      )
                    : continuousDisplacement(
                        { amplitude: ampFrac, frequency, speed: vMech, startTime: disturbance.startTime },
                        eq,
                        t - dt,
                      )
                  : 0;
                ctx.beginPath();
                ctx.arc(px(eq), y0 + dispPx(d), 4, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
          ctx.fillStyle = '#056977';
          for (const p of pts) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // EM field-vector view: vertical arrows on a centreline.
          ctx.strokeStyle = '#c9bdf5';
          ctx.beginPath();
          ctx.moveTo(12, y0);
          ctx.lineTo(w - 12, y0);
          ctx.stroke();
          const vectors = lowGraphics ? 16 : 32;
          ctx.strokeStyle = '#5b34c9';
          ctx.lineWidth = 2.5;
          for (let i = 0; i < vectors; i++) {
            const eq = (LEN * i) / (vectors - 1);
            const d = chamberDisplacement('em', eq);
            const yTip = y0 + dispPx(d);
            ctx.beginPath();
            ctx.moveTo(px(eq), y0);
            ctx.lineTo(px(eq), yTip);
            ctx.stroke();
            // arrow head
            if (Math.abs(yTip - y0) > 4) {
              const dir = yTip < y0 ? -1 : 1;
              ctx.beginPath();
              ctx.moveTo(px(eq) - 3, yTip - 4 * dir);
              ctx.lineTo(px(eq), yTip);
              ctx.lineTo(px(eq) + 3, yTip - 4 * dir);
              ctx.stroke();
            }
          }
        }

        // Energy marker (distinct diamond + label), never a particle.
        if (energyMarker && disturbance) {
          const v = kind === 'mechanical' ? vMech : EM_DISPLAY_SPEED;
          const pos = frontPosition(v);
          if (pos !== null) {
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
            ctx.fillText('energy', mx + 10, 19);
          }
        }
      },
    [
      chamberDisplacement,
      frontPosition,
      disturbance,
      ampFrac,
      frequency,
      vMech,
      particleCount,
      mediumType,
      trails,
      lowGraphics,
      energyMarker,
      t,
    ],
  );

  const frameKey = `${t}|${coupling}|${density}|${amplitude}|${frequency}|${mediumType}|${sourceMode}|${trails}|${energyMarker}|${disturbance?.startTime ?? 'none'}|${lowGraphics}`;

  const reset = () => {
    setMediumType(DEFAULTS.mediumType);
    setCoupling(DEFAULTS.coupling);
    setDensity(DEFAULTS.density);
    setSourceMode(DEFAULTS.sourceMode);
    setAmplitude(DEFAULTS.amplitude);
    setFrequency(DEFAULTS.frequency);
    setTrails(DEFAULTS.trails);
    setEnergyMarker(DEFAULTS.energyMarker);
    setDisturbance(null);
    setPulseFinished(false);
    setSpeed(1);
    setRunning(true);
    clock.reset();
    announce('Reset to default');
  };

  const trigger = () => {
    if (triggerDisabled) return;
    setPulseFinished(false);
    setDisturbance({ mode: sourceMode, startTime: t });
    announce(`Disturbance triggered at t = ${formatSigFigs(t)} seconds in all three chambers`);
  };

  // Throttled accessible-alternative text (≈4 Hz).
  const tCoarse = Math.round(t * 4) / 4;
  const altText = (kind: 'mechanical' | 'vacuum' | 'em'): string => {
    if (!disturbance) return 'No disturbance yet — press "Trigger disturbance in all three chambers".';
    const triggered = `Disturbance triggered at t = ${formatSigFigs(disturbance.startTime)} s. `;
    if (kind === 'vacuum') {
      return `${triggered}The source vibrates, but with no medium there are no particles to pass the disturbance on — nothing crosses the chamber.`;
    }
    const v = kind === 'mechanical' ? vMech : EM_DISPLAY_SPEED;
    const pos = frontPosition(v);
    const name = kind === 'mechanical' ? 'Mechanical pulse' : 'EM disturbance';
    if (pos === null && tCoarse > disturbance.startTime) {
      return `${triggered}${name} has crossed the whole ${LEN} m chamber. Particles it passed have returned to rest — energy moved, matter did not.`;
    }
    return `${triggered}${name} front is at ${formatSigFigs(pos ?? 0)} m of ${LEN} m, moving at ${formatSigFigs(v)} m/s (model speed).`;
  };

  return (
    <Page
      title="Medium or vacuum?"
      lead="Trigger one disturbance in three chambers at once: a mechanical medium, a vacuum, and an electromagnetic field view. What needs matter, and what doesn't?"
    >
      <div className="wave-stage stack">
        <SimToolbar
          running={running}
          onToggleRun={() => setRunning((r) => !r)}
          onStep={clock.step}
          speed={speed}
          onSpeed={setSpeed}
          onReset={reset}
          resetLabel="medium comparison"
        />

        <p className="wave-stage__readouts">
          <span>
            Elapsed: <output data-testid="sim-time">{formatSigFigs(t)} s</output>
          </span>
          <span>
            Mechanical speed:{' '}
            <strong data-testid="mech-speed">{formatSigFigs(vMech)} m/s (model)</strong>
          </span>
          <span>
            Source frequency:{' '}
            <strong data-testid="mech-frequency">{formatSigFigs(frequency)} Hz</strong>
          </span>
        </p>

        <div className="wave-controls">
          <fieldset className="seg-control" data-control-id="wave-lab.medium-type-select">
            <legend className="seg-control__legend">Medium type</legend>
            <div className="seg-control__options" role="radiogroup" aria-label="Medium type">
              {(
                [
                  ['coupled', 'Coupled particles (solid-like)'],
                  ['spring', 'Spring/rope model'],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="seg-control__option">
                  <input
                    type="radio"
                    name="medium-type"
                    checked={mediumType === value}
                    onChange={() => setMediumType(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="seg-control" data-control-id="wave-lab.source-mode-toggle">
            <legend className="seg-control__legend">Source mode</legend>
            <div className="seg-control__options" role="radiogroup" aria-label="Source mode">
              {(
                [
                  ['pulse', 'Pulse'],
                  ['continuous', 'Continuous'],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="seg-control__option">
                  <input
                    type="radio"
                    name="source-mode"
                    checked={sourceMode === value}
                    onChange={() => setSourceMode(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <SimControl
            id="wave-lab.coupling-slider"
            label="Particle coupling strength"
            min={0}
            max={100}
            step={1}
            value={coupling}
            onChange={setCoupling}
            format={(v) => `Coupling: ${Math.round(v)}%`}
            hint="Stronger coupling passes the disturbance on faster (mechanical chamber only)."
            testId="coupling-slider"
          />
          <SimControl
            id="wave-lab.density-slider"
            label="Medium density"
            min={0.5}
            max={3}
            step={0.1}
            value={density}
            onChange={setDensity}
            format={(v) => `Density: ${v.toFixed(1)}×`}
            hint="Denser medium: more, closer particles — and slower propagation."
            testId="density-slider"
          />
          <SimControl
            id="wave-lab.amplitude-slider"
            label="Amplitude"
            min={0}
            max={100}
            step={1}
            value={amplitude}
            onChange={setAmplitude}
            format={(v) => `Amplitude: ${Math.round(v)}%`}
            hint="Changes the size of the disturbance only — never its frequency or speed."
            testId="amplitude-slider"
          />
          <SimControl
            id="wave-lab.frequency-slider"
            label="Source frequency"
            min={0.1}
            max={10}
            step={0.1}
            value={frequency}
            onChange={setFrequency}
            format={(v) => `Frequency: ${v.toFixed(1)} Hz`}
            hint="Used in continuous mode."
            testId="frequency-slider"
          />

          <div className="seg-control">
            <span className="seg-control__legend" aria-hidden="true">
              Overlays
            </span>
            <div>
              <label className="check-row" data-control-id="wave-lab.particle-trails-toggle">
                <input
                  type="checkbox"
                  checked={trails}
                  onChange={(e) => setTrails(e.target.checked)}
                  aria-label="Show particle trails"
                  data-testid="trails-toggle"
                />
                Show particle trails
              </label>
              <label className="check-row" data-control-id="wave-lab.energy-marker-toggle">
                <input
                  type="checkbox"
                  checked={energyMarker}
                  onChange={(e) => setEnergyMarker(e.target.checked)}
                  aria-label="Show energy marker"
                  data-testid="energy-marker-toggle"
                />
                Show energy marker
              </label>
              <p className="seg-control__note">Energy travels; particles do not.</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn--primary"
          onClick={trigger}
          disabled={triggerDisabled}
          aria-disabled={triggerDisabled}
          data-testid="trigger-disturbance"
          data-control-id="wave-lab.trigger-disturbance-button"
        >
          Trigger disturbance in all three chambers
        </button>

        <div className="stack">
          <p className="chamber-caption">
            <strong>1 · Mechanical medium</strong>
            <span>coupled particles pass the disturbance along</span>
          </p>
          <CanvasScene
            label="Mechanical medium chamber: particles oscillate as the disturbance passes"
            height={120}
            frameKey={frameKey}
            draw={drawChamber('mechanical')}
            alternative={<p>{altText('mechanical')}</p>}
            testId="chamber-mechanical"
            teacherLayer="particles"
          />
          <p className="chamber-caption">
            <strong>2 · Vacuum</strong>
            <span>no particles — can a mechanical wave cross?</span>
          </p>
          <CanvasScene
            label="Evacuated chamber: the source vibrates but no disturbance crosses"
            height={120}
            frameKey={frameKey}
            draw={drawChamber('vacuum')}
            alternative={<p>{altText('vacuum')}</p>}
            testId="chamber-vacuum"
          />
          <p className="chamber-caption">
            <strong>3 · Electromagnetic field view</strong>
            <span>field vectors — a representation, not particles in space</span>
          </p>
          <CanvasScene
            label="Electromagnetic field chamber: the field disturbance propagates without a medium"
            height={120}
            frameKey={frameKey}
            draw={drawChamber('em')}
            alternative={<p>{altText('em')}</p>}
            testId="chamber-em"
            teacherLayer="vectors"
          />
        </div>

        <p className="notice">
          <span>Model honesty: chamber speeds are illustrative, not to scale — real
          light travels about a million times faster than sound. The EM arrows
          are a <strong>field-vector representation</strong>, not particles
          moving through space.</span>
        </p>

        <NoticeCapture
          controlId="wave-lab.medium-notice-input"
          outcomeCode="7.1.1"
          label="What do you notice? Compare what crosses each chamber and why."
          evidenceKind="Medium vs vacuum observation"
          testId="medium-notice"
        />
      </div>
    </Page>
  );
}
