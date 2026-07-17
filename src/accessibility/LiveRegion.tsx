import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface AnnouncerContextValue {
  /** Announce a message politely to assistive technology (throttled). */
  announce: (message: string) => void;
}

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);

const THROTTLE_MS = 150;

/**
 * Provides a single polite, throttled live region for the whole app. Route
 * changes and status updates call `announce()`; rapid successive calls are
 * coalesced so screen readers are not flooded.
 */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const pendingRef = useRef<string | null>(null);
  const lastFlushRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (pendingRef.current === null) return;
    const next = pendingRef.current;
    pendingRef.current = null;
    lastFlushRef.current = Date.now();
    // Clear then set on the next frame so identical consecutive messages are
    // still re-announced.
    setMessage('');
    window.requestAnimationFrame(() => setMessage(next));
  }, []);

  const announce = useCallback(
    (text: string) => {
      pendingRef.current = text;
      const elapsed = Date.now() - lastFlushRef.current;
      if (elapsed >= THROTTLE_MS) {
        flush();
      } else if (timerRef.current === null) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          flush();
        }, THROTTLE_MS - elapsed);
      }
    },
    [flush],
  );

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  const value = useMemo(() => ({ announce }), [announce]);

  return (
    <AnnouncerContext.Provider value={value}>
      {children}
      <div
        className="u-visually-hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="live-region"
      >
        {message}
      </div>
    </AnnouncerContext.Provider>
  );
}

/** Access the polite announcer. Safe no-op if used outside the provider. */
export function useAnnouncer(): AnnouncerContextValue {
  const ctx = useContext(AnnouncerContext);
  if (!ctx) return { announce: () => {} };
  return ctx;
}
