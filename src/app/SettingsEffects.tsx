import { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Reflects persisted settings onto <html> data attributes so CSS (motion
 * policy, low-graphics flattening, presentation sizing) responds globally.
 * Renders nothing.
 */
export function SettingsEffects() {
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const lowGraphics = useSettingsStore((s) => s.lowGraphics);
  const presentationMode = useSettingsStore((s) => s.presentationMode);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-reduced-motion', String(reducedMotion));
    root.setAttribute('data-low-graphics', String(lowGraphics));
    root.setAttribute('data-presentation', String(presentationMode));
  }, [reducedMotion, lowGraphics, presentationMode]);

  return null;
}
