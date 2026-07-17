import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Simulation clock driving every wave animation.
 *
 * The clock advances real-engine time `t` via requestAnimationFrame ONLY when
 * running, not reduced-motion, the scene is active (not static), and the tab is
 * visible (IMPLEMENTATION_PLAN §6: "rAF paused when tab hidden or scene
 * static"). In reduced-motion mode it never autoplays — the user advances with
 * the Step button. A low-graphics setting changes rendering elsewhere, never
 * this clock.
 */

const STEP_SECONDS = 1 / 30;

export interface SimClockOptions {
  running: boolean;
  /** Playback multiplier (1, 0.5, 0.25). */
  speed: number;
  /** When true, no autoplay — stepped frames only. */
  reducedMotion: boolean;
  /** When false the scene is static; the rAF loop is not scheduled. */
  active: boolean;
}

export interface SimClock {
  t: number;
  step: () => void;
  reset: () => void;
  /** Whether the rAF loop is currently advancing (for tests/debug). */
  isAnimating: boolean;
}

export function useSimClock(opts: SimClockOptions): SimClock {
  const { running, speed, reducedMotion, active } = opts;
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(
    typeof document === 'undefined' ? true : !document.hidden,
  );

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const shouldAnimate = running && active && !reducedMotion && visible;

  useEffect(() => {
    if (!shouldAnimate) {
      lastRef.current = null;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    const tick = (now: number) => {
      if (lastRef.current !== null) {
        const dt = (now - lastRef.current) / 1000;
        setT((prev) => prev + dt * speed);
      }
      lastRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = null;
    };
  }, [shouldAnimate, speed]);

  const step = useCallback(() => {
    setT((prev) => prev + STEP_SECONDS * speed);
  }, [speed]);

  const reset = useCallback(() => setT(0), []);

  return { t, step, reset, isAnimating: shouldAnimate };
}
