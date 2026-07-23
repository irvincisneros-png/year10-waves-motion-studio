export type MatterChoice = 'travels' | 'oscillates' | null;

export const WAVE_RIDER_TARGETS = {
  amplitudeM: 1.5,
  frequencyHz: 1.2,
  mediumSpeedMps: 6,
  wavelengthM: 5,
} as const;

const closeTo = (value: number, target: number, tolerance: number) =>
  Math.abs(value - target) <= tolerance;

/** Wave speed is set by the medium in this simplified, non-dispersive model. */
export function waveSpeed(frequencyHz: number, wavelengthM: number) {
  return frequencyHz * wavelengthM;
}

/** Relative wave-energy index for a fixed medium: energy scales with A². */
export function relativeEnergy(amplitudeM: number) {
  return amplitudeM ** 2;
}

/** A medium particle oscillates about its immutable home position. */
export function particlePosition(
  homeY: number,
  amplitudeM: number,
  phaseRadians: number,
) {
  return homeY + amplitudeM * Math.sin(phaseRadians);
}

export function scoreMatterGate(choice: MatterChoice) {
  return choice === 'oscillates';
}

export function scoreEnergyGate(amplitudeM: number) {
  return closeTo(amplitudeM, WAVE_RIDER_TARGETS.amplitudeM, 0.05);
}

export function scoreSpeedGate(wavelengthM: number) {
  const speed = waveSpeed(WAVE_RIDER_TARGETS.frequencyHz, wavelengthM);
  return closeTo(speed, WAVE_RIDER_TARGETS.mediumSpeedMps, 0.06);
}

export function directionalHint(value: number, target: number) {
  if (closeTo(value, target, 0.05)) return 'Setting locked. Ride the checkpoint.';
  return value < target ? 'Tune higher.' : 'Tune lower.';
}

export interface WaveRiderGate {
  id: string;
  outcome: string;
  prompt: string;
  options: readonly [string, string, string];
  correctLane: 0 | 1 | 2;
  explanation: string;
}

/**
 * Fixed challenges keep every replay fair and make the science auditable.
 * The lane varies, so students must read rather than learn one steering pattern.
 */
export const WAVE_RIDER_GATES: readonly WaveRiderGate[] = [
  {
    id: 'energy-transfer',
    outcome: '7.1.2',
    prompt: 'A pulse crosses a rope. What travels to the far end?',
    options: ['The rope particles', 'Energy', 'The whole rope'],
    correctLane: 1,
    explanation: 'Energy travels across the rope while its particles oscillate near their home positions.',
  },
  {
    id: 'mechanical-medium',
    outcome: '7.1.1',
    prompt: 'Which wave needs matter as a medium to travel?',
    options: ['Visible light', 'A sound wave', 'A radio wave'],
    correctLane: 1,
    explanation: 'Sound is mechanical and requires a medium; visible light and radio are electromagnetic waves.',
  },
  {
    id: 'amplitude-energy',
    outcome: '7.1.5',
    prompt: 'In the same medium, amplitude doubles. What changes?',
    options: ['Speed doubles', 'Relative energy becomes 4×', 'Wavelength doubles'],
    correctLane: 1,
    explanation: 'For this model, relative energy scales with amplitude squared; wave speed stays fixed by the medium.',
  },
  {
    id: 'transverse-motion',
    outcome: '7.1.3',
    prompt: 'How do particles vibrate in a transverse wave model?',
    options: ['Parallel to travel', 'They travel with the wave', 'Perpendicular to travel'],
    correctLane: 2,
    explanation: 'Transverse-model displacement is perpendicular to the direction of energy transfer.',
  },
  {
    id: 'wave-equation',
    outcome: '7.1.6',
    prompt: 'Speed is 6 m/s and frequency is 1.2 Hz. Choose λ = v/f.',
    options: ['3.0 m', '7.2 m', '5.0 m'],
    correctLane: 2,
    explanation: 'λ = v/f = 6 ÷ 1.2 = 5.0 m.',
  },
  {
    id: 'fixed-medium',
    outcome: '7.1.6',
    prompt: 'Speed stays fixed while frequency increases. What must happen?',
    options: ['Wavelength gets shorter', 'Amplitude falls to zero', 'Speed increases'],
    correctLane: 0,
    explanation: 'Because λ = v/f, a larger frequency gives a shorter wavelength when speed is fixed.',
  },
  {
    id: 'em-frequency',
    outcome: '7.1.4',
    prompt: 'Which EM wave has the greatest frequency?',
    options: ['Radio waves', 'Visible light', 'Gamma rays'],
    correctLane: 2,
    explanation: 'Gamma rays have the greatest frequency and shortest wavelength in the EM spectrum.',
  },
  {
    id: 'em-use',
    outcome: '7.1.7',
    prompt: 'Which EM wave is commonly used to image broken bones?',
    options: ['X-rays', 'Microwaves', 'Radio waves'],
    correctLane: 0,
    explanation: 'X-rays pass through soft tissue more readily than bone, producing useful contrast in medical images.',
  },
  {
    id: 'pitch-frequency',
    outcome: '7.2.2',
    prompt: 'Which change makes a sound higher in pitch?',
    options: ['Greater amplitude', 'Greater frequency', 'Lower wave speed'],
    correctLane: 1,
    explanation: 'Pitch rises when sound frequency increases; amplitude mainly affects loudness.',
  },
  {
    id: 'light-reflection',
    outcome: '7.3.2',
    prompt: 'A light ray reflects from a flat mirror. Which rule applies?',
    options: ['Angle in equals angle out', 'Frequency becomes zero', 'Light needs a material medium'],
    correctLane: 0,
    explanation: 'For reflection, the angle of incidence equals the angle of reflection.',
  },
] as const;

