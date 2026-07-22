import { describe, expect, it } from 'vitest';
import { LIGHT_SPEED_MPS } from '../../../src/science/constants';
import {
  EM_REGIONS,
  EM_SPECTRUM_PROVENANCE,
  SPECTRUM_LONG_EDGE_M,
  SPECTRUM_SHORT_EDGE_M,
  comparePinnedSpectrumStates,
  compareSpectrumStates,
  createSpectrumCalibrationChallenge,
  EMPTY_SPECTRUM_PINS,
  evaluateSpectrumCalibrationMission,
  isContinuousSpectrumStateConsistent,
  pinSpectrumState,
  regionsAtWavelength,
  spectrumStateFromFrequency,
  spectrumStateFromLogPosition,
  spectrumStateFromWavelength,
  type SpectrumBoundaryMission,
  type SpectrumCompareMission,
  type SpectrumTuneMission,
} from '../../../src/science/emSpectrum';

describe('outcome 7.1.4 continuous spectrum state', () => {
  it('SCI-714-01 rejects invalid and out-of-supported-span state inputs', () => {
    for (const invalid of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => spectrumStateFromWavelength(invalid)).toThrow();
      expect(() => spectrumStateFromFrequency(invalid)).toThrow();
    }
    expect(() => spectrumStateFromWavelength(SPECTRUM_LONG_EDGE_M * 10)).toThrow(/supported/);
    expect(() => spectrumStateFromWavelength(SPECTRUM_SHORT_EDGE_M / 10)).toThrow(/supported/);
    expect(() => spectrumStateFromLogPosition(Number.NaN)).toThrow(/finite/);
  });

  it('SCI-714-02 keeps c = fλ and one exact vacuum speed across 128 positions', () => {
    for (let index = 0; index < 128; index += 1) {
      const state = spectrumStateFromLogPosition(index / 127);
      expect(state.vacuumSpeedMps).toBe(LIGHT_SPEED_MPS);
      expect(Math.abs(state.frequencyHz * state.wavelengthM - LIGHT_SPEED_MPS) / LIGHT_SPEED_MPS)
        .toBeLessThan(1e-12);
    }
  });

  it('SCI-714-03 round-trips linked wavelength, frequency and log position values', () => {
    for (let index = 0; index < 96; index += 1) {
      const fromPosition = spectrumStateFromLogPosition(index / 95);
      const fromFrequency = spectrumStateFromFrequency(fromPosition.frequencyHz);
      expect(
        Math.abs(fromFrequency.wavelengthM - fromPosition.wavelengthM) /
          fromPosition.wavelengthM,
      ).toBeLessThan(1e-12);
      expect(fromFrequency.logPosition).toBeCloseTo(fromPosition.logPosition, 12);
    }
  });

  it('SCI-714-04 shorter wavelength means higher frequency and qualitative photon energy', () => {
    const radio = spectrumStateFromWavelength(1);
    const xray = spectrumStateFromWavelength(1e-10);
    const comparison = compareSpectrumStates(radio, xray);
    expect(comparison.pinBWavelength).toBe('shorter');
    expect(comparison.pinBFrequency).toBe('higher');
    expect(comparison.pinBPhotonEnergy).toBe('higher');
    expect(comparison.wavelengthRatioBToA * comparison.frequencyRatioBToA).toBeCloseTo(1, 12);
    expect(xray.energyOrder).toEqual({
      basis: 'frequency',
      frequencyHz: xray.frequencyHz,
      relationship: 'higher-frequency-means-higher-photon-energy',
    });
    let previous = spectrumStateFromLogPosition(0);
    for (let index = 1; index < 128; index += 1) {
      const next = spectrumStateFromLogPosition(index / 127);
      expect(next.wavelengthM).toBeLessThan(previous.wavelengthM);
      expect(next.frequencyHz).toBeGreaterThan(previous.frequencyHz);
      expect(next.energyOrder.frequencyHz).toBeGreaterThan(previous.energyOrder.frequencyHz);
      previous = next;
    }
  });

  it('SCI-714-05 preserves approximate region overlaps instead of forcing one label', () => {
    expect(regionsAtWavelength(Math.sqrt(1 * 1e-1)).map((region) => region.id)).toEqual([
      'radio',
      'microwave',
    ]);
    expect(regionsAtWavelength(Math.sqrt(1e-10 * 1e-11)).map((region) => region.id)).toEqual([
      'xray',
      'gamma',
    ]);
    expect(regionsAtWavelength(550e-9).map((region) => region.id)).toEqual(['visible']);
  });

  it('SCI-714-06 validates reachable ordered regions, ranges and named provenance', () => {
    expect(EM_REGIONS.map((region) => region.id)).toEqual([
      'radio',
      'microwave',
      'infrared',
      'visible',
      'ultraviolet',
      'xray',
      'gamma',
    ]);
    for (const region of EM_REGIONS) {
      expect(region.longEdgeM).toBeGreaterThanOrEqual(region.representativeM);
      expect(region.representativeM).toBeGreaterThanOrEqual(region.shortEdgeM);
      expect(spectrumStateFromWavelength(region.representativeM).candidateRegionIds)
        .toContain(region.id);
      expect(region.provenanceIds).toContain('bipm-si-speed-of-light');
      expect(region.provenanceIds).toContain('nasa-electromagnetic-spectrum');
    }
    expect(EM_SPECTRUM_PROVENANCE).toHaveLength(2);
    for (const source of EM_SPECTRUM_PROVENANCE) {
      expect(source.authority).not.toBe('');
      expect(source.title).not.toBe('');
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.supports).not.toBe('');
      expect(source.reviewDate).toBe('2026-07-22');
    }
  });

  it('pin A/B state is immutable and compares only once both probes exist', () => {
    const pinA = spectrumStateFromWavelength(1);
    const pinB = spectrumStateFromWavelength(1e-6);
    const withA = pinSpectrumState(EMPTY_SPECTRUM_PINS, 'A', pinA);
    expect(comparePinnedSpectrumStates(withA)).toBeNull();
    const withBoth = pinSpectrumState(withA, 'B', pinB);
    expect(comparePinnedSpectrumStates(withBoth)?.pinBFrequency).toBe('higher');
    expect(EMPTY_SPECTRUM_PINS).toEqual({ A: null, B: null });
  });
});

