/**
 * Pure, framework-free progress data model + import sanitisation.
 *
 * Kept separate from the Zustand store so the validation logic (the security-
 * sensitive part) can be unit-tested directly. No `eval`, no dynamic code,
 * no React or storage imports.
 */

export type OutcomeLevel = 'not-attempted' | 'developing' | 'secure';
export type EvidenceResult = 'attempted' | 'successful';

export const OUTCOME_LEVELS: readonly OutcomeLevel[] = [
  'not-attempted',
  'developing',
  'secure',
];

export interface EvidenceEntry {
  id: string;
  outcomeCode: string | null;
  /** e.g. 'check', 'investigation', 'explanation' — free-form but bounded. */
  kind: string;
  summary: string;
  createdAt: string;
  /** Stable activity/question key used to deduplicate qualifying evidence. */
  activityId?: string;
  /** A submitted attempt or a complete/correct evidence point. */
  result?: EvidenceResult;
}

export interface ProgressData {
  outcomes: Record<string, OutcomeLevel>;
  evidence: EvidenceEntry[];
}

export const PROGRESS_SCHEMA = 'wavemotion.progress';
export const PROGRESS_SCHEMA_VERSION = 2;

/** Hard limits applied during import to bound memory + resist abuse. */
export const IMPORT_MAX_BYTES = 1_048_576; // 1 MB
const MAX_EVIDENCE_ENTRIES = 5000;
const MAX_STRING_LEN = 2000;
const MAX_CODE_LEN = 32;

export function emptyProgress(): ProgressData {
  return { outcomes: {}, evidence: [] };
}

function inferredEvidenceResult(entry: EvidenceEntry): EvidenceResult {
  if (entry.result) return entry.result;
  return /incorrect|incomplete|attempted/i.test(entry.summary)
    ? 'attempted'
    : 'successful';
}

export function evidenceKey(entry: EvidenceEntry): string {
  if (entry.activityId?.trim()) return entry.activityId.trim();
  if (entry.kind === 'check') {
    const questionId = entry.summary.split(':', 1)[0].trim();
    if (questionId && !questionId.includes(' ')) return `check:${questionId}`;
  }
  return entry.kind || 'evidence';
}

/** Secure requires two distinct successful evidence keys; duplicates never promote. */
export function deriveOutcomeLevel(
  evidence: readonly EvidenceEntry[],
  outcomeCode: string,
): OutcomeLevel {
  const relevant = evidence.filter((entry) => entry.outcomeCode === outcomeCode);
  if (relevant.length === 0) return 'not-attempted';
  const successfulKeys = new Set(
    relevant
      .filter((entry) => inferredEvidenceResult(entry) === 'successful')
      .map(evidenceKey),
  );
  return successfulKeys.size >= 2 ? 'secure' : 'developing';
}

export function deriveOutcomeLevels(
  evidence: readonly EvidenceEntry[],
): Record<string, OutcomeLevel> {
  const codes = new Set(
    evidence
      .map((entry) => entry.outcomeCode)
      .filter((code): code is string => typeof code === 'string'),
  );
  return Object.fromEntries(
    [...codes]
      .map((code) => [code, deriveOutcomeLevel(evidence, code)] as const)
      .filter(([, level]) => level !== 'not-attempted'),
  );
}

export interface ProgressExport {
  schema: typeof PROGRESS_SCHEMA;
  version: number;
  exportedAt: string;
  data: ProgressData;
}

export function serialiseProgress(data: ProgressData): string {
  const derived = { outcomes: deriveOutcomeLevels(data.evidence), evidence: data.evidence };
  const payload: ProgressExport = {
    schema: PROGRESS_SCHEMA,
    version: PROGRESS_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: derived,
  };
  return JSON.stringify(payload, null, 2);
}

export interface AnonymousProgressRow {
  outcomeCode: string;
  level: OutcomeLevel;
  evidenceCount: number;
  successfulEvidenceCount: number;
}

