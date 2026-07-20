import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Waveform } from '../../science/sound';
import { audioApiPresent, ToneAudioController } from './toneAudio';

/**
 * React wrapper around ToneAudioController. `phase` is:
 *  - 'unsupported' when the Web Audio API is entirely absent (visual-only is
 *    then auto-enabled and locked by the UI);
 *  - 'locked' before the user enables sound (nothing is constructed);
 *  - 'enabled' once the audio graph is live;
 *  - 'failed' if enabling threw (denied/blocked) — visual-only fallback.
 *
 * No AudioContext is ever constructed until enable() runs from a user gesture.
 */
export type AudioPhase = 'unsupported' | 'locked' | 'enabled' | 'failed';

export interface ToneAudio {
  supported: boolean;
  phase: AudioPhase;
  muted: boolean;
  enable: () => Promise<boolean>;
  setMuted: (muted: boolean) => void;
  setLevel: (level: number) => void;
  setFrequency: (hz: number) => void;
  setWaveform: (waveform: Waveform) => void;
}

export function useToneAudio(): ToneAudio {
  const ref = useRef<ToneAudioController | null>(null);
  const [supported] = useState(() => audioApiPresent());
  const [phase, setPhase] = useState<AudioPhase>(supported ? 'locked' : 'unsupported');
  const [muted, setMutedState] = useState(true);

  const enable = useCallback(async (): Promise<boolean> => {
    if (!supported) {
      setPhase('unsupported');
      return false;
    }
    if (ref.current?.running) return true;
    const controller = new ToneAudioController();
    const ok = await controller.enable();
    if (!ok) {
      setPhase('failed');
      return false;
    }
    ref.current = controller;
    setMutedState(true);
    setPhase('enabled');
    return true;
  }, [supported]);

  const setMuted = useCallback((next: boolean) => {
    setMutedState(next);
    ref.current?.setMuted(next);
  }, []);

  const setLevel = useCallback((level: number) => {
    ref.current?.setLevel(level);
  }, []);

  const setFrequency = useCallback((hz: number) => {
    ref.current?.setFrequency(hz);
  }, []);

  const setWaveform = useCallback((waveform: Waveform) => {
    ref.current?.setWaveform(waveform);
  }, []);

  // Tear the audio graph down on unmount so no oscillator leaks between routes.
  useEffect(() => {
    return () => {
      ref.current?.stop();
      ref.current = null;
    };
  }, []);

  return useMemo(
    () => ({ supported, phase, muted, enable, setMuted, setLevel, setFrequency, setWaveform }),
    [supported, phase, muted, enable, setMuted, setLevel, setFrequency, setWaveform],
  );
}
