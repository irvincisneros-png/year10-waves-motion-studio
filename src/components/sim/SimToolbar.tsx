import { useId } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import './SimToolbar.css';

/**
 * Shared teacher/simulation controls (CONTROL_INVENTORY §1): pause/resume,
 * step, playback speed, reset, optional preset scenario, and presentation mode.
 * No colour-only state — every control carries an icon + text label.
 */
export interface Preset {
  id: string;
  label: string;
}

export interface SimToolbarProps {
  running: boolean;
  onToggleRun: () => void;
  onStep: () => void;
  speed: number;
  onSpeed: (speed: number) => void;
  onReset: () => void;
  /** Interpolated into "Reset …", e.g. "wave measurement lab". */
  resetLabel: string;
  presets?: Preset[];
  presetId?: string;
  onPreset?: (id: string) => void;
  presetLabel?: string;
}

const SPEEDS: { value: number; label: string; short: string }[] = [
  { value: 1, label: 'Normal speed', short: '1×' },
  { value: 0.5, label: 'Half speed', short: '0.5×' },
  { value: 0.25, label: 'Quarter speed', short: '0.25×' },
];

export function SimToolbar({
  running,
  onToggleRun,
  onStep,
  speed,
  onSpeed,
  onReset,
  resetLabel,
  presets,
  presetId,
  onPreset,
  presetLabel = 'Choose a preset scenario',
}: SimToolbarProps) {
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const presentationMode = useSettingsStore((s) => s.presentationMode);
  const setPresentationMode = useSettingsStore((s) => s.setPresentationMode);
  const speedGroup = useId();
  const presetSelectId = useId();

  // Step is available whenever the scene is paused, and always in reduced-motion
  // mode (which never autoplays).
  const stepEnabled = reducedMotion || !running;

  return (
    <div className="sim-toolbar" role="group" aria-label="Simulation controls">
      {!reducedMotion ? (
        <button
          type="button"
          className="btn sim-toolbar__btn"
          aria-pressed={!running}
          data-testid="sim-pause"
          data-control-id="global.pause-button"
          onClick={onToggleRun}
        >
          <span aria-hidden="true">{running ? '⏸' : '▶'}</span>
          {running ? 'Pause simulation' : 'Resume simulation'}
        </button>
      ) : null}

      <button
        type="button"
        className="btn sim-toolbar__btn"
        onClick={onStep}
        disabled={!stepEnabled}
        aria-disabled={!stepEnabled}
        data-testid="sim-step"
        data-control-id="global.step-button"
        title={stepEnabled ? undefined : 'Pause to step'}
      >
        <span aria-hidden="true">⏭</span>
        Step forward one frame
      </button>

      <fieldset
        className="sim-toolbar__speed"
        aria-describedby={undefined}
        data-control-id="global.slow-motion-toggle"
      >
        <legend className="sim-toolbar__legend">Playback speed</legend>
        {SPEEDS.map((s) => {
          const id = `${speedGroup}-${s.value}`;
          return (
            <label key={s.value} className="sim-toolbar__speed-option">
              <input
                type="radio"
                name={speedGroup}
                id={id}
                checked={speed === s.value}
                onChange={() => onSpeed(s.value)}
                aria-label={s.label}
              />
              <span aria-hidden="true">{s.short}</span>
            </label>
          );
        })}
      </fieldset>

      {presets && onPreset ? (
        <div className="sim-toolbar__preset">
          <label htmlFor={presetSelectId} className="sim-toolbar__preset-label">
            {presetLabel}
          </label>
          <select
            id={presetSelectId}
            className="sim-toolbar__select"
            value={presetId}
            aria-label={presetLabel}
            data-testid="sim-preset"
            data-control-id="global.preset-select"
            onChange={(e) => onPreset(e.target.value)}
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <button
        type="button"
        className="btn sim-toolbar__btn"
        onClick={onReset}
        data-testid="sim-reset"
        data-control-id="global.reset-button"
      >
        <span aria-hidden="true">↺</span>
        Reset {resetLabel}
      </button>

      <button
        type="button"
        className="btn sim-toolbar__btn"
        aria-pressed={presentationMode}
        data-testid="sim-presentation"
        data-control-id="global.presentation-mode-toggle"
        onClick={() => setPresentationMode(!presentationMode)}
      >
        <span aria-hidden="true">🖥</span>
        Presentation mode
      </button>
    </div>
  );
}
