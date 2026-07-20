import { describe, it, expect } from 'vitest';
import {
  IMPORT_MAX_BYTES,
  PROGRESS_SCHEMA,
  PROGRESS_SCHEMA_VERSION,
  emptyProgress,
  deriveOutcomeLevel,
  anonymousProgressCsv,
  serialiseAnonymousProgress,
  sanitiseImport,
  serialiseProgress,
} from '../../src/store/progressData';

describe('serialiseProgress', () => {
  it('wraps data in a versioned schema envelope', () => {
    const json = serialiseProgress({
      outcomes: { '7.1.1': 'secure' },
      evidence: [
        { id: 'a', outcomeCode: '7.1.1', kind: 'check', activityId: 'q1', result: 'successful', summary: 'name: Ada', createdAt: '2026-07-17' },
        { id: 'b', outcomeCode: '7.1.1', kind: 'explanation', activityId: 'cer1', result: 'successful', summary: 'written response', createdAt: '2026-07-18' },
      ],
    });
    const parsed = JSON.parse(json);
    expect(parsed.schema).toBe(PROGRESS_SCHEMA);
    expect(parsed.version).toBe(PROGRESS_SCHEMA_VERSION);
    expect(parsed.data.outcomes['7.1.1']).toBe('secure');
    expect(typeof parsed.exportedAt).toBe('string');
  });
});

describe('sanitiseImport', () => {
  it('round-trips its own export format', () => {
    const original = {
      outcomes: { '7.1.1': 'secure' as const, '7.2.1': 'developing' as const },
      evidence: [
        {
          id: 'abc',
          outcomeCode: '7.1.1',
          kind: 'check',
          summary: 'Answered the amplitude check correctly',
          createdAt: '2026-07-17T00:00:00.000Z',
        },
        {
          id: 'def',
          outcomeCode: '7.1.1',
          kind: 'explanation',
          activityId: 'wave-cer',
          result: 'successful' as const,
          summary: 'Completed wave explanation',
          createdAt: '2026-07-18T00:00:00.000Z',
        },
        {
          id: 'ghi',
          outcomeCode: '7.2.1',
          kind: 'check',
          activityId: 'sound-q1',
          result: 'attempted' as const,
          summary: 'Attempted sound check',
          createdAt: '2026-07-18T00:00:00.000Z',
        },
      ],
    };
    const result = sanitiseImport(serialiseProgress(original));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.outcomes).toEqual({ '7.1.1': 'secure', '7.2.1': 'developing' });
      expect(result.data.evidence).toEqual(original.evidence);
    }
  });

  it('accepts a bare ProgressData object (no envelope)', () => {
    const result = sanitiseImport(
      JSON.stringify({ outcomes: { '7.3.1': 'developing' }, evidence: [] }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.outcomes).toEqual({});
  });

  it('rejects empty input', () => {
    const result = sanitiseImport('');
    expect(result.ok).toBe(false);
  });

  it('rejects input over the 1 MB size cap', () => {
    const big = JSON.stringify({
      outcomes: {},
      evidence: [],
      padding: 'x'.repeat(IMPORT_MAX_BYTES),
    });
    const result = sanitiseImport(big);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/too large/i);
  });

  it('rejects non-JSON input', () => {
    const result = sanitiseImport('this is {{{ not json');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/not valid JSON/i);
  });

  it('rejects JSON that is not an object', () => {
    expect(sanitiseImport('42').ok).toBe(false);
    expect(sanitiseImport('"hello"').ok).toBe(false);
    expect(sanitiseImport('[1,2,3]').ok).toBe(false);
  });

  it('rejects wrong-typed outcomes/evidence fields', () => {
    expect(sanitiseImport(JSON.stringify({ outcomes: 'nope' })).ok).toBe(false);
    expect(sanitiseImport(JSON.stringify({ evidence: 'nope' })).ok).toBe(false);
  });

  it('does not trust imported outcome levels without supporting evidence', () => {
    const result = sanitiseImport(
      JSON.stringify({
        outcomes: {
          '7.1.1': 'secure',
          '7.1.2': 'expert', // not a valid level
          '7.1.3': 42, // not a string
        },
        evidence: [],
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.outcomes).toEqual({});
    }
  });

  it('clamps oversized strings and skips non-object evidence entries', () => {
    const result = sanitiseImport(
      JSON.stringify({
        outcomes: {},
        evidence: [
          'not an object',
          {
            id: 'ok',
            outcomeCode: '7.1.1',
            kind: 'k'.repeat(500),
            summary: 's'.repeat(10_000),
            createdAt: '2026-07-17',
          },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.evidence).toHaveLength(1);
      expect(result.data.evidence[0].kind.length).toBeLessThanOrEqual(64);
      expect(result.data.evidence[0].summary.length).toBeLessThanOrEqual(2000);
    }
  });

  it('never executes code from the payload (data only)', () => {
    // A payload full of function-looking strings imports as inert strings.
    const result = sanitiseImport(
      JSON.stringify({
        outcomes: { '7.1.1': 'secure' },
        evidence: [
          {
            id: 'x',
            outcomeCode: null,
            kind: 'constructor',
            summary: 'alert(1); require("fs")',
            createdAt: '__proto__',
          },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.evidence[0].summary).toBe('alert(1); require("fs")');
      // Prototype not polluted:
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    }
  });
});

describe('evidence-derived progress and anonymous summaries', () => {
  const evidence = [
    { id: 'a', outcomeCode: '7.1.1', kind: 'check', activityId: 'q1', result: 'successful' as const, summary: 'Student name: Ada', createdAt: '2026-07-17T10:12:30Z' },
    { id: 'b', outcomeCode: '7.1.1', kind: 'check', activityId: 'q1', result: 'successful' as const, summary: 'duplicate', createdAt: '2026-07-17T10:13:30Z' },
    { id: 'c', outcomeCode: '7.1.1', kind: 'explanation', activityId: 'cer1', result: 'successful' as const, summary: 'Private response', createdAt: '2026-07-17T10:14:30Z' },
  ];

  it('requires two distinct successful evidence keys for secure', () => {
    expect(deriveOutcomeLevel(evidence.slice(0, 1), '7.1.1')).toBe('developing');
    expect(deriveOutcomeLevel(evidence.slice(0, 2), '7.1.1')).toBe('developing');
    expect(deriveOutcomeLevel(evidence, '7.1.1')).toBe('secure');
  });

  it('anonymous JSON and CSV never contain free text, IDs or timestamps', () => {
    const data = { outcomes: {}, evidence };
    const json = serialiseAnonymousProgress(data, ['7.1.1']);
    const csv = anonymousProgressCsv(data, ['7.1.1']);
    for (const privateValue of ['Ada', 'Private response', '2026-07-17', '"id"']) {
      expect(json).not.toContain(privateValue);
      expect(csv).not.toContain(privateValue);
    }
    expect(json).toContain('"level": "secure"');
    expect(csv).toContain('7.1.1,secure,2,2');
  });
});

describe('emptyProgress', () => {
  it('is empty', () => {
    expect(emptyProgress()).toEqual({ outcomes: {}, evidence: [] });
  });
});
