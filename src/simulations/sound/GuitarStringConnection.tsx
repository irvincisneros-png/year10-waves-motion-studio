import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import { SimControl } from '../../components/sim/SimControl';
import { useSettingsStore } from '../../store/settingsStore';

const REFERENCE_LENGTH_CM = 65;
const REFERENCE_FREQUENCY_HZ = 110;
const STRING_LEFT = 142;
const STRING_RIGHT = 604;

function vibratingStringPath(startX: number, amplitude: number, phase: number): string {
  return Array.from({ length: 101 }, (_, index) => {
    const progress = index / 100;
    const x = startX + progress * (STRING_RIGHT - startX);
    const envelope = Math.sin(Math.PI * progress);
    const y = 94 - amplitude * envelope * Math.sin(phase);
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function oscilloscopePath(frequencyHz: number, amplitude: number): string {
  const windowSeconds = 0.016;
  return Array.from({ length: 161 }, (_, index) => {
    const x = 18 + index / 160 * 604;
    const y = 82 - amplitude * 54 * Math.sin(2 * Math.PI * frequencyHz * windowSeconds * index / 160);
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

export function GuitarStringConnection() {
  const [lengthCm, setLengthCm] = useState(50);
  const [pluck, setPluck] = useState(45);
  const [animationTime, setAnimationTime] = useState(0);
  const [pluckStarted, setPluckStarted] = useState<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const { announce } = useAnnouncer();
  const frequencyHz = REFERENCE_FREQUENCY_HZ * REFERENCE_LENGTH_CM / lengthCm;
  const fingerX = STRING_RIGHT - (STRING_RIGHT - STRING_LEFT) * Math.min(1, lengthCm / 90);
  const relation = lengthCm < REFERENCE_LENGTH_CM
    ? 'shorter string · higher frequency · higher pitch'
    : lengthCm > REFERENCE_LENGTH_CM
      ? 'longer string · lower frequency · lower pitch'
      : 'reference string length and pitch';
  const elapsed = pluckStarted === null ? 1.5 : Math.max(0, animationTime - pluckStarted) / 1000;
  const decay = pluckStarted === null ? 0 : Math.max(0, 1 - elapsed / 2.6);
  const visibleAmplitude = (pluck / 100) * decay;
  const phase = reducedMotion ? Math.PI / 2 : elapsed * 2 * Math.PI * Math.min(frequencyHz, 180) * 0.08;
  const stringPath = useMemo(
    () => vibratingStringPath(fingerX, visibleAmplitude * 35, phase),
    [fingerX, phase, visibleAmplitude],
  );
  const tracePath = useMemo(
    () => oscilloscopePath(frequencyHz, visibleAmplitude),
    [frequencyHz, visibleAmplitude],
  );

  const pluckString = useCallback(() => {
    const now = performance.now();
    setAnimationTime(now);
    setPluckStarted(now);
    announce(`String plucked. ${Math.round(frequencyHz)} hertz, ${relation}.`);
  }, [announce, frequencyHz, relation]);

  useEffect(() => {
    if (pluckStarted === null || reducedMotion) return;
    const animate = (time: number) => {
      setAnimationTime(time);
      if (time - pluckStarted < 2600) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [pluckStarted, reducedMotion]);

  const changeLength = (value: number) => {
    setLengthCm(value);
    setPluckStarted(null);
  };

  return (
    <section className="guitar-connection card stack" aria-labelledby="guitar-title" data-testid="guitar-connection">
      <div className="guitar-connection__intro">
        <div>
          <p className="live-sound__eyebrow">Supporting exploration · use after the tone activity</p>
          <h2 id="guitar-title">Interactive guitar: connect string length to pitch</h2>
          <p>Move the fretting finger, then pluck the string. The guitar and its oscilloscope respond together. In this model, <strong>tension and string thickness stay fixed</strong>.</p>
        </div>
        <div className="guitar-connection__frequency" aria-live="polite">
          <strong>{Math.round(frequencyHz)} Hz</strong>
          <span>{relation}</span>
        </div>
      </div>

      <div className="guitar-connection__controls">
        <SimControl id="sound-lab.guitar-length-slider" label="Effective vibrating length" min={25} max={90} step={1} value={lengthCm} onChange={changeLength} format={(value) => `${Math.round(value)} cm`} hint="Move the finger towards the guitar body to shorten the part that can vibrate." testId="guitar-length" />
        <SimControl id="sound-lab.guitar-pluck-slider" label="Pluck strength" min={10} max={100} step={1} value={pluck} onChange={setPluck} format={(value) => `${Math.round(value)}%`} hint="A harder pluck gives larger displacement and a louder sound." testId="guitar-pluck" />
        <button type="button" className="btn btn--primary guitar-connection__pluck" onClick={pluckString} data-testid="pluck-string">
          <span aria-hidden="true">☝</span> Pluck the string
        </button>
      </div>

      <div className="guitar-connection__models">
        <figure className="guitar-model">
          <figcaption>Guitar model · click the string or use “Pluck the string”</figcaption>
          <svg viewBox="0 0 640 188" role="img" aria-label={`Interactive guitar with ${Math.round(lengthCm)} centimetre vibrating string. Frequency ${Math.round(frequencyHz)} hertz.`} onClick={pluckString} data-testid="guitar-model">
            <path className="guitar-model__body" d="M532 24 C495 21 477 42 479 67 C451 73 438 94 447 117 C456 140 481 145 498 134 C515 166 568 171 593 141 C625 143 640 113 625 92 C641 63 615 34 586 40 C572 26 553 21 532 24 Z" />
            <circle className="guitar-model__hole" cx="535" cy="94" r="26" />
            <rect className="guitar-model__neck" x="82" y="76" width="430" height="36" rx="8" />
            {Array.from({ length: 10 }, (_, index) => <line key={index} className="guitar-model__fret" x1={126 + index * 36} x2={126 + index * 36} y1="77" y2="111" />)}
            <path className="guitar-model__head" d="M22 66 L95 74 L95 114 L22 122 Q6 94 22 66 Z" />
            <line className="guitar-model__inactive-string" x1={28} x2={fingerX} y1="94" y2="94" />
            <path d={stringPath} className={`guitar-model__active-string${visibleAmplitude > 0 ? ' is-ringing' : ''}`} />
            <circle className="guitar-model__finger" cx={fingerX} cy="94" r="11" />
            <text className="guitar-model__finger-label" x={fingerX} y="66" textAnchor="middle">finger</text>
            <text className="guitar-model__length-label" x={(fingerX + STRING_RIGHT) / 2} y="145" textAnchor="middle">{Math.round(lengthCm)} cm vibrating length</text>
          </svg>
        </figure>

        <figure className="guitar-scope" data-testid="guitar-waveform">
          <figcaption>Oscilloscope · fixed 16 ms window</figcaption>
          <svg viewBox="0 0 640 164" role="img" aria-label={`Synchronized waveform: ${Math.round(frequencyHz)} hertz and relative amplitude ${Math.round(visibleAmplitude * 100)} percent.`}>
            <g className="live-trace__grid" aria-hidden="true">
              <line x1="18" x2="622" y1="28" y2="28" />
              <line x1="18" x2="622" y1="55" y2="55" />
              <line x1="18" x2="622" y1="82" y2="82" />
              <line x1="18" x2="622" y1="109" y2="109" />
              <line x1="18" x2="622" y1="136" y2="136" />
            </g>
            <line x1="18" x2="622" y1="82" y2="82" className="live-trace__axis" />
            <path d={tracePath} className="guitar-scope__wave" />
            <text x="18" y="157">0 ms</text><text x="622" y="157" textAnchor="end">16 ms</text>
          </svg>
          <p><strong>{Math.round(frequencyHz)} Hz</strong> · {Math.round(visibleAmplitude * 100)}% current amplitude</p>
        </figure>
      </div>

      <div className="guitar-connection__rule">
        <span><strong>Shorter vibrating length</strong> → cycles are closer together → higher frequency → higher pitch</span>
        <span><strong>Harder pluck</strong> → string moves further and trace peaks are taller → larger amplitude → louder sound, with almost the same pitch</span>
      </div>
      <p className="seg-control__note">Real guitars can also change pitch by changing string tension or thickness (mass per unit length). Those are deliberately held fixed here so the length relationship is a fair comparison.</p>
    </section>
  );
}
