import { useEffect, type RefObject } from 'react';
import { useAnnouncer } from '../accessibility/LiveRegion';

const APP_NAME = 'WaveMotion Studio';

// Module-level flag: on the very first render (cold load) we leave focus at
// the top of the document so the skip link is the first Tab stop. Every
// subsequent route change moves focus to the main heading and announces the
// new page politely.
let hasRenderedOnce = false;

/** Reset the first-render flag (test helper). */
export function resetPageChromeForTests() {
  hasRenderedOnce = false;
}

/**
 * Route-level page chrome: sets the document title, and on client-side route
 * changes moves focus to the route's main heading and announces the change.
 */
export function usePageChrome(
  pageTitle: string,
  headingRef: RefObject<HTMLHeadingElement | null>,
) {
  const { announce } = useAnnouncer();

  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} — ${APP_NAME}` : APP_NAME;
    if (hasRenderedOnce) {
      headingRef.current?.focus({ preventScroll: false });
      announce(`${pageTitle || 'Home'} page loaded`);
    }
    hasRenderedOnce = true;
    // announce/headingRef are stable; retrigger only on title (route) change.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [pageTitle]);
}
