import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProgressState {
  progress: Record<string, boolean>;
  markComplete: (id: string) => void;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      progress: {},
      markComplete: (id: string) => 
        set((state) => ({ 
          progress: { ...state.progress, [id]: true } 
        })),
      resetProgress: () => set({ progress: {} }),
    }),
    {
      name: 'wavemotion-progress',
    }
  )
);
