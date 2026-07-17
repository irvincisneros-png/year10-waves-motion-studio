import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from './safeStorage';
import { outcomeMap, type Outcome } from '../content/outcomes';
import {
  emptyProgress,
  sanitiseImport,
  serialiseProgress,
  type EvidenceEntry,
  type ImportResult,
  type OutcomeLevel,
  type ProgressData,
} from './progressData';

/**
 * Versioned, persisted progress store (`wavemotion.v1`).
 *
 * Holds per-outcome evidence level (not-attempted / developing / secure) and a
 * list of generic evidence entries. Provides JSON export, sanitised + size-
 * capped import, and module/all resets (callers confirm before resetAll).
 */

export interface ProgressStoreState extends ProgressData {
  setOutcomeLevel: (code: string, level: OutcomeLevel) => void;
  addEvidence: (entry: Omit<EvidenceEntry, 'id' | 'createdAt'>) => void;
  exportJSON: () => string;
  importJSON: (raw: string) => ImportResult;
  /** Reset every outcome + evidence belonging to one strand id. */
  resetModule: (strandId: Outcome['strand']) => void;
  resetAll: () => void;
}

export const PROGRESS_STORAGE_KEY = 'wavemotion.v1';
export const PROGRESS_STORE_VERSION = 1;

export const useProgressStore = create<ProgressStoreState>()(
  persist(
    (set, get) => ({
      ...emptyProgress(),

      setOutcomeLevel: (code, level) =>
        set((state) => ({ outcomes: { ...state.outcomes, [code]: level } })),

      addEvidence: (entry) =>
        set((state) => ({
          evidence: [
            ...state.evidence,
            {
              ...entry,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      exportJSON: () => {
        const { outcomes, evidence } = get();
        return serialiseProgress({ outcomes, evidence });
      },

      importJSON: (raw) => {
        const result = sanitiseImport(raw);
        if (result.ok) {
          set({ outcomes: result.data.outcomes, evidence: result.data.evidence });
        }
        return result;
      },

      resetModule: (strandId) =>
        set((state) => {
          const codes = new Set(
            Object.values(outcomeMap)
              .filter((o) => o.strand === strandId)
              .map((o) => o.code),
          );
          const outcomes: Record<string, OutcomeLevel> = {};
          for (const [code, level] of Object.entries(state.outcomes)) {
            if (!codes.has(code)) outcomes[code] = level;
          }
          const evidence = state.evidence.filter(
            (e) => e.outcomeCode === null || !codes.has(e.outcomeCode),
          );
          return { outcomes, evidence };
        }),

      resetAll: () => set({ ...emptyProgress() }),
    }),
    {
      name: PROGRESS_STORAGE_KEY,
      version: PROGRESS_STORE_VERSION,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ outcomes: s.outcomes, evidence: s.evidence }),
      // Migration stub — future schema bumps translate older persisted shapes
      // here. v1 is the initial schema, so nothing to migrate yet.
      migrate: (persisted, fromVersion): ProgressData => {
        if (fromVersion < 1 || !persisted || typeof persisted !== 'object') {
          return emptyProgress();
        }
        const p = persisted as Partial<ProgressData>;
        return {
          outcomes: p.outcomes ?? {},
          evidence: p.evidence ?? [],
        };
      },
    },
  ),
);