export const WAVE_RIDER_GATE_DISTANCES = [105, 205, 355, 495, 650, 805, 985, 1165, 1380, 1595] as const;
export const WAVE_RIDER_FINISH_DISTANCE = 1710;

export type WaveRiderPowerupKind = 'speed' | 'life' | 'jump' | 'shield';

export interface WaveRiderPowerupQuestion {
  id: string;
  outcome: string;
  prompt: string;
  options: readonly [string, string, string];
  correctIndex: 0 | 1 | 2;
  explanation: string;
}

export const WAVE_RIDER_POWERUP_QUESTIONS: readonly WaveRiderPowerupQuestion[] = [
  {
    id: 'power-energy', outcome: '7.1.2',
    prompt: 'What does a wave transfer from place to place?',
    options: ['Energy', 'All medium particles', 'The entire medium'], correctIndex: 0,
    explanation: 'A wave transfers energy without net transfer of the medium particles.',
  },
  {
    id: 'power-amplitude', outcome: '7.1.5',
    prompt: 'Which feature measures maximum displacement from equilibrium?',
    options: ['Frequency', 'Amplitude', 'Wave speed'], correctIndex: 1,
    explanation: 'Amplitude is the maximum displacement from the equilibrium position.',
  },
  {
    id: 'power-formula', outcome: '7.1.6',
    prompt: 'A wave travels at 12 m/s with f = 3 Hz. What is λ?',
    options: ['4 m', '9 m', '36 m'], correctIndex: 0,
    explanation: 'λ = v/f = 12 ÷ 3 = 4 m.',
  },
  {
    id: 'power-spectrum', outcome: '7.1.4',
    prompt: 'Which EM wave has the longest wavelength?',
    options: ['Gamma rays', 'Ultraviolet', 'Radio waves'], correctIndex: 2,
    explanation: 'Radio waves occupy the longest-wavelength end of the EM spectrum.',
  },
  {
    id: 'power-sound', outcome: '7.2.1',
    prompt: 'Sound travels through air as alternating…',
    options: ['Crests and troughs only', 'Compressions and rarefactions', 'Light and dark bands'], correctIndex: 1,
    explanation: 'Sound in air is modelled as compressions and rarefactions.',
  },
  {
    id: 'power-refraction', outcome: '7.3.2',
    prompt: 'When light enters a new medium, which quantity stays fixed?',
    options: ['Frequency', 'Speed', 'Wavelength'], correctIndex: 0,
    explanation: 'Frequency is fixed by the source; speed and wavelength can change in a new medium.',
  },
] as const;

