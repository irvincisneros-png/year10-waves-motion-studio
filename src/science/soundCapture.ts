/** Signal-processing helpers for the live 7.2.2 microphone visualiser. */

export function calculateRms(samples: ArrayLike<number>): number {
  if (samples.length === 0) return 0;
  let sumSquares = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index] ?? 0;
    sumSquares += sample * sample;
  }
  return Math.sqrt(sumSquares / samples.length);
}

/**
 * Estimate the fundamental using normalised autocorrelation. This is intended
 * for steady classroom tones, not speech analysis or calibrated measurement.
 */
export function estimateFundamentalFrequency(
  samples: ArrayLike<number>,
  sampleRate: number,
  minHz = 70,
  maxHz = 4000,
): number | null {
  if (samples.length < 4 || sampleRate <= 0 || calculateRms(samples) < 0.008) return null;

  const minLag = Math.max(2, Math.floor(sampleRate / maxHz));
  const maxLag = Math.min(samples.length - 2, Math.ceil(sampleRate / minHz));
  let bestLag = -1;
  let bestCorrelation = -1;
  const correlations = new Float32Array(maxLag + 1);

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let cross = 0;
    let energyA = 0;
    let energyB = 0;
    for (let index = 0; index < samples.length - lag; index += 1) {
      const a = samples[index] ?? 0;
      const b = samples[index + lag] ?? 0;
      cross += a * b;
      energyA += a * a;
      energyB += b * b;
    }
    const correlation = cross / Math.sqrt(Math.max(energyA * energyB, 1e-12));
    correlations[lag] = correlation;
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  if (bestLag < 0 || bestCorrelation < 0.55) return null;
  const left = correlations[bestLag - 1] ?? bestCorrelation;
  const centre = correlations[bestLag] ?? bestCorrelation;
  const right = correlations[bestLag + 1] ?? bestCorrelation;
  const denominator = left - 2 * centre + right;
  const adjustment = Math.abs(denominator) > 1e-9 ? 0.5 * (left - right) / denominator : 0;
  return sampleRate / (bestLag + Math.max(-0.5, Math.min(0.5, adjustment)));
}

export function pitchDescription(frequencyHz: number | null): string {
  if (frequencyHz === null || !Number.isFinite(frequencyHz)) return 'Waiting for a steady tone';
  if (frequencyHz < 220) return 'Low pitch';
  if (frequencyHz < 700) return 'Middle pitch';
  if (frequencyHz < 2000) return 'High pitch';
  return 'Very high pitch';
}

export function relativeLoudnessDescription(relativeAmplitude: number): string {
  if (relativeAmplitude < 0.04) return 'Very quiet';
  if (relativeAmplitude < 0.12) return 'Quiet';
  if (relativeAmplitude < 0.3) return 'Moderate';
  if (relativeAmplitude < 0.6) return 'Loud';
  return 'Very loud';
}
