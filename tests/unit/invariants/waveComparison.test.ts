import { describe, expect, it } from 'vitest';
import { pressureAt } from '../../../src/science/sound';
import { displacement } from '../../../src/science/waves';
import {
  MAX_LONGITUDINAL_DISPLAY_STRAIN,
  WAVE_COMPARISON_CHAMBER_LENGTH,
  WAVE_COMPARISON_SCENARIOS,
  WAVE_COMPARISON_SPEED,
  createWaveComparisonEquilibria,
  createWaveComparisonRun,
  evaluateGraphRepresentationTrap,
  evaluateWaveFeatureProbe,
  normaliseWaveComparisonControls,
  replayWaveComparison,
  resetWaveComparison,
  waveComparisonScenarioForReplay,
  waveComparisonStateAt,
  waveDirectionRelationship,
} from '../../../src/science/waveComparison';

describe('7.1.3 shared transverse/longitudinal wave state', () => {
  it('drives both representations from exactly one scalar displacement state', () => {
    const run = createWaveComparisonRun();
    const state = waveComparisonStateAt(run, 0.37, [0, 0.8, 2.1, 4.7, 6]);

    for (const particle of state.particles) {
      const expected = displacement(run.wave, particle.equilibrium, state.time);
      expect(particle.sharedDisplacement).toBeCloseTo(expected, 12);
      expect(particle.transversePosition).toEqual({
        x: particle.equilibrium,
        y: particle.sharedDisplacement,
      });
      expect(particle.longitudinalDisplayDisplacement).toBeCloseTo(
        particle.sharedDisplacement * state.longitudinalDisplayScale,
        12,
      );
      expect(particle.longitudinalPosition.x).toBeCloseTo(
        particle.equilibrium + particle.longitudinalDisplayDisplacement,
        12,
      );
      expect(particle.normalisedPressure).toBeCloseTo(
        pressureAt(run.wave, particle.equilibrium, state.time),
        12,
      );
    }
  });

  it('identifies transverse displacement as perpendicular and longitudinal displacement as parallel to propagation', () => {
    const transverse = waveDirectionRelationship('transverse');
    expect(transverse).toMatchObject({
      propagation: { x: 1, y: 0 },
      displacementAxis: { x: 0, y: 1 },
      dotProduct: 0,
      angleDegrees: 90,
      relationship: 'perpendicular',
    });
    const longitudinal = waveDirectionRelationship('longitudinal');
    expect(longitudinal).toMatchObject({
      propagation: { x: 1, y: 0 },
      displacementAxis: { x: 1, y: 0 },
      dotProduct: 1,
      angleDegrees: 0,
      relationship: 'parallel',
    });
  });

  it('keeps shared speed, wavelength, frequency and period internally consistent', () => {
    for (const scenario of WAVE_COMPARISON_SCENARIOS) {
      const run = createWaveComparisonRun({
        controls: scenario,
        phase: scenario.phase,
      });
      const state = waveComparisonStateAt(run, 0);
      expect(state.wave.speed).toBe(WAVE_COMPARISON_SPEED);
      expect(state.wave.frequency * state.wavelength).toBeCloseTo(WAVE_COMPARISON_SPEED, 12);
      expect(state.period * state.wave.frequency).toBeCloseTo(1, 12);
    }
  });

  it('clamps invalid controls without introducing a separate speed or phase state', () => {
    expect(normaliseWaveComparisonControls({ amplitude: -2, frequency: 99 })).toEqual({
      amplitude: 0.2,
      frequency: 2.5,
    });
    expect(normaliseWaveComparisonControls({ amplitude: Number.NaN, frequency: Infinity })).toEqual({
      amplitude: 0.5,
      frequency: 1.5,
    });
    expect(createWaveComparisonRun({ controls: { amplitude: 0.8, frequency: 2.5 } }).wave.speed)
      .toBe(WAVE_COMPARISON_SPEED);
  });
});

describe('7.1.3 engine-derived wave features', () => {
  it('places crests and troughs at displacement extrema in the live snapshot', () => {
    const run = createWaveComparisonRun({ phase: 0.43 });
    const state = waveComparisonStateAt(run, 0.28);
    for (const feature of state.features.crest) {
      expect(displacement(run.wave, feature.x, state.time)).toBeCloseTo(run.wave.amplitude, 10);
      expect(feature.orientation).toBe('transverse');
    }
    for (const feature of state.features.trough) {
      expect(displacement(run.wave, feature.x, state.time)).toBeCloseTo(-run.wave.amplitude, 10);
      expect(feature.orientation).toBe('transverse');
    }
  });

  it('places compressions at pressure maxima and rarefactions at pressure minima', () => {
    const run = createWaveComparisonRun({ phase: 1.13 });
    const state = waveComparisonStateAt(run, 0.61);
    for (const feature of state.features.compression) {
      expect(pressureAt(run.wave, feature.x, state.time)).toBeCloseTo(run.wave.amplitude, 10);
      expect(feature.orientation).toBe('longitudinal');
    }
    for (const feature of state.features.rarefaction) {
      expect(pressureAt(run.wave, feature.x, state.time)).toBeCloseTo(-run.wave.amplitude, 10);
      expect(feature.orientation).toBe('longitudinal');
    }
  });

  it('spaces like features by exactly one wavelength', () => {
    const run = createWaveComparisonRun({ controls: { frequency: 2.2 } });
    const state = waveComparisonStateAt(run, 0.19);
    for (const kind of ['crest', 'trough', 'compression', 'rarefaction'] as const) {
      const positions = state.features[kind];
      expect(positions.length).toBeGreaterThan(1);
      for (let index = 1; index < positions.length; index++) {
        expect(positions[index].x - positions[index - 1].x).toBeCloseTo(state.wavelength, 10);
      }
    }
  });

  it('scores a movable probe against current engine features rather than fixed positions', () => {
    const run = createWaveComparisonRun({ phase: 0.71, targetFeature: 'compression' });
    const firstState = waveComparisonStateAt(run, 0);
    const feature = firstState.features.compression[0];
    expect(evaluateWaveFeatureProbe(firstState, 'compression', feature.x)).toMatchObject({
      expectedOrientation: 'longitudinal',
      distance: 0,
      correct: true,
    });
    expect(evaluateWaveFeatureProbe(
      firstState,
      'compression',
      feature.x + firstState.wavelength * 0.06,
    ).correct).toBe(false);

    const laterState = waveComparisonStateAt(run, 0.23);
    expect(laterState.features.compression[0].x).not.toBeCloseTo(feature.x, 6);
    expect(evaluateWaveFeatureProbe(
      laterState,
      'compression',
      laterState.features.compression[0].x,
    ).correct).toBe(true);
  });
});

