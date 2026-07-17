import { useAnnouncer } from '../../accessibility/LiveRegion';
import { formatWithUnit, fromMeters, type DistanceUnit } from '../../science/units';

/**
 * Keyboard-operable ruler overlay control (CONTROL_INVENTORY
 * `wave-lab.ruler-tool-drag`): ←/→ move the ruler start, Shift+←/→ move the
 * end, PageUp/PageDown step coarsely, Home collapses to the chamber origin,
 * End stretches to the full chamber. Values are percentages of the chamber;
 * the readout converts to the active length unit.
 */
export interface RulerState {
  startPct: number;
  endPct: number;
}

export const RULER_DEFAULT: RulerState = { startPct: 0, endPct: 0 };

export interface RulerToolProps {
  ruler: RulerState;
  onChange: (r: RulerState) => void;
  chamberLengthM: number;
  lengthUnit: DistanceUnit;
  /** Optional measurement-noise transform applied to the displayed reading. */
  readSpan: (exactSpanM: number, ruler: RulerState) => number;
}

const FINE = 0.5;
const COARSE = 5;

export function RulerTool({ ruler, onChange, chamberLengthM, lengthUnit, readSpan }: RulerToolProps) {
  const { announce } = useAnnouncer();
  const clamp = (v: number) => Math.min(100, Math.max(0, v));

  const spanM = ((ruler.endPct - ruler.startPct) / 100) * chamberLengthM;
  const reading = readSpan(spanM, ruler);
  const readingText = formatWithUnit(fromMeters(reading, lengthUnit), lengthUnit);

  const apply = (next: RulerState) => {
    const fixed = {
      startPct: clamp(Math.min(next.startPct, next.endPct)),
      endPct: clamp(Math.max(next.startPct, next.endPct)),
    };
    onChange(fixed);
    const s = ((fixed.endPct - fixed.startPct) / 100) * chamberLengthM;
    announce(`Ruler span ${formatWithUnit(fromMeters(readSpan(s, fixed), lengthUnit), lengthUnit)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.key === 'PageUp' || e.key === 'PageDown' ? COARSE : FINE;
    let handled = true;
    if (e.key === 'Home') {
      apply({ startPct: 0, endPct: 0 });
    } else if (e.key === 'End') {
      apply({ startPct: 0, endPct: 100 });
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      if (e.shiftKey) apply({ ...ruler, endPct: ruler.endPct - step });
      else apply({ ...ruler, startPct: ruler.startPct - step });
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      if (e.shiftKey) apply({ ...ruler, endPct: ruler.endPct + step });
      else apply({ ...ruler, startPct: ruler.startPct + step });
    } else if (e.key === 'PageDown') {
      apply({ ...ruler, endPct: ruler.endPct - step });
    } else if (e.key === 'PageUp') {
      apply({ ...ruler, endPct: ruler.endPct + step });
    } else {
      handled = false;
    }
    if (handled) e.preventDefault();
  };

  return (
    <div className="ruler-tool" data-control-id="wave-lab.ruler-tool-drag">
      <span className="field__label" id="ruler-tool-label">
        Ruler tool
      </span>
      <div
        role="slider"
        tabIndex={0}
        aria-labelledby="ruler-tool-label"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(ruler.endPct - ruler.startPct)}
        aria-valuetext={`Ruler from ${formatWithUnit(fromMeters((ruler.startPct / 100) * chamberLengthM, lengthUnit), lengthUnit)} to ${formatWithUnit(fromMeters((ruler.endPct / 100) * chamberLengthM, lengthUnit), lengthUnit)}, span ${readingText}`}
        className="ruler-tool__handle"
        onKeyDown={onKeyDown}
        data-testid="ruler-tool"
      >
        Span: <output data-testid="ruler-span">&nbsp;{readingText}</output>
      </div>
      <p className="sim-control__hint">
        Arrows move the ruler start · Shift+arrows move the end · Home collapses
        · End stretches across the chamber.
      </p>
    </div>
  );
}
