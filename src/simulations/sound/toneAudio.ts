/**
 * Web Audio tone controller — implements the safety contract in SCIENCE_REVIEW
 * §12.5 and CONTROL_INVENTORY §1/§4 exactly:
 *  - user-initiated only: NO AudioContext is constructed until enable() is called
 *    from an explicit user gesture (no autoplay, no mount-time probing);
 *  - default muted and safe low level: the gain starts at 0 (muted) and the
 *    output level defaults to a low value;
 *  - hard-capped gain: the linear gain can never exceed MAX_SAFE_GAIN, whatever
 *    is requested (including scripted/out-of-band values);
 *  - graceful failure: if the API is absent or construction throws, enable()
 *    returns false and the caller falls back to visual-only mode.
 *
 * This module is NOT under src/science (it touches the browser Web Audio API);
 * the pure, React-free sound model lives in src/science/sound.ts.
 */

import type { Waveform } from '../../science/sound';

/** Hard cap on the linear output gain (well below a harmful level). */
export const MAX_SAFE_GAIN = 0.15;

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/**
 * Whether the Web Audio API is present at all. This is a pure existence check —
 * it constructs NOTHING, so calling it on mount does not create an AudioContext.
 */
export function audioApiPresent(): boolean {
  return getAudioContextCtor() !== null;
}

export class ToneAudioController {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private level = 0.2;
  private muted = true;
  private frequency = 440;
  private waveform: Waveform = 'sine';

  /** True once enable() has successfully built the audio graph. */
  get running(): boolean {
    return this.ctx !== null;
  }

  /**
   * Build the audio graph from an explicit user gesture. Returns false (and
   * leaves nothing constructed) if the API is missing or construction throws.
   */
  async enable(): Promise<boolean> {
    if (this.ctx) return true;
    const Ctor = getAudioContextCtor();
    if (!Ctor) return false;
    let localContext: AudioContext | null = null;
    try {
      const ctx = new Ctor();
      localContext = ctx;
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0; // muted start (safety contract)
      const osc = ctx.createOscillator();
      osc.type = this.waveform;
      osc.frequency.value = this.frequency;
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      this.ctx = ctx;
      this.gainNode = gainNode;
      this.osc = osc;
      // Some browsers start the context suspended until a gesture resumes it.
      if (ctx.state === 'suspended') await ctx.resume();
      this.applyGain();
      return true;
    } catch {
      if (this.ctx) {
        this.teardown();
      } else if (localContext) {
        try {
          await localContext.close();
        } catch {
          // The local context never became usable; there is nothing else to clean up.
        }
      }
      return false;
    }
  }

  private applyGain(): void {
    if (!this.gainNode || !this.ctx) return;
    const safeLevel = Math.max(0, Math.min(1, this.level));
    const target = this.muted ? 0 : safeLevel * MAX_SAFE_GAIN;
    try {
      this.gainNode.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02);
    } catch {
      this.gainNode.gain.value = target;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyGain();
  }

  /** Set the output level (0–1). Clamped; the hard gain cap is applied in applyGain. */
  setLevel(level: number): void {
    this.level = Number.isFinite(level) ? Math.max(0, Math.min(1, level)) : 0;
    this.applyGain();
  }

  setFrequency(hz: number): void {
    this.frequency = hz;
    if (this.osc && this.ctx) {
      try {
        this.osc.frequency.setTargetAtTime(hz, this.ctx.currentTime, 0.01);
      } catch {
        this.osc.frequency.value = hz;
      }
    }
  }

  setWaveform(waveform: Waveform): void {
    this.waveform = waveform;
    if (this.osc) this.osc.type = waveform;
  }

  stop(): void {
    this.teardown();
  }

  private teardown(): void {
    try {
      this.osc?.stop();
    } catch {
      /* already stopped */
    }
    try {
      void this.ctx?.close();
    } catch {
      /* already closed */
    }
    this.osc = null;
    this.gainNode = null;
    this.ctx = null;
  }
}