describe('7.1.3 safe longitudinal particle representation', () => {
  it('analytically limits longitudinal strain and leaves a positive ordering margin', () => {
    for (let replayIndex = 0; replayIndex < WAVE_COMPARISON_SCENARIOS.length; replayIndex++) {
      const run = createWaveComparisonRun({ replayIndex });
      for (let step = 0; step <= 40; step++) {
        const state = waveComparisonStateAt(run, step * statePeriod(run) / 40);
        expect(state.minimumLongitudinalSpacingFactor).toBeGreaterThan(0);
        expect(1 - state.minimumLongitudinalSpacingFactor)
          .toBeLessThanOrEqual(MAX_LONGITUDINAL_DISPLAY_STRAIN + 1e-12);
      }
    }
  });

  it('never inverts particle order at control boundaries, phases or sampled times', () => {
    const equilibria = createWaveComparisonEquilibria(121, WAVE_COMPARISON_CHAMBER_LENGTH);
    for (const controls of [
      { amplitude: 0.2, frequency: 0.75 },
      { amplitude: 0.8, frequency: 0.75 },
      { amplitude: 0.2, frequency: 2.5 },
      { amplitude: 0.8, frequency: 2.5 },
    ]) {
      for (const phase of [0, Math.PI / 3, Math.PI, 1.9 * Math.PI]) {
        const run = createWaveComparisonRun({ controls, phase });
        const period = statePeriod(run);
        for (let step = 0; step <= 60; step++) {
          const particles = waveComparisonStateAt(run, step * period / 60, equilibria).particles;
          for (let index = 1; index < particles.length; index++) {
            expect(particles[index].longitudinalPosition.x)
              .toBeGreaterThan(particles[index - 1].longitudinalPosition.x);
          }
        }
      }
    }
  }, 10_000);

  it('shows particle bunching at compression and spreading at rarefaction', () => {
    const run = createWaveComparisonRun();
    const state = waveComparisonStateAt(run, 0);
    const dx = state.wavelength / 10_000;
    const displayedSpacing = (x: number) => {
      const pair = waveComparisonStateAt(run, 0, [x - dx, x + dx]).particles;
      return pair[1].longitudinalPosition.x - pair[0].longitudinalPosition.x;
    };
    const compression = state.features.compression[0].x;
    const rarefaction = state.features.rarefaction.find((feature) => feature.x > dx)!.x;
    expect(displayedSpacing(compression)).toBeLessThan(2 * dx);
    expect(displayedSpacing(rarefaction)).toBeGreaterThan(2 * dx);
  });
});

describe('7.1.3 representation honesty and deterministic replay', () => {
  it('identifies the curve as a quantity-versus-position graph, not a particle path', () => {
    expect(evaluateGraphRepresentationTrap()).toMatchObject({
      status: 'unanswered',
      correct: null,
    });
    expect(evaluateGraphRepresentationTrap('quantity-versus-position')).toMatchObject({
      status: 'correct',
      correct: true,
    });
    expect(evaluateGraphRepresentationTrap('particle-path')).toMatchObject({
      status: 'incorrect',
      correct: false,
    });
  });

  it('resets identically and replays a deterministic cyclic target/phase sequence', () => {
    const options = { replayIndex: 2, phase: 0.3, targetFeature: 'rarefaction' as const };
    expect(resetWaveComparison(options)).toEqual(resetWaveComparison(options));
    expect(createWaveComparisonRun(options)).toEqual(resetWaveComparison(options));

    const initial = createWaveComparisonRun({ replayIndex: 0 });
    const replayOne = replayWaveComparison(initial);
    const replayTwo = replayWaveComparison(replayOne);
    expect(replayOne.scenario).toEqual(waveComparisonScenarioForReplay(1));
    expect(replayTwo.scenario).toEqual(waveComparisonScenarioForReplay(2));
    expect(waveComparisonScenarioForReplay(4)).toEqual(waveComparisonScenarioForReplay(0));
    expect(waveComparisonScenarioForReplay(-1)).toEqual(waveComparisonScenarioForReplay(3));
  });
});

function statePeriod(run: ReturnType<typeof createWaveComparisonRun>): number {
  return 1 / run.wave.frequency;
}
