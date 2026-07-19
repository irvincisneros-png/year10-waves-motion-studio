/**
 * Physical constants and medium presets for the wave laboratory.
 *
 * SCIENTIFIC CONTRACT (SCIENCE_REVIEW.md §6, §16): no medium speed appears in
 * the app without a source and a review date. Sourced constants below are
 * copied EXACTLY from SCIENCE_REVIEW.md §6.2 and stored at full precision;
 * display rounding happens only at the UI layer (units.ts / equations.ts).
 *
 * Rope and water-surface measurement presets are NOT sourced physical
 * constants — they are clearly-labelled MODELLED teaching values chosen to
 * give readable wavelengths. SCIENCE_REVIEW.md §6.1 permits stated
 * simplifications; these are flagged `modelled: true` and surfaced in-app as
 * "modelled value, not a measured constant". This is recorded in the Stage 2
 * evidence pack as a divergence from §6.2 (which lists only sound + EM).
 *
 * No React imports — this module is pure data/TypeScript (IMPLEMENTATION_PLAN §5).
 */

/** Speed of light in vacuum, exact by SI definition (SCIENCE_REVIEW §6.2). */
export const LIGHT_SPEED_MPS = 299_792_458;

export const CONSTANTS_REVIEW_DATE = '2026-07-17';

export type MediumKind = 'mechanical' | 'electromagnetic' | 'vacuum';

export interface MediumPreset {
  id: string;
  label: string;
  /** Exact stored speed in m/s. `null` for vacuum (no mechanical transmission). */
  speedMps: number | null;
  kind: MediumKind;
  conditions: string;
  source: string;
  reviewDate: string;
  /** True when the speed is a modelled teaching value, not a sourced constant. */
  modelled?: boolean;
}

/**
 * Sourced mechanical + EM speeds (SCIENCE_REVIEW §6.2). Used by the
 * medium/vacuum/EM comparison (7.1.1) and as the Sound + EM measurement presets.
 */
export const SOUND_AIR: MediumPreset = {
  id: 'sound-air',
  label: 'Sound in dry air',
  speedMps: 343,
  kind: 'mechanical',
  conditions: 'dry air, 20 °C, 1 atm (from v = 331.3·√(1+T/273.15))',
  source: 'NIST / standard acoustics reference; ISO 9613-1 reference conditions',
  reviewDate: CONSTANTS_REVIEW_DATE,
};

export const SOUND_FRESH_WATER: MediumPreset = {
  id: 'sound-fresh-water',
  label: 'Sound in fresh water',
  speedMps: 1480,
  kind: 'mechanical',
  conditions: 'fresh water, ≈20 °C',
  source: 'NIST / standard acoustics reference (fresh water ~1480 m/s at 20 °C)',
  reviewDate: CONSTANTS_REVIEW_DATE,
};

export const SOUND_SEAWATER: MediumPreset = {
  id: 'sound-seawater',
  label: 'Sound in seawater',
  speedMps: 1500,
  kind: 'mechanical',
  conditions: 'seawater, ≈20 °C, typical salinity (nominal teaching value)',
  source: 'Standard oceanographic acoustics reference',
  reviewDate: CONSTANTS_REVIEW_DATE,
};

export const SOUND_STEEL: MediumPreset = {
  id: 'sound-steel',
  label: 'Sound in steel',
  speedMps: 5960,
  kind: 'mechanical',
  conditions: 'longitudinal (bar/bulk) wave in mild steel, ~20 °C',
  source: 'Standard engineering-materials acoustics reference',
  reviewDate: CONSTANTS_REVIEW_DATE,
};

export const EM_VACUUM: MediumPreset = {
  id: 'em-vacuum',
  label: 'Light / EM in vacuum',
  speedMps: LIGHT_SPEED_MPS,
  kind: 'electromagnetic',
  conditions: 'vacuum; exact defined c = 299 792 458 m/s',
  source: 'CODATA / SI defining constant (exact by definition)',
  reviewDate: CONSTANTS_REVIEW_DATE,
};

