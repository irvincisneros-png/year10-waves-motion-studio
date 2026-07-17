import { useEffect, useState } from 'react';

/**
 * Reports whether motion should be reduced, combining the OS-level
 * `prefers-reduced-motion` media query with the app's manual override.
 *
 * The `manualOverride` argument is the user's setting: when `true` it forces
 * reduced motion regardless of the OS preference. Stage 2+ components use the
 * returned boolean to render static/stepped equivalents.
 */
export function useReducedMotion(manualOverride = false): boolean {
  const [systemPrefers, setSystemPrefers] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setSystemPrefers(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return manualOverride || systemPrefers;
}

/** Reads the OS `prefers-reduced-motion` preference once (non-reactive). */
export function prefersReducedMotionNow(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
