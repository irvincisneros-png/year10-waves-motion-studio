/**
 * Pure, framework-free progress data model + import sanitisation.
 *
 * Kept separate from the Zustand store so the validation logic (the security-
 * sensitive part) can be unit-tested directly. No `eval`, no dynamic code,
 * no React or storage imports.
 */

export type OutcomeLevel = 'not-attempted' | 'developing' | 'secure';

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
}

export interface ProgressData {
  outcomes: Record<string, OutcomeLevel>;
  evidence: EvidenceEntry[];
}

export const PROGRESS_SCHEMA = 'wavemotion.progress';
export const PROGRESS_SCHEMA_VERSION = 1;

/** Hard limits applied during import to bound memory + resist abuse. */
export const IMPORT_MAX_BYTES = 1_048_576; // 1 MB
const MAX_EVIDENCE_ENTRIES = 5000;
const MAX_STRING_LEN = 2000;
const MAX_CODE_LEN = 32;

export function emptyProgress(): ProgressData {
  return { outcomes: {}, evidence: [] };
}

export interface ProgressExport {
  schema: typeof PROGRESS_SCHEMA;
  version: number;
  exportedAt: string;
  data: ProgressData;
}

export function serialiseProgress(data: ProgressData): string {
  const payload: ProgressExport = {
    schema: PROGRESS_SCHEMA,
    version: PROGRESS_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
  return JSON.stringify(payload, null, 2);
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

  const outcomes: Record<string, OutcomeLevel> = {};
  if (isPlainObject(outcomesRaw)) {
    for (const [code, level] of Object.entries(outcomesRaw)) {
      if (code.length > MAX_CODE_LEN) continue;
      if (typeof level === 'string' && OUTCOME_LEVELS.includes(level as OutcomeLevel)) {
        outcomes[code] = level as OutcomeLevel;
      }
    }
  }

  const evidence: EvidenceEntry[] = [];
  if (Array.isArray(evidenceRaw)) {
    for (const item of evidenceRaw.slice(0, MAX_EVIDENCE_ENTRIES)) {
      if (!isPlainObject(item)) continue;
      const code = item.outcomeCode;
      evidence.push({
        id: clampString(item.id, MAX_CODE_LEN) || crypto.randomUUID(),
        outcomeCode:
          typeof code === 'string' && code.length <= MAX_CODE_LEN ? code : null,
        kind: clampString(item.kind, 64),
        summary: clampString(item.summary),
        createdAt: clampString(item.createdAt, 40) || new Date().toISOString(),
      });
    }
  }

  return { ok: true, data: { outcomes, evidence } };
}
