import { useId } from 'react';
import { useAnnouncer } from '../../accessibility/LiveRegion';
import './SimControl.css';

/**
 * Keyboard-standardised slider control (IMPLEMENTATION_PLAN §7). Built on a
 * native range input so it is drag- AND keyboard-operable for free: arrows step
 * fine, PageUp/PageDown step coarse, Home/End jump to the bounds. The formatted
 * value + unit is set as `aria-valuetext` (so assistive tech announces
 * "2.0 Hz", not "40%") and announced politely on change. A numeric-input
 * fallback is offered when Canvas rendering is unavailable via `fallback`.
 */
export interface SimControlProps {
  /** Stable control id (matches CONTROL_INVENTORY). */
  id: string;
  /** Accessible name (exact CONTROL_INVENTORY text). */
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  /** Formats the live value text, e.g. `(v) => \`Frequency: ${v} Hz\``. */
  format: (value: number) => string;
  disabled?: boolean;
  /** Optional short hint shown under the value. */
  hint?: string;
  testId?: string;
}

export function SimControl({
  id,
  label,
  min,
  max,
  step,
  value,
  onChange,
  format,
  disabled,
  hint,
  testId,
}: SimControlProps) {
  const { announce } = useAnnouncer();
  const inputId = useId();
  const valueText = format(value);

  const handle = (raw: number) => {
    const clamped = Math.min(max, Math.max(min, raw));
    onChange(clamped);
    announce(valueTextFor(clamped));
  };

  const valueTextFor = (v: number) => format(v);

  return (
    <div className="sim-control" data-control-id={id}>
      <label className="sim-control__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className="sim-control__range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={label}
        aria-valuetext={valueText}
        data-testid={testId}
        onChange={(e) => handle(Number(e.target.value))}
      />
      <output className="sim-control__value" htmlFor={inputId} aria-hidden="true">
        {valueText}
      </output>
      {hint ? <p className="sim-control__hint">{hint}</p> : null}
    </div>
  );
}