export interface WaveRiderStage {
  id: string;
  name: string;
  tagline: string;
  startDistance: number;
  finishDistance: number;
  speedMultiplier: number;
  outcomes: readonly string[];
}

export const WAVE_RIDER_STAGES: readonly WaveRiderStage[] = [
  { id: 'lagoon', name: 'Particle Lagoon', tagline: 'Learn the current and track what waves transfer.', startDistance: 0, finishDistance: 250, speedMultiplier: 0.78, outcomes: ['7.1.1', '7.1.2'] },
  { id: 'reef', name: 'Feature Reef', tagline: 'Read particle motion while the hazard field thickens.', startDistance: 250, finishDistance: 550, speedMultiplier: 0.9, outcomes: ['7.1.3', '7.1.5'] },
  { id: 'current', name: 'Formula Current', tagline: 'Calculate fast: the current now changes lanes around you.', startDistance: 550, finishDistance: 880, speedMultiplier: 1.02, outcomes: ['7.1.6'] },
  { id: 'storm', name: 'Spectrum Storm', tagline: 'Navigate dense obstacles using EM spectrum evidence.', startDistance: 880, finishDistance: 1235, speedMultiplier: 1.13, outcomes: ['7.1.4', '7.1.7'] },
  { id: 'maelstrom', name: 'Mastery Maelstrom', tagline: 'Survive the fastest mixed-syllabus final course.', startDistance: 1235, finishDistance: WAVE_RIDER_FINISH_DISTANCE, speedMultiplier: 1.28, outcomes: ['7.1–7.3'] },
] as const;

export type WaveRiderCourseEvent =
  | { id: string; type: 'gate'; distance: number; gateIndex: number }
  | { id: string; type: 'hazard'; distance: number; lane: 0 | 1 | 2; kind: 'shark' | 'debris' | 'whirlpool' | 'reef' }
  | { id: string; type: 'powerup'; distance: number; lane: 0 | 1 | 2; powerup: WaveRiderPowerupKind; questionIndex: number };

