import { beforeEach, describe, it, expect } from 'vitest';
import { useProgressStore } from '../../src/store/progressStore';

describe('progressStore', () => {
  beforeEach(() => {
    useProgressStore.getState().resetAll();
  });

  it('cannot promote an outcome without supporting evidence', () => {
    useProgressStore.getState().setOutcomeLevel('7.1.1', 'secure');
    expect(useProgressStore.getState().outcomes['7.1.1']).toBeUndefined();
  });

  it('adds evidence entries with generated id + timestamp', () => {
    useProgressStore.getState().addEvidence({
      outcomeCode: '7.1.1',
      kind: 'check',
      summary: 'test evidence',
    });
    const { evidence } = useProgressStore.getState();
    expect(evidence).toHaveLength(1);
    expect(evidence[0].id).toBeTruthy();
    expect(evidence[0].createdAt).toBeTruthy();
    expect(useProgressStore.getState().outcomes['7.1.1']).toBe('developing');
  });

  it('exportJSON produces importable JSON', () => {
    useProgressStore.getState().addEvidence({ outcomeCode: '7.2.1', kind: 'check', activityId: 'sound-q1', result: 'successful', summary: 'correct' });
    useProgressStore.getState().addEvidence({ outcomeCode: '7.2.1', kind: 'explanation', activityId: 'sound-cer', result: 'successful', summary: 'complete' });
    const json = useProgressStore.getState().exportJSON();
    useProgressStore.getState().resetAll();
    expect(useProgressStore.getState().outcomes['7.2.1']).toBeUndefined();
    const result = useProgressStore.getState().importJSON(json);
    expect(result.ok).toBe(true);
    expect(useProgressStore.getState().outcomes['7.2.1']).toBe('secure');
  });

  it('importJSON rejects malformed input without changing state', () => {
    useProgressStore.getState().addEvidence({ outcomeCode: '7.1.1', kind: 'check', activityId: 'q1', result: 'successful', summary: 'correct' });
    const result = useProgressStore.getState().importJSON('{{{');
    expect(result.ok).toBe(false);
    expect(useProgressStore.getState().outcomes['7.1.1']).toBe('developing');
  });

  it('resetModule clears only the given strand', () => {
    const s = useProgressStore.getState();
    s.addEvidence({ outcomeCode: '7.1.1', kind: 'check', activityId: 'waves-q', result: 'successful', summary: 'waves ev' });
    s.addEvidence({ outcomeCode: '7.1.1', kind: 'explanation', activityId: 'waves-cer', result: 'successful', summary: 'waves explanation' });
    s.addEvidence({ outcomeCode: '7.2.1', kind: 'check', activityId: 'sound-q', result: 'successful', summary: 'sound ev' });
    s.addEvidence({ outcomeCode: '7.2.1', kind: 'explanation', activityId: 'sound-cer', result: 'successful', summary: 'sound explanation' });

    useProgressStore.getState().resetModule('waves');

    const after = useProgressStore.getState();
    expect(after.outcomes['7.1.1']).toBeUndefined();
    expect(after.outcomes['7.2.1']).toBe('secure');
    expect(after.evidence).toHaveLength(2);
    expect(after.evidence[0].outcomeCode).toBe('7.2.1');
  });

  it('resetAll clears everything', () => {
    const s = useProgressStore.getState();
    s.setOutcomeLevel('7.1.1', 'secure');
    s.addEvidence({ outcomeCode: null, kind: 'note', summary: 'x' });
    useProgressStore.getState().resetAll();
    const after = useProgressStore.getState();
    expect(after.outcomes).toEqual({});
    expect(after.evidence).toEqual([]);
  });
});