export function anonymousProgressRows(
  data: ProgressData,
  outcomeCodes: readonly string[],
): AnonymousProgressRow[] {
  return outcomeCodes.map((outcomeCode) => {
    const relevant = data.evidence.filter((entry) => entry.outcomeCode === outcomeCode);
    return {
      outcomeCode,
      level: deriveOutcomeLevel(data.evidence, outcomeCode),
      evidenceCount: new Set(relevant.map(evidenceKey)).size,
      successfulEvidenceCount: new Set(
        relevant
          .filter((entry) => inferredEvidenceResult(entry) === 'successful')
          .map(evidenceKey),
      ).size,
    };
  });
}

export function serialiseAnonymousProgress(
  data: ProgressData,
  outcomeCodes: readonly string[],
): string {
  return JSON.stringify({
    schema: 'wavemotion.anonymous-summary',
    version: 1,
    outcomes: anonymousProgressRows(data, outcomeCodes),
  }, null, 2);
}

export function anonymousProgressCsv(
  data: ProgressData,
  outcomeCodes: readonly string[],
): string {
  return [
    'outcome_code,level,evidence_points,successful_evidence_points',
    ...anonymousProgressRows(data, outcomeCodes).map((row) =>
      [row.outcomeCode, row.level, row.evidenceCount, row.successfulEvidenceCount].join(','),
    ),
  ].join('\n');
}

export type ImportResult =
  | { ok: true; data: ProgressData }
  | { ok: false; error: string };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function clampString(v: unknown, max = MAX_STRING_LEN): string {
  return typeof v === 'string' ? v.slice(0, max) : '';
}

/**
 * Parse + sanitise an untrusted JSON string into ProgressData.
 * Rejects oversized input, non-JSON, and wrong-shaped payloads. Unknown keys
 * are dropped; every field is coerced to a safe, bounded value.
 */
export function sanitiseImport(raw: string): ImportResult {
  if (typeof raw !== 'string' || raw.length === 0) {
    return { ok: false, error: 'No data to import.' };
  }
  // Byte-length cap (UTF-8 aware) — reject before parsing.
  const byteLen =
    typeof TextEncoder !== 'undefined'
      ? new TextEncoder().encode(raw).length
      : raw.length;
  if (byteLen > IMPORT_MAX_BYTES) {
    return {
      ok: false,
      error: `File is too large (over ${Math.round(IMPORT_MAX_BYTES / 1024)} KB). Import rejected.`,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'File is not valid JSON.' };
  }

  if (!isPlainObject(parsed)) {
    return { ok: false, error: 'Unexpected file structure.' };
  }

  // Accept either a wrapped export ({schema, version, data}) or a bare
  // ProgressData object.
  const container =
    'data' in parsed && isPlainObject(parsed.data)
      ? (parsed.data as Record<string, unknown>)
      : parsed;

  const outcomesRaw = container.outcomes;
  const evidenceRaw = container.evidence;

  if (
    (outcomesRaw !== undefined && !isPlainObject(outcomesRaw)) ||
    (evidenceRaw !== undefined && !Array.isArray(evidenceRaw))
  ) {
    return { ok: false, error: 'Unexpected file structure.' };
  }

  const evidence: EvidenceEntry[] = [];
  if (Array.isArray(evidenceRaw)) {
    for (const item of evidenceRaw.slice(0, MAX_EVIDENCE_ENTRIES)) {
      if (!isPlainObject(item)) continue;
      const code = item.outcomeCode;
      const resultValue = item.result;
      evidence.push({
        id: clampString(item.id, MAX_CODE_LEN) || crypto.randomUUID(),
        outcomeCode:
          typeof code === 'string' && code.length <= MAX_CODE_LEN ? code : null,
        kind: clampString(item.kind, 64),
        summary: clampString(item.summary),
        createdAt: clampString(item.createdAt, 40) || new Date().toISOString(),
        activityId: clampString(item.activityId, 128) || undefined,
        result:
          resultValue === 'attempted' || resultValue === 'successful'
            ? resultValue
            : undefined,
      });
    }
  }

  return { ok: true, data: { outcomes: deriveOutcomeLevels(evidence), evidence } };
}
