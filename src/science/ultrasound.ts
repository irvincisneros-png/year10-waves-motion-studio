export const SOFT_TISSUE_SOUND_SPEED_MPS = 1540;
export const ULTRASOUND_SOURCE = 'US FDA 510(k) K102901: diagnostic systems estimate sound speed in tissue as 1540 m/s';
export const ULTRASOUND_REVIEW_DATE = '2026-07-20';

export interface PhantomBoundary {
  label: string;
  depthMm: number;
  relativeEcho: number;
}

export interface TissuePhantom {
  id: string;
  name: string;
  boundaries: readonly PhantomBoundary[];
}

export const TISSUE_PHANTOMS: readonly TissuePhantom[] = [
  { id: 'two-layer', name: 'Two-layer training phantom', boundaries: [{ label: 'Layer A/B boundary', depthMm: 20, relativeEcho: 0.45 }, { label: 'Back wall', depthMm: 55, relativeEcho: 0.8 }] },
  { id: 'small-target', name: 'Small-target training phantom', boundaries: [{ label: 'Target front', depthMm: 32, relativeEcho: 0.35 }, { label: 'Target back', depthMm: 38, relativeEcho: 0.3 }, { label: 'Back wall', depthMm: 70, relativeEcho: 0.75 }] },
  { id: 'deep-boundary', name: 'Deep-boundary training phantom', boundaries: [{ label: 'Shallow marker', depthMm: 25, relativeEcho: 0.25 }, { label: 'Deep boundary', depthMm: 95, relativeEcho: 0.65 }] },
] as const;

export function echoTimeMsForDepth(depthMm: number, speedMps = SOFT_TISSUE_SOUND_SPEED_MPS): number {
  if (!Number.isFinite(depthMm) || depthMm < 0) throw new RangeError('Depth cannot be negative.');
  if (!Number.isFinite(speedMps) || speedMps <= 0) throw new RangeError('Speed must be greater than 0 m/s.');
  return ((2 * depthMm) / 1000 / speedMps) * 1000;
}

export function depthMmFromEchoTime(echoTimeMs: number, speedMps = SOFT_TISSUE_SOUND_SPEED_MPS): number {
  if (!Number.isFinite(echoTimeMs) || echoTimeMs < 0) throw new RangeError('Echo time cannot be negative.');
  if (!Number.isFinite(speedMps) || speedMps <= 0) throw new RangeError('Speed must be greater than 0 m/s.');
  return (speedMps * (echoTimeMs / 1000) * 1000) / 2;
}

export function frequencyTradeoff(frequencyMHz: number): { resolution: string; penetration: string } {
  if (!Number.isFinite(frequencyMHz) || frequencyMHz < 2 || frequencyMHz > 12) {
    throw new RangeError('Probe frequency must be between 2 MHz and 12 MHz.');
  }
  if (frequencyMHz < 5) return { resolution: 'lower', penetration: 'greater' };
  if (frequencyMHz < 9) return { resolution: 'moderate', penetration: 'moderate' };
  return { resolution: 'higher', penetration: 'lower' };
}

export function angleEchoFactor(angleDeg: number): number {
  if (!Number.isFinite(angleDeg) || angleDeg < -45 || angleDeg > 45) {
    throw new RangeError('Probe angle must be between −45° and +45°.');
  }
  return Math.cos((Math.abs(angleDeg) * Math.PI) / 180) ** 2;
}
