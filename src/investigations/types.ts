/**
 * Investigation framework — trials, tables, and export for the controlled-
 * variable wave-measurement investigation (λ vs 1/f at fixed v). Pure TS.
 */

export interface Trial {
  id: string;
  /** Preset / medium label the trial was recorded under. */
  medium: string;
  /** Source frequency (Hz, SI). */
  frequencyHz: number;
  /** Measured / derived wavelength (m, SI). */
  wavelengthM: number;
  /** Fixed medium speed (m/s, SI). */
  speedMps: number;
}

/** 1/f for the trial (s) — the controlled-variable investigation plots λ vs 1/f. */
export function inverseFrequency(t: Trial): number {
  return t.frequencyHz === 0 ? 0 : 1 / t.frequencyHz;
}

export interface InvestigationExport {
  schema: 'wavemotion.investigation';
  version: 1;
  title: string;
  exportedAt: string;
  fixedSpeedMps: number | null;
  columns: string[];
  trials: Trial[];
}
