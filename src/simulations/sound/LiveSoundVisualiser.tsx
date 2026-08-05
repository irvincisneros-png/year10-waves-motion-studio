import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import {
  calculateRms,
  estimateFundamentalFrequency,
  pitchDescription,
  relativeLoudnessDescription,
} from '../../science/soundCapture';
import { formatSigFigs } from '../../science/units';

type CaptureMode = 'demo' | 'microphone';
type MicrophoneState = 'idle' | 'requesting' | 'live' | 'denied' | 'unsupported' | 'error';

interface LiveSoundVisualiserProps {
  demoFrequencyHz: number;
  demoAmplitude: number;
}

const TRACE_POINTS = 180;
const DEMO_WINDOW_SECONDS = 0.012;
const ASSUMED_SOUND_SPEED = 343;

function demoSamples(frequencyHz: number, amplitude: number): number[] {
  return Array.from({ length: TRACE_POINTS }, (_, index) =>
    amplitude * Math.sin(2 * Math.PI * frequencyHz * DEMO_WINDOW_SECONDS * index / (TRACE_POINTS - 1)),
  );
}

function tracePath(samples: readonly number[]): string {
  return samples.map((sample, index) => {
    const x = 18 + (index / Math.max(1, samples.length - 1)) * 604;
    const y = 120 - Math.max(-1, Math.min(1, sample)) * 88;
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

export function LiveSoundVisualiser({ demoFrequencyHz, demoAmplitude }: LiveSoundVisualiserProps) {
  const [mode, setMode] = useState<CaptureMode>('demo');
  const [microphoneState, setMicrophoneState] = useState<MicrophoneState>('idle');
  const [liveSamples, setLiveSamples] = useState<number[]>(() => demoSamples(demoFrequencyHz, demoAmplitude));
  const [liveFrequency, setLiveFrequency] = useState<number | null>(null);
  const [liveAmplitude, setLiveAmplitude] = useState(0);
  const [sampleWindowMs, setSampleWindowMs] = useState(DEMO_WINDOW_SECONDS * 1000);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastPaintRef = useRef(0);
  const { announce } = useAnnouncer();

  const stopMicrophone = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const context = contextRef.current;
    contextRef.current = null;
    if (context && context.state !== 'closed') void context.close();
  }, []);

  useEffect(() => stopMicrophone, [stopMicrophone]);

  useEffect(() => {
    if (mode !== 'demo') return;
    setLiveSamples(demoSamples(demoFrequencyHz, demoAmplitude));
    setLiveFrequency(demoFrequencyHz);
    setLiveAmplitude(demoAmplitude);
    setSampleWindowMs(DEMO_WINDOW_SECONDS * 1000);
  }, [demoAmplitude, demoFrequencyHz, mode]);

  const chooseMode = (nextMode: CaptureMode) => {
    if (nextMode === mode) return;
    if (nextMode === 'demo') {
      stopMicrophone();
      setMicrophoneState('idle');
      announce('Demo tone mode selected. The waveform follows the frequency and output level controls.');
    } else {
      announce('Microphone mode selected. Start the microphone when you are ready.');
    }
    setMode(nextMode);
  };

  const startMicrophone = async () => {
    stopMicrophone();
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) {
      setMicrophoneState('unsupported');
      setMode('demo');
      announce('Microphone capture is unavailable. Demo tone mode is ready instead.');
      return;
    }
    setMicrophoneState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      });
      const context = new AudioContext();
      await context.resume();
      const analyser = context.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.15;
      context.createMediaStreamSource(stream).connect(analyser);
      streamRef.current = stream;
      contextRef.current = context;
      setSampleWindowMs(analyser.fftSize / context.sampleRate * 1000);
      setMicrophoneState('live');
      announce('Microphone is live. Play or sing one steady tone near this laptop.');

      const buffer = new Float32Array(analyser.fftSize);
      const sample = (time: number) => {
        analyser.getFloatTimeDomainData(buffer);
        if (time - lastPaintRef.current >= 50) {
          lastPaintRef.current = time;
          const rms = calculateRms(buffer);
          const frequency = estimateFundamentalFrequency(buffer, context.sampleRate);
          const step = Math.max(1, Math.floor(buffer.length / TRACE_POINTS));
          setLiveSamples(Array.from({ length: TRACE_POINTS }, (_, index) => buffer[index * step] ?? 0));
          setLiveAmplitude(Math.min(1, rms * 5));
          setLiveFrequency(frequency);
        }
        frameRef.current = requestAnimationFrame(sample);
      };
      frameRef.current = requestAnimationFrame(sample);
    } catch (error) {
      stopMicrophone();
      const denied = error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError');
      setMicrophoneState(denied ? 'denied' : 'error');
      setMode('demo');
      announce('Microphone did not start. Demo tone mode is ready instead.');
    }
  };

  const shownFrequency = mode === 'demo' ? demoFrequencyHz : liveFrequency;
  const shownAmplitude = mode === 'demo' ? demoAmplitude : liveAmplitude;
  const wavelength = shownFrequency && shownFrequency > 0 ? ASSUMED_SOUND_SPEED / shownFrequency : null;
  const amplitudePercent = Math.round(shownAmplitude * 100);
  const statusText = microphoneState === 'denied'
    ? 'Microphone permission was not granted. Demo mode is active and fully usable.'
    : microphoneState === 'unsupported'
      ? 'This browser cannot capture the microphone here. Demo mode is active.'
      : microphoneState === 'error'
        ? 'The microphone could not start. Check that another app is not using it. Demo mode is active.'
        : null;
  const path = useMemo(() => tracePath(liveSamples), [liveSamples]);

  return (
    <section className="live-sound card stack" aria-labelledby="live-sound-title" data-testid="live-sound-visualiser">
      <div className="live-sound__heading">
        <div>
          <p className="live-sound__eyebrow">Primary classroom activity · 7.2.2</p>
          <h2 id="live-sound-title">2. Students: listen and see the sound</h2>
          <p>Use <strong>Microphone</strong> on student laptops while the teacher plays a steady tone, or use <strong>Demo tone</strong> without permission.</p>
        </div>
        <fieldset className="seg-control live-sound__mode">
          <legend className="seg-control__legend">Signal source</legend>
          <div className="seg-control__options" role="radiogroup" aria-label="Sound visualiser signal source">
            <label className="seg-control__option">
              <input type="radio" name="capture-mode" checked={mode === 'demo'} onChange={() => chooseMode('demo')} data-testid="capture-demo" />
              Demo tone
            </label>
            <label className="seg-control__option">
              <input type="radio" name="capture-mode" checked={mode === 'microphone'} onChange={() => chooseMode('microphone')} data-testid="capture-microphone" />
              Microphone
            </label>
          </div>
        </fieldset>
      </div>

      {mode === 'microphone' ? (
        <div className="live-sound__mic-actions">
          <button type="button" className="btn btn--primary" onClick={() => void startMicrophone()} disabled={microphoneState === 'requesting'} data-testid="start-microphone">
            {microphoneState === 'requesting' ? 'Waiting for permission…' : microphoneState === 'live' ? 'Restart microphone' : 'Start microphone'}
          </button>
          {microphoneState === 'live' ? <p className="live-sound__live" role="status"><span aria-hidden="true">●</span> Listening on this device only</p> : null}
        </div>
      ) : null}
      {statusText ? <p className="notice" role="status" data-testid="microphone-fallback"><span>{statusText}</span></p> : null}

      <div className="live-sound__concept" aria-label="Key relationship">
        <strong>Frequency → pitch</strong>
        <span aria-hidden="true">·</span>
        <strong>Amplitude → loudness</strong>
      </div>

      <figure className="live-trace" data-testid="live-waveform">
        <figcaption>
          Time-domain trace · {formatSigFigs(sampleWindowMs)} ms window
          <span>Closer cycles = higher frequency · Taller peaks = greater amplitude</span>
        </figcaption>
        <svg viewBox="0 0 640 240" role="img" aria-label={`Waveform over time. ${pitchDescription(shownFrequency)}. Relative amplitude ${amplitudePercent} percent.`}>
          <g className="live-trace__grid" aria-hidden="true">
            <line x1="18" x2="622" y1="32" y2="32" />
            <line x1="18" x2="622" y1="76" y2="76" />
            <line x1="18" x2="622" y1="120" y2="120" />
            <line x1="18" x2="622" y1="164" y2="164" />
            <line x1="18" x2="622" y1="208" y2="208" />
          </g>
          <line x1="18" x2="622" y1="120" y2="120" className="live-trace__axis" />
          <path d={path} className="live-trace__wave" />
          <text x="18" y="228">0 ms</text>
          <text x="622" y="228" textAnchor="end">{formatSigFigs(sampleWindowMs)} ms</text>
        </svg>
      </figure>

      <div className="live-sound__readouts" aria-live="polite">
        <div data-testid="live-frequency"><span>Frequency</span><strong>{shownFrequency === null ? '—' : `${Math.round(shownFrequency)} Hz`}</strong><small>{pitchDescription(shownFrequency)}</small></div>
        <div data-testid="live-amplitude"><span>Relative amplitude</span><strong>{amplitudePercent}%</strong><small>{relativeLoudnessDescription(shownAmplitude)}</small></div>
        <div data-testid="live-wavelength"><span>Estimated wavelength</span><strong>{wavelength === null ? '—' : `${formatSigFigs(wavelength)} m`}</strong><small>Assuming sound speed = 343 m/s</small></div>
      </div>

      <p className="live-sound__measurement-note">
        <strong>What the microphone measures:</strong> air-pressure change over <em>time</em>, so frequency and relative amplitude can be estimated directly. It does <strong>not</strong> measure wavelength. The wavelength shown is calculated using λ = v ÷ f and an assumed sound speed of 343 m/s in air at about 20 °C.
      </p>
      <p className="seg-control__note">For clearer results, use one steady tone, reduce nearby talking, and keep each laptop a comfortable distance from the speaker. This is not a calibrated decibel meter and no audio is recorded or uploaded.</p>
    </section>
  );
}
