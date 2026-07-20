import { outcomeMap } from './outcomes';

export type ReleaseStatus = 'active' | 'deferred';

export interface OutcomeReleaseEntry {
  code: string;
  status: ReleaseStatus;
  route: string | null;
  activity: string;
}

const routeByOutcome: Record<string, { route: string; activity: string }> = {
  '7.1.1': { route: '/waves/medium', activity: 'Medium or vacuum?' },
  '7.1.2': { route: '/waves/energy', activity: 'Energy transfer' },
  '7.1.3': { route: '/waves/types', activity: 'Wave types' },
  '7.1.4': { route: '/spectrum', activity: 'EM spectrum explorer' },
  '7.1.5': { route: '/waves/measure', activity: 'Wave measurement' },
  '7.1.6': { route: '/waves/measure', activity: 'Wave equation investigation' },
  '7.1.7': { route: '/spectrum', activity: 'EM uses evidence analysis' },
  '7.2.1': { route: '/sound/compression', activity: 'Compression and rarefaction' },
  '7.2.2': { route: '/sound/pitch-loudness', activity: 'Pitch and loudness' },
  '7.2.3': { route: '/sound/doppler', activity: 'Doppler effect' },
  '7.2.4': { route: '/hearing', activity: 'Ear response explorer' },
  '7.2.6': { route: '/ultrasound', activity: 'Synthetic ultrasound lab' },
  '7.3.1': { route: '/vision', activity: 'Eye response' },
  '7.3.2': { route: '/light/properties', activity: 'Light properties' },
  '7.3.3': { route: '/light/applications', activity: 'Light applications' },
  '7.3.4': { route: '/astronomy', activity: 'Reading starlight' },
  '7.4.1': { route: '/motion/track', activity: 'Signed track' },
  '7.4.2': { route: '/motion/diagrams', activity: 'Motion diagrams' },
  '7.4.3': { route: '/motion/graphs', activity: 'Motion graphs' },
  '7.4.4': { route: '/forces/cart', activity: 'F–m–a cart' },
  '7.4.5': { route: '/forces/applications', activity: 'Newton’s laws applications' },
  '7.4.6': { route: '/forces/vectors', activity: 'Force vectors' },
  '7.4.7': { route: '/forces/calculations', activity: 'Quantitative calculations' },
  '7.5.1': { route: '/society', activity: 'Society argument studio' },
};

export const OUTCOME_RELEASE_REGISTRY: readonly OutcomeReleaseEntry[] = Object.keys(outcomeMap).map((code) => {
  if (code === '7.2.5') {
    return { code, status: 'deferred', route: null, activity: 'Cultural sound investigation — awaiting approved sources' };
  }
  const mapping = routeByOutcome[code];
  if (!mapping) throw new Error(`Missing release mapping for ${code}`);
  return { code, status: 'active', ...mapping };
});

export const ACTIVE_OUTCOME_CODES = OUTCOME_RELEASE_REGISTRY
  .filter((entry) => entry.status === 'active')
  .map((entry) => entry.code);

export const DEFERRED_OUTCOME_CODES = OUTCOME_RELEASE_REGISTRY
  .filter((entry) => entry.status === 'deferred')
  .map((entry) => entry.code);
