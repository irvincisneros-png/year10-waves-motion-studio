import { describe, expect, it } from 'vitest';
import { LIGHT_SPEED_MPS } from '../../../src/science/constants';
import { identifySpectralLine, radialDirection, shiftedWavelengthNm, STELLAR_LINES } from '../../../src/science/astronomy';
import { EM_REGIONS, frequencyFromWavelength, logPositionFromWavelength, regionAtWavelength, wavelengthFromFrequency, wavelengthFromLogPosition } from '../../../src/science/emSpectrum';
import { cochlearPlaceForFrequency, EAR_PATHWAY } from '../../../src/science/hearing';
import { angleEchoFactor, depthMmFromEchoTime, echoTimeMsForDepth, frequencyTradeoff, TISSUE_PHANTOMS } from '../../../src/science/ultrasound';

describe('Stage 6 EM spectrum invariants', () => {
  it('keeps v = fλ exact across 64 logarithmic positions', () => {
    for (let index = 0; index < 64; index += 1) {
      const position = index / 63;
      const wavelength = wavelengthFromLogPosition(position);
      const frequency = frequencyFromWavelength(wavelength);
      expect(frequency * wavelength).toBeCloseTo(LIGHT_SPEED_MPS, 5);
      expect(wavelengthFromFrequency(frequency)).toBeCloseTo(wavelength, 15);
      expect(logPositionFromWavelength(wavelength)).toBeCloseTo(position, 12);
    }
  });

  it('covers all seven named regions and keeps boundaries explicitly sourced', () => {
    expect(EM_REGIONS.map((region) => regionAtWavelength(region.representativeM).id)).toEqual(
      EM_REGIONS.map((region) => region.id),
    );
    expect(EM_REGIONS.every((region) => region.source.includes('approximate'))).toBe(true);
    expect(EM_REGIONS.filter((region) => region.ionisingClass === 'ionising').map((region) => region.id)).toEqual(['xray', 'gamma']);
    expect(EM_REGIONS.find((region) => region.id === 'ultraviolet')?.ionisingClass).toBe('mixed-boundary');
  });

  it('rejects invalid wave inputs instead of yielding Infinity or NaN', () => {
    expect(() => frequencyFromWavelength(0)).toThrow(/greater than 0/);
    expect(() => wavelengthFromFrequency(Number.NaN)).toThrow(/greater than 0/);
  });
});

describe('Stage 6 hearing and ultrasound invariants', () => {
  it('keeps the ear pathway ordered mechanical → fluid → electrical', () => {
    expect(EAR_PATHWAY).toHaveLength(8);
    expect(EAR_PATHWAY.map((part) => part.signalType)).toEqual([
      'mechanical', 'mechanical', 'mechanical', 'mechanical', 'mechanical', 'fluid', 'electrical', 'electrical',
    ]);
    expect(cochlearPlaceForFrequency(20).label).toBe('apex');
    expect(cochlearPlaceForFrequency(1_000).label).toBe('middle');
    expect(cochlearPlaceForFrequency(20_000).label).toBe('base');
    expect(() => cochlearPlaceForFrequency(20_001)).toThrow(/between/);
  });

  it('round-trips every phantom echo depth exactly', () => {
    for (const phantom of TISSUE_PHANTOMS) {
      for (const boundary of phantom.boundaries) {
        expect(depthMmFromEchoTime(echoTimeMsForDepth(boundary.depthMm))).toBeCloseTo(boundary.depthMm, 12);
      }
    }
  });

  it('models the qualitative frequency trade-off and perpendicular echo maximum', () => {
    expect(frequencyTradeoff(2)).toEqual({ resolution: 'lower', penetration: 'greater' });
    expect(frequencyTradeoff(12)).toEqual({ resolution: 'higher', penetration: 'lower' });
    expect(angleEchoFactor(0)).toBe(1);
    expect(angleEchoFactor(45)).toBeLessThan(1);
    expect(angleEchoFactor(-25)).toBeCloseTo(angleEchoFactor(25), 12);
  });
});

describe('Stage 6 astronomy invariants', () => {
  it('identifies only catalogued lines inside tolerance', () => {
    for (const line of STELLAR_LINES) {
      expect(identifySpectralLine(line.wavelengthNm)?.id).toBe(line.id);
    }
    expect(identifySpectralLine(600)).toBeNull();
    expect(identifySpectralLine(589.3, 0.1)).toBeNull();
  });

  it('pairs shift sign with direction and preserves the rest wavelength at zero', () => {
    expect(radialDirection(-120)).toContain('approaching');
    expect(radialDirection(120)).toContain('receding');
    expect(radialDirection(0)).toBe('stationary');
    expect(shiftedWavelengthNm(656.3, 0)).toBe(656.3);
    expect(shiftedWavelengthNm(656.3, -120)).toBeLessThan(656.3);
    expect(shiftedWavelengthNm(656.3, 120)).toBeGreaterThan(656.3);
  });
});
