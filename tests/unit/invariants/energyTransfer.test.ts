import { describe, expect, it } from 'vitest';
import {
  ENERGY_RELAY_CHAMBER_LENGTH,
  ENERGY_RELAY_HOME_TOLERANCE_FRACTION,
  ENERGY_RELAY_PARTICLES,
  ENERGY_RELAY_PROPAGATION_SPEED,
  captureEnergyRelayParticle,
  createEnergyRelayRun,
  energyRelayScenarioForReplay,
  energyRelayStateAt,
  normaliseEnergyRelayControls,
  replayEnergyRelay,
  resetEnergyRelay,
  scoreEnergyRelayChallenge,
} from '../../../src/science/energyTransfer';

describe('7.1.2 Energy Relay — scientific invariants', () => {
  it('keeps every trackable particle at an immutable equilibrium while its local displacement changes', () => {
    const run = createEnergyRelayRun();
    const equilibria = ENERGY_RELAY_PARTICLES.map((particle) => particle.equilibrium);
    expect(Object.isFrozen(ENERGY_RELAY_PARTICLES)).toBe(true);
    expect(ENERGY_RELAY_PARTICLES.every(Object.isFrozen)).toBe(true);

    for (const particle of ENERGY_RELAY_PARTICLES) {
      const peakTime = run.launchTime + particle.equilibrium / ENERGY_RELAY_PROPAGATION_SPEED;
      const state = energyRelayStateAt(run, peakTime);
      const sampled = state.particles.find((item) => item.id === particle.id)!;
      expect(sampled.equilibrium).toBe(particle.equilibrium);
      expect(sampled.currentPosition - sampled.equilibrium).toBeCloseTo(sampled.currentDisplacement, 12);
      expect(sampled.currentDisplacement).toBeCloseTo(run.controls.amplitude, 12);
    }

    expect(ENERGY_RELAY_PARTICLES.map((particle) => particle.equilibrium)).toEqual(equilibria);
  });

  it('derives analytic peak timing and peak displacement from the existing travelling pulse model', () => {
    const run = createEnergyRelayRun({ launchTime: 1.25 });
    for (const definition of ENERGY_RELAY_PARTICLES) {
      const expectedPeak = 1.25 + definition.equilibrium / ENERGY_RELAY_PROPAGATION_SPEED;
      const particle = energyRelayStateAt(run, expectedPeak).particles
        .find((item) => item.id === definition.id)!;
      expect(particle.peakTime).toBe(expectedPeak);
      expect(particle.peakDisplacement).toBe(run.controls.amplitude);
      expect(particle.currentDisplacement).toBeCloseTo(particle.peakDisplacement, 12);
    }
  });

  it('moves the pulse pattern and receiver signal at one fixed propagation speed', () => {
    const run = createEnergyRelayRun({ launchTime: 0.5 });
    const first = energyRelayStateAt(run, 1.5);
    const second = energyRelayStateAt(run, 2.5);
    expect((second.pulseCentrePosition! - first.pulseCentrePosition!) / 1).toBe(
      ENERGY_RELAY_PROPAGATION_SPEED,
    );
    expect(run.receiverArrivalTime - run.launchTime).toBe(
      ENERGY_RELAY_CHAMBER_LENGTH / ENERGY_RELAY_PROPAGATION_SPEED,
    );
    expect(energyRelayStateAt(run, run.receiverArrivalTime - 0.001).receiver.state).toBe('waiting');
    expect(energyRelayStateAt(run, run.receiverArrivalTime).receiver.state).toBe('received');
  });

  it('allows amplitude and pulse width changes without ever changing propagation speed or receiver arrival', () => {
    const reference = createEnergyRelayRun({ controls: { amplitude: 0.2, pulseWidth: 0.35 } });
    for (const amplitude of [0.2, 0.55, 1]) {
      for (const pulseWidth of [0.35, 0.7, 1.2]) {
        const changed = createEnergyRelayRun({ controls: { amplitude, pulseWidth } });
        expect(changed.pulse.speed).toBe(ENERGY_RELAY_PROPAGATION_SPEED);
        expect(changed.receiverArrivalTime).toBe(reference.receiverArrivalTime);
        expect(changed.controls).toEqual({ amplitude, pulseWidth });
      }
    }
  });

  it('clamps invalid control values while preserving the fixed-speed model', () => {
    expect(normaliseEnergyRelayControls({ amplitude: -5, pulseWidth: 99 })).toEqual({
      amplitude: 0.2,
      pulseWidth: 1.2,
    });
    const fallback = normaliseEnergyRelayControls({ amplitude: Number.NaN, pulseWidth: Infinity });
    expect(fallback).toEqual({ amplitude: 0.6, pulseWidth: 0.7 });
    expect(createEnergyRelayRun({ controls: fallback }).pulse.speed).toBe(ENERGY_RELAY_PROPAGATION_SPEED);
  });

  it('exposes explicit ready, travelling and event-complete states with final particle evidence', () => {
    const run = createEnergyRelayRun({ launchTime: 2 });
    const ready = energyRelayStateAt(run, 1.9);
    expect(ready).toMatchObject({ status: 'ready', eventComplete: false, pulseCentrePosition: null });
    expect(ready.receiver.state).toBe('ready');
    expect(ready.particles.every((particle) => particle.finalNetDisplacement === null)).toBe(true);

    const travelling = energyRelayStateAt(run, run.receiverArrivalTime - 0.1);
    expect(travelling.status).toBe('travelling');
    expect(travelling.eventComplete).toBe(false);

    const complete = energyRelayStateAt(run, run.completionTime);
    expect(complete.status).toBe('complete');
    expect(complete.eventComplete).toBe(true);
    expect(complete.receiver.state).toBe('received');
    expect(complete.particles.every((particle) => particle.finalNetDisplacement !== null)).toBe(true);
  });

  it('transfers energy to the receiver while every particle finishes with less than 1% amplitude net displacement', () => {
    for (let replayIndex = 0; replayIndex < 4; replayIndex++) {
      const run = createEnergyRelayRun({ replayIndex });
      const complete = energyRelayStateAt(run, run.completionTime);
      expect(complete.receiver.state).toBe('received');
      for (const particle of complete.particles) {
        expect(Math.abs(particle.finalNetDisplacement!)).toBeLessThan(
          ENERGY_RELAY_HOME_TOLERANCE_FRACTION * run.controls.amplitude,
        );
        expect(particle.returnedHome).toBe(true);
        expect(particle.equilibrium).toBe(
          ENERGY_RELAY_PARTICLES.find((definition) => definition.id === particle.id)!.equilibrium,
        );
      }
    }
  });
});