export const WAVE_RIDER_COURSE: readonly WaveRiderCourseEvent[] = [
  { id: 'power-1', type: 'powerup', distance: 42, lane: 1, powerup: 'speed', questionIndex: 0 },
  { id: 'shark-1', type: 'hazard', distance: 72, lane: 0, kind: 'shark' },
  { id: 'gate-1', type: 'gate', distance: WAVE_RIDER_GATE_DISTANCES[0], gateIndex: 0 },
  { id: 'debris-1', type: 'hazard', distance: 150, lane: 2, kind: 'debris' },
  { id: 'power-2', type: 'powerup', distance: 180, lane: 0, powerup: 'life', questionIndex: 1 },
  { id: 'gate-2', type: 'gate', distance: WAVE_RIDER_GATE_DISTANCES[1], gateIndex: 1 },

  { id: 'reef-1', type: 'hazard', distance: 290, lane: 1, kind: 'reef' },
  { id: 'power-3', type: 'powerup', distance: 320, lane: 2, powerup: 'jump', questionIndex: 1 },
  { id: 'gate-3', type: 'gate', distance: WAVE_RIDER_GATE_DISTANCES[2], gateIndex: 2 },
  { id: 'shark-2', type: 'hazard', distance: 400, lane: 2, kind: 'shark' },
  { id: 'debris-2', type: 'hazard', distance: 440, lane: 0, kind: 'debris' },
  { id: 'gate-4', type: 'gate', distance: WAVE_RIDER_GATE_DISTANCES[3], gateIndex: 3 },
  { id: 'whirlpool-1', type: 'hazard', distance: 530, lane: 1, kind: 'whirlpool' },

  { id: 'power-4', type: 'powerup', distance: 590, lane: 1, powerup: 'shield', questionIndex: 2 },
  { id: 'shark-3', type: 'hazard', distance: 620, lane: 0, kind: 'shark' },
  { id: 'gate-5', type: 'gate', distance: WAVE_RIDER_GATE_DISTANCES[4], gateIndex: 4 },
  { id: 'debris-3', type: 'hazard', distance: 700, lane: 2, kind: 'debris' },
  { id: 'whirlpool-2', type: 'hazard', distance: 745, lane: 0, kind: 'whirlpool' },
  { id: 'power-5', type: 'powerup', distance: 775, lane: 2, powerup: 'speed', questionIndex: 2 },
  { id: 'gate-6', type: 'gate', distance: WAVE_RIDER_GATE_DISTANCES[5], gateIndex: 5 },
  { id: 'reef-2', type: 'hazard', distance: 850, lane: 1, kind: 'reef' },

  { id: 'shark-4', type: 'hazard', distance: 915, lane: 2, kind: 'shark' },
  { id: 'power-6', type: 'powerup', distance: 945, lane: 0, powerup: 'life', questionIndex: 3 },
  { id: 'gate-7', type: 'gate', distance: WAVE_RIDER_GATE_DISTANCES[6], gateIndex: 6 },
  { id: 'whirlpool-3', type: 'hazard', distance: 1030, lane: 1, kind: 'whirlpool' },
  { id: 'debris-4', type: 'hazard', distance: 1070, lane: 2, kind: 'debris' },
  { id: 'power-7', type: 'powerup', distance: 1110, lane: 1, powerup: 'jump', questionIndex: 3 },
  { id: 'gate-8', type: 'gate', distance: WAVE_RIDER_GATE_DISTANCES[7], gateIndex: 7 },
  { id: 'shark-5', type: 'hazard', distance: 1205, lane: 0, kind: 'shark' },

  { id: 'power-8', type: 'powerup', distance: 1280, lane: 2, powerup: 'shield', questionIndex: 4 },
  { id: 'debris-5', type: 'hazard', distance: 1320, lane: 1, kind: 'debris' },
  { id: 'whirlpool-4', type: 'hazard', distance: 1350, lane: 0, kind: 'whirlpool' },
  { id: 'gate-9', type: 'gate', distance: WAVE_RIDER_GATE_DISTANCES[8], gateIndex: 8 },
  { id: 'shark-6', type: 'hazard', distance: 1430, lane: 2, kind: 'shark' },
  { id: 'reef-3', type: 'hazard', distance: 1470, lane: 1, kind: 'reef' },
  { id: 'power-9', type: 'powerup', distance: 1510, lane: 0, powerup: 'life', questionIndex: 5 },
  { id: 'whirlpool-5', type: 'hazard', distance: 1550, lane: 2, kind: 'whirlpool' },
  { id: 'gate-10', type: 'gate', distance: WAVE_RIDER_GATE_DISTANCES[9], gateIndex: 9 },
  { id: 'debris-6', type: 'hazard', distance: 1635, lane: 0, kind: 'debris' },
  { id: 'shark-7', type: 'hazard', distance: 1670, lane: 1, kind: 'shark' },
] as const;

export function clampWaveRiderLane(lane: number): 0 | 1 | 2 {
  return Math.max(0, Math.min(2, lane)) as 0 | 1 | 2;
}

export function isCorrectWaveRiderLane(gateIndex: number, lane: number) {
  return WAVE_RIDER_GATES[gateIndex]?.correctLane === lane;
}

export function waveRiderEventY(eventDistance: number, riderDistance: number, lookAhead = 180) {
  const progress = 1 - (eventDistance - riderDistance) / lookAhead;
  return 8 + progress * 78;
}

export function waveRiderSpeed(distance: number, calmSpeed: boolean, boosting: boolean, stageMultiplier = 1, slowed = false) {
  const base = (calmSpeed ? 15 : 22) + Math.min(distance, 700) * (calmSpeed ? 0.004 : 0.007);
  return base * stageMultiplier * (boosting ? 1.55 : 1) * (slowed ? 0.55 : 1);
}
