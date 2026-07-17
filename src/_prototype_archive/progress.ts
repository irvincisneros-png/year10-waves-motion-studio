import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProgressLevel = 'not attempted' | 'developing' | 'secure';

export interface OutcomeProgress {
  outcomeId: string;
  level: ProgressLevel;
  evidence: string[]; // List of IDs/names for activities completed
}

interface ProgressState {
  outcomes: Record<string, OutcomeProgress>;
  updateOutcome: (outcomeId: string, level: ProgressLevel, newEvidence?: string) => void;
  resetProgress: () => void;
  exportProgress: () => string;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      outcomes: {},
      updateOutcome: (outcomeId, level, newEvidence) => set((state) => {
        const existing = state.outcomes[outcomeId] || { outcomeId, level: 'not attempted', evidence: [] };
        
        const evidence = newEvidence && !existing.evidence.includes(newEvidence) 
          ? [...existing.evidence, newEvidence]
          : existing.evidence;
          
        return {
          outcomes: {
            ...state.outcomes,
            [outcomeId]: {
              ...existing,
              level,
              evidence
            }
          }
        };
      }),
      resetProgress: () => set({ outcomes: {} }),
      exportProgress: () => {
        const state = get();
        // Anonymous export with no PII
        return JSON.stringify({
          version: '1.0',
          timestamp: new Date().toISOString(),
          outcomes: state.outcomes
        }, null, 2);
      }
    }),
    {
      name: 'wavemotion-progress-storage', // unique name
      // Can be extended to use IndexedDB using a custom storage engine,
      // but localStorage is default for Zustand persist which meets spec.
    }
  )
);