describe('7.1.2 Energy Relay — evidence-based challenge gates', () => {
  it('keeps scoring locked until the complete simulation supplies receiver and final net-displacement evidence', () => {
    const run = createEnergyRelayRun();
    const target = energyRelayStateAt(run, run.launchTime).particles
      .find((particle) => particle.id === run.scenario.targetParticleId)!;
    const peakState = energyRelayStateAt(run, target.peakTime);
    const returnState = energyRelayStateAt(run, target.peakTime + 3 * run.controls.pulseWidth / run.pulse.speed);
    const evidence = {
      peakCapture: captureEnergyRelayParticle(peakState),
      returnCapture: captureEnergyRelayParticle(returnState),
    };

    expect(scoreEnergyRelayChallenge(returnState, evidence)).toMatchObject({
      score: 0,
      mastery: 'locked',
      checks: { completedSimulatedEvidence: false },
    });
  });

  it('awards mastery only for the target particle captured near its peak and after returning below 1% amplitude', () => {
    const run = createEnergyRelayRun();
    const target = energyRelayStateAt(run, run.launchTime).particles
      .find((particle) => particle.id === run.scenario.targetParticleId)!;
    const peakCapture = captureEnergyRelayParticle(energyRelayStateAt(run, target.peakTime));
    const returnCapture = captureEnergyRelayParticle(
      energyRelayStateAt(run, target.peakTime + 3 * run.controls.pulseWidth / run.pulse.speed),
    );
    const complete = energyRelayStateAt(run, run.completionTime);

    expect(Math.abs(returnCapture.displacement)).toBeLessThan(
      ENERGY_RELAY_HOME_TOLERANCE_FRACTION * run.controls.amplitude,
    );
    expect(scoreEnergyRelayChallenge(complete, { peakCapture, returnCapture })).toEqual({
      checks: {
        completedSimulatedEvidence: true,
        peakCapturedNearMaximum: true,
        returnCapturedAfterPeak: true,
        sameTargetParticle: true,
      },
      score: 100,
      maxScore: 100,
      mastery: 'energy-relay-complete',
    });
  });

  it('does not turn clicks alone into evidence when peak and return marks are mistimed', () => {
    const run = createEnergyRelayRun();
    const launch = energyRelayStateAt(run, run.launchTime);
    const target = launch.particles.find((particle) => particle.id === run.scenario.targetParticleId)!;
    const nearPeakButNotHome = energyRelayStateAt(
      run,
      target.peakTime + 0.25 * run.controls.pulseWidth / run.pulse.speed,
    );
    const complete = energyRelayStateAt(run, run.completionTime);
    const result = scoreEnergyRelayChallenge(complete, {
      peakCapture: captureEnergyRelayParticle(launch),
      returnCapture: captureEnergyRelayParticle(nearPeakButNotHome),
    });

    expect(result.score).toBe(0);
    expect(result.mastery).toBe('developing');
    expect(result.checks.peakCapturedNearMaximum).toBe(false);
    expect(result.checks.returnCapturedAfterPeak).toBe(false);
  });

  it('rejects stale-run captures and captures split across different particles', () => {
    const run = createEnergyRelayRun();
    const target = energyRelayStateAt(run, run.launchTime).particles
      .find((particle) => particle.id === run.scenario.targetParticleId)!;
    const peakState = energyRelayStateAt(run, target.peakTime);
    const returnState = energyRelayStateAt(run, target.peakTime + 3 * run.controls.pulseWidth / run.pulse.speed);
    const complete = energyRelayStateAt(run, run.completionTime);
    const otherId = run.scenario.targetParticleId === 'B' ? 'D' : 'B';

    const mixed = scoreEnergyRelayChallenge(complete, {
      peakCapture: captureEnergyRelayParticle(peakState),
      returnCapture: captureEnergyRelayParticle(returnState, otherId),
    });
    expect(mixed.score).toBe(0);
    expect(mixed.checks.sameTargetParticle).toBe(false);

    const staleRun = createEnergyRelayRun({ replayIndex: 1 });
    const stale = scoreEnergyRelayChallenge(complete, {
      peakCapture: captureEnergyRelayParticle(energyRelayStateAt(staleRun, staleRun.launchTime)),
      returnCapture: captureEnergyRelayParticle(returnState),
    });
    expect(stale.score).toBe(0);
    expect(stale.checks.sameTargetParticle).toBe(false);
  });

  it('resets identically and advances replay through a deterministic cyclic scenario sequence', () => {
    const options = { replayIndex: 2, launchTime: 4.5 } as const;
    expect(resetEnergyRelay(options)).toEqual(resetEnergyRelay(options));
    expect(createEnergyRelayRun(options)).toEqual(resetEnergyRelay(options));

    const initial = createEnergyRelayRun({ replayIndex: 0 });
    const replayOne = replayEnergyRelay(initial, 0);
    const replayTwo = replayEnergyRelay(replayOne, 0);
    expect(replayOne.scenario).toEqual(energyRelayScenarioForReplay(1));
    expect(replayTwo.scenario).toEqual(energyRelayScenarioForReplay(2));
    expect(energyRelayScenarioForReplay(4)).toEqual(energyRelayScenarioForReplay(0));
    expect(energyRelayScenarioForReplay(-1)).toEqual(energyRelayScenarioForReplay(3));
  });
});
