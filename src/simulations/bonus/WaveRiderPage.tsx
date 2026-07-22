import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Gauge, RotateCcw, Sparkles, Waves } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { useReducedMotion } from '../../accessibility/useReducedMotion';
import { Page } from '../../components/Page';
import {
  directionalHint,
  particlePosition,
  relativeEnergy,
  scoreEnergyGate,
  scoreMatterGate,
  scoreSpeedGate,
  waveSpeed,
  WAVE_RIDER_TARGETS,
  type MatterChoice,
} from '../../science/waveRider';
import { useSettingsStore } from '../../store/settingsStore';
import './WaveRiderPage.css';

const STAGES = [
  { id: 'matter', label: 'Particle cove', outcome: '7.1.2' },
  { id: 'energy', label: 'Energy ramp', outcome: '7.1.2' },
  { id: 'speed', label: 'Equation tunnel', outcome: '7.1.3' },
] as const;

type RideState = 'ready' | 'riding' | 'retry' | 'success' | 'complete';

function waveY(x: number, amplitudeM: number, wavelengthM: number) {
  const amplitudePx = amplitudeM * 36;
  const wavelengthPx = wavelengthM * 48;
  return 288 - amplitudePx * Math.sin((x / wavelengthPx) * Math.PI * 2);
}

function makeWavePath(amplitudeM: number, wavelengthM: number) {
  const points: string[] = [];
  for (let x = 0; x <= 1000; x += 8) {
    points.push(`${x === 0 ? 'M' : 'L'} ${x} ${waveY(x, amplitudeM, wavelengthM)}`);
  }
  return points.join(' ');
}

