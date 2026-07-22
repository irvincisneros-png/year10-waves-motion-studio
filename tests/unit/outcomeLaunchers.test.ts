import { describe, expect, it } from 'vitest';
import { OUTCOME_LAUNCHERS } from '../../src/content/outcomeLaunchers';
import { outcomeMap } from '../../src/content/outcomes';

describe('outcome-first launcher registry', () => {
  it('contains one launcher for every active outcome and excludes deferred 7.2.5', () => {
    expect(OUTCOME_LAUNCHERS).toHaveLength(24);
    expect(new Set(OUTCOME_LAUNCHERS.map((launcher) => launcher.code)).size).toBe(24);
    expect(OUTCOME_LAUNCHERS.some((launcher) => launcher.code === '7.2.5')).toBe(false);
  });

  it('uses exact canonical wording on every launcher', () => {
    for (const launcher of OUTCOME_LAUNCHERS) {
      expect(launcher.wording).toBe(outcomeMap[launcher.code].text);
    }
  });

  it('launches each completed simulator from its canonical route', () => {
    expect(OUTCOME_LAUNCHERS.find((launcher) => launcher.code === '7.1.1')).toMatchObject({
      route: '/simulators/7.1.1',
      experienceStatus: 'gold-standard',
    });
    expect(OUTCOME_LAUNCHERS.find((launcher) => launcher.code === '7.1.2')).toMatchObject({
      route: '/simulators/7.1.2',
      experienceStatus: 'canonical',
    });
  });
});
