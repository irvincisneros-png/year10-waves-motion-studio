import { useEffect, useRef, useState, type ReactNode } from 'react';
import './CanvasScene.css';

/**
 * Canvas 2D scene wrapper (IMPLEMENTATION_PLAN §6):
 * - DPR capped at 2; resizes with its container;
 * - if `getContext('2d')` is unavailable, renders ONLY the accessible
 *   alternative plus a clear notice (never a blank canvas area);
 * - the accessible alternative is ALWAYS rendered adjacent to the canvas
 *   (live text/table equivalent, throttled by the parent);
 * - cleanup on unmount (no leaked observers).
 *
 * The parent owns the clock; `draw` re-runs whenever `frameKey` changes.
 */
export interface CanvasSceneProps {
  /** Accessible label describing the scene. */
  label: string;
  /** Scene height in CSS px. */
  height: number;
  /** Redraw trigger (typically the sim time, plus any control values). */
  frameKey: unknown;
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  /** Visible accessible alternative (data table / text summary). */
  alternative: ReactNode;
  /** Test id for the canvas element. */
  testId?: string;
  /** Optional teacher layer represented by this visual scene. */
  teacherLayer?: 'particles' | 'vectors' | 'trails';
}

export function CanvasScene({ label, height, frameKey, draw, alternative, testId, teacherLayer }: CanvasSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(true);
  const [width, setWidth] = useState(0);

  // Track container width.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Draw on every frame/size change; detect missing Canvas support once.
  useEffect(() => {
    if (!supported || width === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setSupported(false);
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    draw(ctx, width, height);
    ctx.restore();
    // frameKey is the deliberate redraw trigger.
  }, [supported, width, height, draw, frameKey]);

  return (
    <div className="canvas-scene" ref={wrapRef}>
      {supported ? (
        <canvas
          ref={canvasRef}
          className="canvas-scene__canvas"
          style={{ height }}
          role="img"
          aria-label={label}
          data-testid={testId}
          data-teacher-layer={teacherLayer}
        />
      ) : (
        <p className="notice notice--warn canvas-scene__unsupported" data-testid="canvas-unsupported-notice">
          Your browser can’t show the animated view here, so the live data below
          tells you everything the animation would. All values are identical.
        </p>
      )}
      <div className="canvas-scene__alt" data-testid={testId ? `${testId}-alt` : undefined}>
        {alternative}
      </div>
    </div>
  );
}
