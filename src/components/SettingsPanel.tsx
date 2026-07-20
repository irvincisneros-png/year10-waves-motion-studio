import { useId, useRef, useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import './SettingsPanel.css';

interface ToggleRowProps {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  testId: string;
  controlId: string;
}

function ToggleRow({ label, hint, checked, onChange, testId, controlId }: ToggleRowProps) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        data-testid={testId}
        data-control-id={controlId}
      />
      <span className="toggle__text">
        <span className="toggle__label">{label}</span>
        <span className="toggle__hint">{hint}</span>
      </span>
    </label>
  );
}

/**
 * Display & sound settings as a keyboard-operable disclosure in the header.
 * The panel renders in normal document flow (no overlay/focus trap needed);
 * Escape closes it and returns focus to the button.
 */
export function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const audioEnabled = useSettingsStore((s) => s.audioEnabled);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const lowGraphics = useSettingsStore((s) => s.lowGraphics);
  const setAudioEnabled = useSettingsStore((s) => s.setAudioEnabled);
  const setReducedMotion = useSettingsStore((s) => s.setReducedMotion);
  const setLowGraphics = useSettingsStore((s) => s.setLowGraphics);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div
      className="settings"
      data-control-id="global.settings-panel"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          close();
        }
      }}
    >
      <button
        type="button"
        ref={buttonRef}
        className="settings__button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        Settings
      </button>
      {open ? (
        <div id={panelId} className="settings__panel">
          <h2 className="settings__heading">Display &amp; sound</h2>
          <ToggleRow
            label="Reduce motion"
            hint="Replaces animation with static or stepped views."
            checked={reducedMotion}
            onChange={setReducedMotion}
            testId="toggle-reduced-motion"
            controlId="global.reduced-motion-toggle"
          />
          <ToggleRow
            label="Low graphics"
            hint="Simplifies visuals on slower devices. Results never change."
            checked={lowGraphics}
            onChange={setLowGraphics}
            testId="toggle-low-graphics"
            controlId="global.low-graphics-toggle"
          />
          <ToggleRow
            label="Enable sound"
            hint="Allows optional audio controls. Each activity still requires its own explicit enable action and starts muted."
            checked={audioEnabled}
            onChange={setAudioEnabled}
            testId="toggle-audio"
            controlId="global.audio-permission-toggle"
          />
          <button type="button" className="btn settings__close" onClick={close}>
            Close settings
          </button>
        </div>
      ) : null}
    </div>
  );
}
