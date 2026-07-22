import { outcomeMap } from './outcomes';
import { OUTCOME_RELEASE_REGISTRY } from './releaseRegistry';

export type OutcomeExperienceStatus = 'gold-standard' | 'legacy';

export interface OutcomeLauncher {
  code: string;
  wording: string;
  strand: string;
  route: string;
  activity: string;
  experienceStatus: OutcomeExperienceStatus;
}

/**
 * Student-facing launchers are outcome records, never workspace records.
 * During the prototype gate, 7.1.1 has the canonical simulator-first route;
 * other active outcomes retain a clearly labelled route to their existing
 * model until their own outcome-specific mode is approved and converted.
 */
export const OUTCOME_LAUNCHERS: readonly OutcomeLauncher[] =
  OUTCOME_RELEASE_REGISTRY.filter((entry) => entry.status === 'active').map((entry) => {
    const outcome = outcomeMap[entry.code];
    return {
      code: entry.code,
      wording: outcome.text,
      strand: outcome.strand,
      route: entry.code === '7.1.1' ? '/simulators/7.1.1' : entry.routes[0],
      activity: entry.activity,
      experienceStatus: entry.code === '7.1.1' ? 'gold-standard' : 'legacy',
    };
  });

export const OUTCOME_LAUNCHER_GROUPS = [
  {
    id: '7.1',
    title: 'Common properties of waves',
    accent: 'cyan',
  },
  {
    id: '7.2',
    title: 'Sound waves',
    accent: 'violet',
  },
  {
    id: '7.3',
    title: 'Light waves',
    accent: 'cyan',
  },
  {
    id: '7.4',
    title: 'Motion and forces',
    accent: 'violet',
  },
  {
    id: '7.5',
    title: 'Waves and motion in context',
    accent: 'cyan',
  },
] as const;