describe('outcome 7.1.4 deterministic calibration challenge', () => {
  it('SCI-714-07 reproduces a seed/replay exactly and changes a later replay', () => {
    const first = createSpectrumCalibrationChallenge(0x714, 0);
    expect(createSpectrumCalibrationChallenge(0x714, 0)).toEqual(first);
    expect(createSpectrumCalibrationChallenge(0x714, 1)).not.toEqual(first);
    expect(first.missions.map((mission) => mission.kind)).toEqual(['tune', 'compare', 'boundary']);
    expect(() => createSpectrumCalibrationChallenge(Number.NaN)).toThrow(/seed/);
    expect(() => createSpectrumCalibrationChallenge(1, -1)).toThrow(/Replay/);
  });

  it('SIM-714-01 scores tune success from calibrated state, not an attempt event', () => {
    const mission = createSpectrumCalibrationChallenge(10).missions[0] as SpectrumTuneMission;
    expect(evaluateSpectrumCalibrationMission(mission, { kind: 'tune', state: mission.target }))
      .toEqual({ correct: true, score: 100, feedback: 'calibrated' });
    const farState = spectrumStateFromLogPosition(mission.target.logPosition < 0.5 ? 1 : 0);
    const result = evaluateSpectrumCalibrationMission(mission, { kind: 'tune', state: farState });
    expect(result.correct).toBe(false);
    expect(result.score).toBeLessThan(100);
    const forged = {
      ...mission.target,
      frequencyHz: mission.target.frequencyHz * 2,
    };
    expect(isContinuousSpectrumStateConsistent(forged)).toBe(false);
    expect(evaluateSpectrumCalibrationMission(mission, { kind: 'tune', state: forged }))
      .toEqual({ correct: false, score: 0, feedback: 'invalid-spectrum-state' });
  });

  it('SIM-714-02 derives comparison success from linked wavelength/frequency state', () => {
    const mission = createSpectrumCalibrationChallenge(20).missions[1] as SpectrumCompareMission;
    expect(evaluateSpectrumCalibrationMission(mission, {
      kind: 'compare',
      selection: mission.expectedSelection,
    })).toEqual({ correct: true, score: 100, feedback: 'comparison-correct' });
    const wrong = mission.expectedSelection === 'A' ? 'B' : 'A';
    expect(evaluateSpectrumCalibrationMission(mission, { kind: 'compare', selection: wrong }).correct)
      .toBe(false);
  });

  it('SIM-714-03 requires all valid approximate regions in a boundary mission', () => {
    const mission = createSpectrumCalibrationChallenge(30).missions[2] as SpectrumBoundaryMission;
    expect(mission.expectedRegionIds).toHaveLength(2);
    expect(evaluateSpectrumCalibrationMission(mission, {
      kind: 'boundary',
      selectedRegionIds: [...mission.expectedRegionIds].reverse(),
    })).toEqual({ correct: true, score: 100, feedback: 'boundary-uncertainty-correct' });
    expect(evaluateSpectrumCalibrationMission(mission, {
      kind: 'boundary',
      selectedRegionIds: [mission.expectedRegionIds[0]],
    })).toEqual({ correct: false, score: 0, feedback: 'include-all-valid-regions' });
  });

  it('rejects an attempt for the wrong mission kind', () => {
    const mission = createSpectrumCalibrationChallenge(40).missions[0];
    expect(evaluateSpectrumCalibrationMission(mission, { kind: 'compare', selection: 'A' }))
      .toEqual({ correct: false, score: 0, feedback: 'attempt-kind-mismatch' });
  });
});
