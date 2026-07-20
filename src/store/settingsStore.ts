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
  layerVisibility: Record<TeacherLayer, boolean>;

  setAudioEnabled: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
  setLowGraphics: (v: boolean) => void;
  setPresentationMode: (v: boolean) => void;
  setLayerVisibility: (layer: TeacherLayer, visible: boolean) => void;
}

export const TEACHER_LAYERS = ['labels', 'values', 'equations', 'particles', 'vectors', 'trails', 'answers'] as const;
export type TeacherLayer = (typeof TEACHER_LAYERS)[number];
const defaultLayerVisibility = (): Record<TeacherLayer, boolean> => Object.fromEntries(
  TEACHER_LAYERS.map((layer) => [layer, true]),
) as Record<TeacherLayer, boolean>;

export const SETTINGS_STORAGE_KEY = 'wavemotion.settings.v1';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      audioEnabled: false,
      reducedMotion: prefersReducedMotionNow(),
      lowGraphics: false,
      presentationMode: false,
      layerVisibility: defaultLayerVisibility(),

      setAudioEnabled: (v) => set({ audioEnabled: v }),
      setReducedMotion: (v) => set({ reducedMotion: v }),
      setLowGraphics: (v) => set({ lowGraphics: v }),
      setPresentationMode: (v) => set({ presentationMode: v }),
      setLayerVisibility: (layer, visible) => set((state) => ({
        layerVisibility: { ...state.layerVisibility, [layer]: visible },
      })),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => safeStorage),
      // Only persist the values, not the actions.
      partialize: (s) => ({
        audioEnabled: s.audioEnabled,
        reducedMotion: s.reducedMotion,
        lowGraphics: s.lowGraphics,
        presentationMode: s.presentationMode,
        layerVisibility: s.layerVisibility,
      }),
      migrate: (persisted) => {
        const previous = persisted as Partial<SettingsState> | undefined;
        return {
          ...previous,
          layerVisibility: { ...defaultLayerVisibility(), ...(previous?.layerVisibility ?? {}) },
        } as SettingsState;
      },
    },
  ),
);