export default function WaveRiderPage() {
  const [stage, setStage] = useState(0);
  const [matterChoice, setMatterChoice] = useState<MatterChoice>(null);
  const [amplitude, setAmplitude] = useState(0.8);
  const [wavelength, setWavelength] = useState(3);
  const [rideState, setRideState] = useState<RideState>('ready');
  const [message, setMessage] = useState('Choose what the medium particles do, then ride the first gate.');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gradientId = useId().replace(/:/g, '');
  const clipId = useId().replace(/:/g, '');
  const manualReducedMotion = useSettingsStore((state) => state.reducedMotion);
  const reducedMotion = useReducedMotion(manualReducedMotion);
  const { announce } = useAnnouncer();

  const wavePath = useMemo(
    () => makeWavePath(amplitude, wavelength),
    [amplitude, wavelength],
  );
  const speed = waveSpeed(WAVE_RIDER_TARGETS.frequencyHz, wavelength);
  const energy = relativeEnergy(amplitude);
  const completed = stage >= STAGES.length;
  const riderX = completed ? 900 : 150 + stage * 275;
  const riderY = waveY(riderX, amplitude, wavelength) - 10;

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const resetGame = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStage(0);
    setMatterChoice(null);
    setAmplitude(0.8);
    setWavelength(3);
    setRideState('ready');
    setMessage('Choose what the medium particles do, then ride the first gate.');
    announce('Wave Rider reset. Particle cove is ready.');
  };

  const evaluateStage = () => {
    if (stage === 0) return scoreMatterGate(matterChoice);
    if (stage === 1) return scoreEnergyGate(amplitude);
    return scoreSpeedGate(wavelength);
  };

  const retryMessage = () => {
    if (stage === 0) return 'The medium would be emptied if particles travelled away. Try the home-position answer.';
    if (stage === 1) return `${directionalHint(amplitude, WAVE_RIDER_TARGETS.amplitudeM)} Amplitude changes the relative energy, not the wave speed.`;
    return `${directionalHint(speed, WAVE_RIDER_TARGETS.mediumSpeedMps)} Use v = fλ with f fixed at 1.2 Hz.`;
  };

  const rideCheckpoint = () => {
    if (rideState === 'riding' || completed) return;
    const passed = evaluateStage();
    setRideState('riding');
    setMessage('Pulse is scanning the checkpoint…');

    const finishRide = () => {
      if (!passed) {
        const nextMessage = retryMessage();
        setRideState('retry');
        setMessage(nextMessage);
        announce(`Checkpoint needs another tune. ${nextMessage}`);
        return;
      }

      const nextStage = stage + 1;
      if (nextStage === STAGES.length) {
        setStage(nextStage);
        setRideState('complete');
        setMessage('Wave Rider patch earned. Energy crossed the course; the particles stayed near home.');
        announce('Wave Rider complete. Patch earned.');
        return;
      }

      setStage(nextStage);
      setRideState('success');
      const nextMessage = nextStage === 1
        ? 'Particle cove cleared. Tune the amplitude to 1.5 m for the energy ramp.'
        : 'Energy ramp cleared. Use v = fλ to match the 6 m/s equation tunnel.';
      setMessage(nextMessage);
      announce(nextMessage);
    };

    if (reducedMotion) finishRide();
    else timeoutRef.current = setTimeout(finishRide, 650);
  };

  return (
    <Page
      title="Wave Rider bonus challenge"
      heading="Wave Rider"
      lead="Tune the wave, clear three science checkpoints, and help Pulse carry energy across the course."
    >
      <div className="wave-rider__topline">
        <span><Sparkles size={15} aria-hidden="true" /> Bonus mastery game</span>
        <Link to="/" className="wave-rider__back">Back to all simulators</Link>
      </div>

      <section className="wave-rider__game" aria-labelledby="wave-rider-course-title">
        <div className="wave-rider__hud">
          <div>
            <p className="wave-rider__kicker">Pulse training course</p>
            <h2 id="wave-rider-course-title">Surf the energy front</h2>
          </div>
          <div className="wave-rider__score" aria-label={`${stage} of ${STAGES.length} checkpoints cleared`}>
            <strong>{stage}/{STAGES.length}</strong>
            <span>gates cleared</span>
          </div>
        </div>

        <ol className="wave-rider__checkpoints" aria-label="Course checkpoints">
          {STAGES.map((item, index) => {
            const state = index < stage ? 'complete' : index === stage && !completed ? 'active' : 'locked';
            return (
              <li key={item.id} data-state={state}>
                <span className="wave-rider__gate-number" aria-hidden="true">
                  {state === 'complete' ? <Check size={15} /> : index + 1}
                </span>
                <span><strong>{item.label}</strong><small>Outcome {item.outcome}</small></span>
              </li>
            );
          })}
        </ol>

        <div className={`wave-rider__course is-${rideState}`}>
          <svg
            viewBox="0 0 1000 430"
            role="img"
            aria-label="A game course showing an energy-front tracker above a transverse wave while medium particles oscillate near fixed home positions."
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#07152b" />
                <stop offset="0.55" stopColor="#122b50" />
                <stop offset="1" stopColor="#271c58" />
              </linearGradient>
              <filter id={`${gradientId}-glow`} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                <rect x="-72" y="-112" width="96" height="115" rx="8" />
              </clipPath>
            </defs>
            <rect width="1000" height="430" rx="22" fill={`url(#${gradientId})`} />
            <path className="wave-rider__grid" d="M0 90H1000M0 170H1000M0 250H1000M0 330H1000M125 0V430M250 0V430M375 0V430M500 0V430M625 0V430M750 0V430M875 0V430" />
            <circle cx="850" cy="78" r="125" fill="rgba(130,94,255,.13)" />
            <path className="wave-rider__wave-glow" d={wavePath} />
            <path className="wave-rider__wave" d={wavePath} />

            {Array.from({ length: 19 }, (_, index) => {
              const x = 55 + index * 50;
              const displacement = particlePosition(0, amplitude * 11, (x / (wavelength * 48)) * Math.PI * 2);
              return (
                <g key={x} className="wave-rider__particle">
                  <line x1={x} y1="365" x2={x} y2={365 + displacement} />
                  <circle cx={x} cy="365" r="3" className="wave-rider__particle-home" />
                  <circle cx={x} cy={365 + displacement} r="7" />
                </g>
              );
            })}

            {[150, 425, 700, 900].map((x, index) => (
              <g key={x} className={`wave-rider__beacon${index < stage ? ' is-cleared' : ''}`}>
                <line x1={x} y1="88" x2={x} y2="340" />
                <circle cx={x} cy="78" r="22" />
                <text x={x} y="84" textAnchor="middle">
                  {index < stage ? '✓' : index === STAGES.length ? '★' : index + 1}
                </text>
              </g>
            ))}

            <g
              className="wave-rider__rider"
              style={{ transform: `translate(${riderX}px, ${riderY}px)` }}
              aria-hidden="true"
            >
              <ellipse cx="-18" cy="6" rx="61" ry="10" />
              <path d="M-77 2 Q-20 22 42 1" />
              <image
                href={`${import.meta.env.BASE_URL}assets/game/pulse-wave-runner.png`}
                x="-78"
                y="-115"
                width="176"
                height="117"
                clipPath={`url(#${clipId})`}
              />
              <circle cx="0" cy="3" r="25" className="wave-rider__rider-glow" filter={`url(#${gradientId}-glow)`} />
            </g>
            <text x="40" y="36" className="wave-rider__scene-label">ENERGY-FRONT TRACKER · GAME MARKER</text>
            <text x="40" y="410" className="wave-rider__scene-label">HOME POSITIONS · PARTICLES OSCILLATE LOCALLY</text>
          </svg>
        </div>

        <div className="wave-rider__console">
          <div className="wave-rider__briefing">
            <p className="wave-rider__kicker">Checkpoint {Math.min(stage + 1, 3)} briefing</p>
            {stage === 0 ? (
              <>
                <h3>Particle cove</h3>
                <p>When a wave crosses a medium, what happens to its particles?</p>
                <fieldset data-control-id="bonus-wave-rider.matter-choice">
                  <legend className="u-visually-hidden">What medium particles do</legend>
                  <label><input type="radio" name="matter-choice" checked={matterChoice === 'travels'} onChange={() => setMatterChoice('travels')} /> Travel across the course with Pulse</label>
                  <label><input type="radio" name="matter-choice" checked={matterChoice === 'oscillates'} onChange={() => setMatterChoice('oscillates')} /> Oscillate near a fixed home position</label>
                </fieldset>
              </>
            ) : stage === 1 ? (
              <>
                <h3>Energy ramp</h3>
                <p>Set amplitude to <strong>1.5 m</strong>. In this fixed medium, a larger amplitude carries more energy but does not make the wave travel faster.</p>
                <label className="wave-rider__slider">
                  <span><strong>Amplitude</strong><output>{amplitude.toFixed(1)} m</output></span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={amplitude}
                    aria-label="Wave Rider amplitude"
                    data-control-id="bonus-wave-rider.amplitude"
                    onChange={(event) => setAmplitude(Number(event.target.value))}
                  />
                </label>
              </>
            ) : stage === 2 ? (
              <>
                <h3>Equation tunnel</h3>
                <p>The medium fixes speed at <strong>6 m/s</strong> and the source fixes frequency at <strong>1.2 Hz</strong>. Tune wavelength so v = fλ.</p>
                <label className="wave-rider__slider">
                  <span><strong>Wavelength</strong><output>{wavelength.toFixed(1)} m</output></span>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    step="0.5"
                    value={wavelength}
                    aria-label="Wave Rider wavelength"
                    data-control-id="bonus-wave-rider.wavelength"
                    onChange={(event) => setWavelength(Number(event.target.value))}
                  />
                </label>
              </>
            ) : (
              <div className="wave-rider__victory">
                <Sparkles size={30} aria-hidden="true" />
                <h3>Wave Rider patch earned</h3>
                <p>You transferred energy across the course without carrying the medium away.</p>
              </div>
            )}
          </div>

          <aside className="wave-rider__telemetry" aria-label="Live wave telemetry">
            <p className="wave-rider__kicker"><Gauge size={15} aria-hidden="true" /> Live telemetry</p>
            <dl>
              <div><dt>Amplitude</dt><dd>{amplitude.toFixed(1)} m</dd></div>
              <div><dt>Relative energy</dt><dd>{energy.toFixed(2)} units</dd></div>
              <div><dt>Frequency</dt><dd>1.2 Hz</dd></div>
              <div><dt>Wavelength</dt><dd>{wavelength.toFixed(1)} m</dd></div>
              <div><dt>Wave speed</dt><dd>{speed.toFixed(1)} m/s</dd></div>
            </dl>
          </aside>
        </div>

        <div className="wave-rider__actionbar">
          <p className={`wave-rider__message is-${rideState}`} role="status">
            <span aria-hidden="true" /> {message}
          </p>
          {completed ? (
            <button type="button" className="wave-rider__ride-button" onClick={resetGame} data-control-id="bonus-wave-rider.reset">
              <RotateCcw size={18} aria-hidden="true" /> Ride again
            </button>
          ) : (
            <button
              type="button"
              className="wave-rider__ride-button"
              onClick={rideCheckpoint}
              disabled={rideState === 'riding' || (stage === 0 && matterChoice === null)}
              data-control-id="bonus-wave-rider.ride-checkpoint"
            >
              <Waves size={19} aria-hidden="true" /> Ride checkpoint <ArrowRight size={17} aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      <section className="wave-rider__science" aria-labelledby="wave-rider-science-title">
        <div>
          <p className="wave-rider__kicker">How the game relates</p>
          <h2 id="wave-rider-science-title">The surfing is a metaphor. The physics is real.</h2>
        </div>
        <ul>
          <li><strong>Particles bob locally:</strong> the lower dots oscillate around their marked home positions instead of crossing the course.</li>
          <li><strong>Amplitude tracks energy:</strong> increasing amplitude raises the relative energy index as A², without changing speed.</li>
          <li><strong>The controls obey v = fλ:</strong> with the medium speed and source frequency fixed, wavelength must adjust.</li>
        </ul>
        <p className="wave-rider__model-note">
          <strong>Model limit:</strong> Pulse and the board are an arcade-style energy-front tracker, not a particle, photon, or literal surfer carried by a water wave. Real water-surface particles follow near-circular paths, and breaking waves involve additional motion this simplified game does not model.
        </p>
      </section>
    </Page>
  );
}