/** An evacuated chamber: mechanical waves cannot propagate (no medium). */
export const VACUUM_CHAMBER: MediumPreset = {
  id: 'vacuum',
  label: 'Vacuum (no medium)',
  speedMps: null,
  kind: 'vacuum',
  conditions: 'evacuated chamber — no particles to carry a mechanical wave',
  source: 'Definitional (mechanical waves require a medium, SCIENCE_REVIEW §6.1)',
  reviewDate: CONSTANTS_REVIEW_DATE,
};

/**
 * The three synchronised chambers for the "Medium or vacuum?" comparison
 * (7.1.1). Order is meaningful for display: mechanical, vacuum, EM.
 */
export const CHAMBER_PRESETS: readonly MediumPreset[] = [
  SOUND_AIR,
  VACUUM_CHAMBER,
  EM_VACUUM,
];

/**
 * A measurement-lab preset: fixed medium speed + teaching-sensible frequency
 * range + suggested display units so wavelengths read cleanly. Frequency range
 * is what the investigation sweeps; speed is fixed (medium sets speed,
 * SCIENCE_REVIEW §2.4, §6.3), so λ = v/f is the dependent quantity.
 */
export interface MeasurementPreset {
  id: string;
  label: string;
  medium: MediumPreset;
  /** Fixed wave speed for this preset (m/s). Never null here. */
  speedMps: number;
  /** Inclusive source-frequency range (Hz) the lab exposes for this preset. */
  freqRangeHz: [number, number];
  /** Default source frequency (Hz). */
  defaultFreqHz: number;
  /** Suggested display units. */
  freqUnit: 'Hz' | 'kHz' | 'MHz' | 'GHz';
  lengthUnit: 'm' | 'cm' | 'mm' | 'µm' | 'nm';
  /** Short honest note about the model. */
  note: string;
}

export const MEASUREMENT_PRESETS: readonly MeasurementPreset[] = [
  {
    id: 'rope',
    label: 'Rope',
    medium: {
      id: 'rope',
      label: 'Wave on a rope',
      speedMps: 4,
      kind: 'mechanical',
      conditions: 'transverse pulse on a stretched rope',
      source:
        'Modelled teaching value (not a measured constant) — a rope-wave speed depends on tension and mass per length; 4 m/s chosen for readable wavelengths.',
      reviewDate: CONSTANTS_REVIEW_DATE,
      modelled: true,
    },
    speedMps: 4,
    freqRangeHz: [0.5, 5],
    defaultFreqHz: 2,
    freqUnit: 'Hz',
    lengthUnit: 'm',
    note: 'Rope speed is a modelled teaching value, not a measured constant.',
  },
  {
    id: 'water',
    label: 'Water surface (conceptual)',
    medium: {
      id: 'water-surface',
      label: 'Water-surface ripple (conceptual)',
      speedMps: 0.3,
      kind: 'mechanical',
      conditions: 'shallow ripple-tank surface wave',
      source:
        'Modelled teaching value (not a measured constant); water-surface waves are NOT perfectly transverse (particles move in near-circular paths) — treated as a special surface case per SCIENCE_REVIEW §4.',
      reviewDate: CONSTANTS_REVIEW_DATE,
      modelled: true,
    },
    speedMps: 0.3,
    freqRangeHz: [1, 10],
    defaultFreqHz: 4,
    freqUnit: 'Hz',
    lengthUnit: 'cm',
    note: 'Conceptual only — water-surface waves are not perfectly transverse.',
  },
  {
    id: 'sound',
    label: 'Sound in air',
    medium: SOUND_AIR,
    speedMps: 343,
    freqRangeHz: [100, 1000],
    defaultFreqHz: 440,
    freqUnit: 'Hz',
    lengthUnit: 'm',
    note: 'Sound speed 343 m/s (dry air, 20 °C) — SCIENCE_REVIEW §6.2.',
  },
  {
    id: 'em',
    label: 'Electromagnetic (vacuum)',
    medium: EM_VACUUM,
    speedMps: LIGHT_SPEED_MPS,
    freqRangeHz: [50e6, 300e6],
    defaultFreqHz: 100e6,
    freqUnit: 'MHz',
    lengthUnit: 'm',
    note: 'EM speed c = 3.00 × 10⁸ m/s (vacuum) — SCIENCE_REVIEW §6.2.',
  },
];

export function measurementPresetById(id: string): MeasurementPreset | undefined {
  return MEASUREMENT_PRESETS.find((p) => p.id === id);
}
