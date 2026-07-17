import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from './safeStorage';
import { prefersReducedMotionNow } from '../accessibility/useReducedMotion';

export interface SettingsState {
  /** Web Audio is strictly opt-in; default OFF. */
  audioEnabled: boolean;
  /** Reduced-motion override. Defaults from the OS preference on first load. */
  reducedMotion: boolean;
  /** Low-graphics rendering (flatter visuals; never changes results). */
  lowGraphics: boolean;
  /** Presentation/projection mode for teacher demonstration. */
  presentationMode: boolean;

  setAudioEnabled: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
  setLowGraphics: (v: boolean) => void;
  setPresentationMode: (v: boolean) => void;
}

export const SETTINGS_STORAGE_KEY = 'wavemotion.settings.v1';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      audioEnabled: false,
      reducedMotion: prefersReducedMotionNow(),
      lowGraphics: false,
      presentationMode: false,

      setAudioEnabled: (v) => set({ audioEnabled: v }),
      setReducedMotion: (v) => set({ reducedMotion: v }),
      setLowGraphics: (v) => set({ lowGraphics: v }),
      setPresentationMode: (v) => set({ presentationMode: v }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      // Only persist the values, not the actions.
      partialize: (s) => ({
        audioEnabled: s.audioEnabled,
        reducedMotion: s.reducedMotion,
        lowGraphics: s.lowGraphics,
        presentationMode: s.presentationMode,
      }),
    },
  ),
);
