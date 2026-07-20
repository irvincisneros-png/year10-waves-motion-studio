import { describe, expect, it } from 'vitest';
import { outcomeMap } from '../../src/content/outcomes';
import { ACTIVE_OUTCOME_CODES, DEFERRED_OUTCOME_CODES, OUTCOME_RELEASE_REGISTRY } from '../../src/content/releaseRegistry';
import { SOCIETY_EVIDENCE_PACKS } from '../../src/content/stageSixContent';

describe('Stage 6 release registry', () => {
  it('maps every canonical outcome exactly once and keeps only 7.2.5 deferred', () => {
    expect(OUTCOME_RELEASE_REGISTRY).toHaveLength(Object.keys(outcomeMap).length);
    expect(new Set(OUTCOME_RELEASE_REGISTRY.map((entry) => entry.code)).size).toBe(OUTCOME_RELEASE_REGISTRY.length);
    expect(ACTIVE_OUTCOME_CODES).toHaveLength(24);
    expect(DEFERRED_OUTCOME_CODES).toEqual(['7.2.5']);
    expect(OUTCOME_RELEASE_REGISTRY.find((entry) => entry.code === '7.2.5')).toMatchObject({
      routes: [],
      status: 'deferred',
      verificationStatus: 'deferred',
    });
    expect(OUTCOME_RELEASE_REGISTRY.find((entry) => entry.code === '7.1.1')).toMatchObject({ verificationStatus: 'verified' });
    expect(OUTCOME_RELEASE_REGISTRY.find((entry) => entry.code === '7.2.1')).toMatchObject({ verificationStatus: 'verified (builder)' });
    expect(OUTCOME_RELEASE_REGISTRY.find((entry) => entry.code === '7.4.1')?.routes).toEqual(['/motion/track', '/motion/graphs']);
    expect(OUTCOME_RELEASE_REGISTRY.find((entry) => entry.code === '7.4.7')?.routes).toEqual(['/forces/calculations', '/forces/cart', '/motion/graphs']);
    for (const entry of OUTCOME_RELEASE_REGISTRY.filter((item) => item.status === 'active')) {
      expect(entry.routes.length, entry.code).toBeGreaterThan(0);
      expect(entry.verificationStatus, entry.code).not.toBe('deferred');
    }
  });
});

describe('society evidence packs', () => {
  it('ships six complete, sourced and review-dated packs', () => {
    expect(SOCIETY_EVIDENCE_PACKS).toHaveLength(6);
    expect(new Set(SOCIETY_EVIDENCE_PACKS.map((pack) => pack.id)).size).toBe(6);
    for (const pack of SOCIETY_EVIDENCE_PACKS) {
      for (const value of [pack.benefit, pack.limitation, pack.affectedGroups, pack.historicalChange, pack.quantitativeEvidence, pack.competingConsiderations]) {
        expect(value.trim().length).toBeGreaterThan(20);
      }
      expect(pack.sourceUrl).toMatch(/^https:\/\//);
      expect(pack.reviewDate).toMatch(/^2026-/);
    }
  });
});
