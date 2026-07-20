import { useEffect } from 'react';
import { TEACHER_LAYERS, useSettingsStore } from '../store/settingsStore';

/**
 * Reflects persisted settings onto <html> data attributes so CSS (motion
 * policy, low-graphics flattening, presentation sizing) responds globally.
 * Renders nothing.
 */
export function SettingsEffects() {
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const lowGraphics = useSettingsStore((s) => s.lowGraphics);
  const presentationMode = useSettingsStore((s) => s.presentationMode);
  const layerVisibility = useSettingsStore((s) => s.layerVisibility);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-reduced-motion', String(reducedMotion));
    root.setAttribute('data-low-graphics', String(lowGraphics));
    root.setAttribute('data-presentation', String(presentationMode));
    for (const layer of TEACHER_LAYERS) {
      root.setAttribute(`data-layer-${layer}`, String(layerVisibility[layer]));
    }
  }, [reducedMotion, lowGraphics, presentationMode, layerVisibility]);

  return null;
}
