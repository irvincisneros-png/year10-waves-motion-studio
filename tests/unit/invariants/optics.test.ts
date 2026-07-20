import { describe, expect, it } from 'vitest';
import { createRng } from '../../../src/science/rng';
import {
  DEFAULT_LIGHT_FREQUENCY_HZ,
  ILLUMINANTS,
  OPTICAL_MEDIA,
  OPTICAL_SURFACES,
  criticalAngleDeg,
  energyLedger,
  reflect,
  refract,
  reflectionChallenge,
  scatteringRegime,
} from '../../../src/science/optics';
import {
  eyeFocusState,
  idealAccommodationPercent,
  pupilOpeningPercent,
  retinalImageRelativeSize,
} from '../../../src/science/vision';

const rng = createRng(0x734);

describe('optical constants and invariant 20.6 — reflection', () => {
  it('stores every curated refractive index with source and review date', () => {
    expect(OPTICAL_MEDIA.find((m) => m.id === 'water')?.refractiveIndex).toBe(1.33);
    expect(OPTICAL_MEDIA.find((m) => m.id === 'crown-glass')?.refractiveIndex).toBe(1.52);
    expect(OPTICAL_MEDIA.find((m) => m.id === 'diamond')?.refractiveIndex).toBe(2.42);
    for (const medium of OPTICAL_MEDIA) {
      expect(medium.source).not.toBe('');
      expect(medium.reviewDate).toBe('2026-07-17');
    }
  });

  it('reflection angle equals incidence for all supported angles and seeded cases', () => {
    for (let angle = 0; angle <= 89; angle++) expect(reflect(angle).reflectedAngleDeg).toBe(angle);
    for (let i = 0; i < 60; i++) {
      const angle = rng.range(0, 89);
      expect(Math.abs(reflect(angle).reflectedAngleDeg - angle)).toBeLessThan(0.5);
    }
  });

  it('rejects malformed and grazing/out-of-range angles', () => {
    expect(() => reflect(90)).toThrow(/0° and 89°/);
    expect(() => reflect(-1)).toThrow();
    expect(() => reflect(Number.NaN)).toThrow();
  });
});

describe('invariant 20.7 — Snell refraction, constant frequency and TIR', () => {
  it('matches the air-to-water worked example', () => {
    const result = refract(1, 1.33, 40);
    expect(result.refractedAngleDeg).toBeCloseTo(28.9, 1);
    expect(result.frequencyAfterHz).toBe(DEFAULT_LIGHT_FREQUENCY_HZ);
    expect(result.speedAfterMps).toBeLessThan(result.speedBeforeMps);
    expect(result.wavelengthAfterM).toBeLessThan(result.wavelengthBeforeM);
  });

  it('satisfies Snell residual and keeps frequency bit-identical for curated media', () => {
    for (let i = 0; i < 60; i++) {
      const first = OPTICAL_MEDIA[Math.floor(rng.range(0, OPTICAL_MEDIA.length))];
      const second = OPTICAL_MEDIA[Math.floor(rng.range(0, OPTICAL_MEDIA.length))];
      const angle = rng.range(0, 89);
      const result = refract(first.refractiveIndex, second.refractiveIndex, angle);
      expect(result.frequencyAfterHz).toBe(result.frequencyBeforeHz);
      if (!result.totalInternalReflection) {
        const left = first.refractiveIndex * Math.sin((angle * Math.PI) / 180);
        const right = second.refractiveIndex * Math.sin((result.refractedAngleDeg! * Math.PI) / 180);
        expect(Math.abs(left - right)).toBeLessThan(0.005 * Math.max(1, Math.abs(left)));
      } else {
        expect(result.refractedAngleDeg).toBeNull();
      }
    }
  });

  it('computes the glass-to-air critical angle and returns no fictitious refracted ray', () => {
    expect(criticalAngleDeg(1.5, 1)).toBeCloseTo(41.8, 1);
    expect(criticalAngleDeg(1, 1.5)).toBeNull();
    const result = refract(1.5, 1, 50);
    expect(result.totalInternalReflection).toBe(true);
    expect(result.refractedAngleDeg).toBeNull();
  });
});

describe('invariant 20.8 — optical energy ledger', () => {
  it('all modelled surface/illuminant ledgers sum to one', () => {
    for (const surface of OPTICAL_SURFACES) {
      for (const illuminant of ILLUMINANTS) {
        const ledger = energyLedger(surface.id, illuminant.id);
        expect(ledger.transmitted + ledger.reflected + ledger.absorbed).toBeCloseTo(1, 12);
        expect(Math.min(ledger.transmitted, ledger.reflected, ledger.absorbed)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('matches the documented smoked-glass/daylight teaching fixture', () => {
    expect(energyLedger('smoked-glass', 'daylight')).toEqual({ transmitted: 0.1, reflected: 0.08, absorbed: 0.82 });
  });

  it('scattering regimes and design-challenge feedback are deterministic and specific', () => {
    expect(scatteringRegime(0).id).toBe('small');
    expect(scatteringRegime(50).id).toBe('medium');
    expect(scatteringRegime(100).id).toBe('large');
    expect(reflectionChallenge(30, 29).complete).toBe(true);
    expect(reflectionChallenge(30, 12).feedback).toContain('18°');
  });
});

describe('eye-response teaching model', () => {
  it('relative pupil opening narrows with brightness and retinal image gets smaller with distance', () => {
    expect(pupilOpeningPercent(0)).toBe(100);
    expect(pupilOpeningPercent(100)).toBe(25);
    expect(retinalImageRelativeSize(10)).toBeGreaterThan(retinalImageRelativeSize(1000));
  });

  it('near objects demand more accommodation and the ideal setting is in focus', () => {
    expect(idealAccommodationPercent(10)).toBeGreaterThan(idealAccommodationPercent(1000));
    for (const distance of [10, 50, 100, 1000]) {
      const ideal = idealAccommodationPercent(distance);
      expect(eyeFocusState(distance, ideal).status).toBe('in focus');
    }
  });

  it('describes front/behind-retina focus states in text', () => {
    expect(eyeFocusState(50, 100).status).toContain('front');
    expect(eyeFocusState(50, 0).status).toContain('behind');
  });
});
