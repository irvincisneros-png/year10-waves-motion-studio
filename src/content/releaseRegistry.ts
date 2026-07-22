import { outcomeMap } from './outcomes';

export type ReleaseStatus = 'active' | 'deferred';
export type VerificationStatus = 'verified' | 'verified (builder)' | 'deferred';

export interface OutcomeReleaseEntry {
  code: string;
  status: ReleaseStatus;
  verificationStatus: VerificationStatus;
  routes: readonly string[];
  activity: string;
}

const routesByOutcome: Record<string, { routes: readonly string[]; activity: string }> = {
  '7.1.1': { routes: ['/simulators/7.1.1', '/waves/medium'], activity: 'Transmission Lab — medium or vacuum?' },
  '7.1.2': { routes: ['/waves/energy'], activity: 'Energy transfer' },
  '7.1.3': { routes: ['/waves/types'], activity: 'Wave types' },
  '7.1.4': { routes: ['/spectrum'], activity: 'EM spectrum explorer' },
  '7.1.5': { routes: ['/waves/measure'], activity: 'Wave measurement' },
  '7.1.6': { routes: ['/waves/measure'], activity: 'Wave equation investigation' },
  '7.1.7': { routes: ['/spectrum'], activity: 'EM uses evidence analysis' },
  '7.2.1': { routes: ['/sound/compression'], activity: 'Compression and rarefaction' },
  '7.2.2': { routes: ['/sound/pitch-loudness'], activity: 'Pitch and loudness' },
  '7.2.3': { routes: ['/sound/doppler'], activity: 'Doppler effect' },
  '7.2.4': { routes: ['/hearing'], activity: 'Ear response explorer' },
  '7.2.6': { routes: ['/ultrasound'], activity: 'Synthetic ultrasound lab' },
  '7.3.1': { routes: ['/vision'], activity: 'Eye response' },
  '7.3.2': { routes: ['/light/properties'], activity: 'Light properties' },
  '7.3.3': { routes: ['/light/applications'], activity: 'Light applications' },
  '7.3.4': { routes: ['/astronomy'], activity: 'Reading starlight' },
  '7.4.1': { routes: ['/motion/track', '/motion/graphs'], activity: 'Signed track and graph investigation' },
  '7.4.2': { routes: ['/motion/diagrams'], activity: 'Motion diagrams' },
  '7.4.3': { routes: ['/motion/graphs'], activity: 'Motion graphs' },
  '7.4.4': { routes: ['/forces/cart'], activity: 'F–m–a cart' },
  '7.4.5': { routes: ['/forces/applications'], activity: 'Newton’s laws applications' },
  '7.4.6': { routes: ['/forces/vectors'], activity: 'Force vectors' },
  '7.4.7': { routes: ['/forces/calculations', '/forces/cart', '/motion/graphs'], activity: 'Quantitative calculations and verification' },
  '7.5.1': { routes: ['/society'], activity: 'Society argument studio' },
};

const independentlyVerifiedCodes = new Set(['7.1.1', '7.1.2', '7.1.3', '7.1.5', '7.1.6']);

export const OUTCOME_RELEASE_REGISTRY: readonly OutcomeReleaseEntry[] = Object.keys(outcomeMap).map((code) => {
  if (code === '7.2.5') {
    return {
      code,
      status: 'deferred',
      verificationStatus: 'deferred',
      routes: [],
      activity: 'Cultural sound investigation — awaiting approved sources',
    };
  }
  const mapping = routesByOutcome[code];
  if (!mapping) throw new Error(`Missing release mapping for ${code}`);
  return {
    code,
    status: 'active',
    verificationStatus: independentlyVerifiedCodes.has(code) ? 'verified' : 'verified (builder)',
    ...mapping,
  };
});

export const ACTIVE_OUTCOME_CODES = OUTCOME_RELEASE_REGISTRY
  .filter((entry) => entry.status === 'active')
  .map((entry) => entry.code);

export const DEFERRED_OUTCOME_CODES = OUTCOME_RELEASE_REGISTRY
  .filter((entry) => entry.status === 'deferred')
  .map((entry) => entry.code);
