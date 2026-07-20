import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CanvasScene } from '../../src/components/sim/CanvasScene';
import { useSimClock } from '../../src/components/sim/useSimClock';

interface ClockProbeProps {
  active?: boolean;
  reducedMotion?: boolean;
  running?: boolean;
}

function ClockProbe({
  active = true,
  reducedMotion = false,
  running = true,
}: ClockProbeProps) {
  const clock = useSimClock({
    active,
    reducedMotion,
    running,
    speed: 1,
  });
  return <output>{clock.isAnimating ? 'animating' : 'paused'}</output>;
}

describe('simulation animation and rendering lifecycle', () => {
  let nextFrameId: number;
  let frameCallbacks: Map<number, FrameRequestCallback>;
  let originalHidden: PropertyDescriptor | undefined;

  beforeEach(() => {
    nextFrameId = 1;
    frameCallbacks = new Map();
    originalHidden = Object.getOwnPropertyDescriptor(document, 'hidden');
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        const id = nextFrameId++;
        frameCallbacks.set(id, callback);
        return id;
      }),
    );
    vi.stubGlobal(
      'cancelAnimationFrame',
      vi.fn((id: number) => frameCallbacks.delete(id)),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (originalHidden) {
      Object.defineProperty(document, 'hidden', originalHidden);
    }
  });

  it('schedules frames only while running, active, motion-enabled and visible', () => {
    const view = render(<ClockProbe />);
    expect(screen.getByText('animating')).toBeInTheDocument();
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

    act(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(screen.getByText('paused')).toBeInTheDocument();
    expect(cancelAnimationFrame).toHaveBeenCalledTimes(1);
    expect(frameCallbacks.size).toBe(0);

    act(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        value: false,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(screen.getByText('animating')).toBeInTheDocument();
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);

    view.unmount();
    expect(cancelAnimationFrame).toHaveBeenCalledTimes(2);
    expect(frameCallbacks.size).toBe(0);
  });

  it('does not schedule autoplay for reduced-motion, paused or static scenes', () => {
    const reduced = render(<ClockProbe reducedMotion />);
    expect(screen.getByText('paused')).toBeInTheDocument();
    reduced.unmount();

    const paused = render(<ClockProbe running={false} />);
    expect(screen.getByText('paused')).toBeInTheDocument();
    paused.unmount();

    const inactive = render(<ClockProbe active={false} />);
    expect(screen.getByText('paused')).toBeInTheDocument();
    inactive.unmount();

    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(cancelAnimationFrame).not.toHaveBeenCalled();
  });

  it('balances visibility listeners and animation frames over repeated mounts', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    for (let index = 0; index < 20; index += 1) {
      const view = render(<ClockProbe />);
      view.unmount();
    }

    const visibilityAdds = addSpy.mock.calls.filter(
      ([eventName]) => eventName === 'visibilitychange',
    );
    const visibilityRemoves = removeSpy.mock.calls.filter(
      ([eventName]) => eventName === 'visibilitychange',
    );
    expect(visibilityAdds).toHaveLength(20);
    expect(visibilityRemoves).toHaveLength(20);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(20);
    expect(cancelAnimationFrame).toHaveBeenCalledTimes(20);
    expect(frameCallbacks.size).toBe(0);
  });

  it('disconnects its ResizeObserver when a Canvas scene unmounts', () => {
    const observers: ResizeObserverMock[] = [];

    class ResizeObserverMock {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();

      constructor(_callback: ResizeObserverCallback) {
        observers.push(this);
      }
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(),
      restore: vi.fn(),
      save: vi.fn(),
      setTransform: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    const view = render(
      <CanvasScene
        alternative={<p>Equivalent values</p>}
        draw={() => undefined}
        frameKey="frame-0"
        height={200}
        label="Lifecycle test scene"
      />,
    );

    expect(observers).toHaveLength(1);
    expect(observers[0].observe).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
  });
});
