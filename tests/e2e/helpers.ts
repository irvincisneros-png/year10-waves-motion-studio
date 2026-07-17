/** Shared fixtures for the Stage 1 shell e2e suite. */

export interface ShellRoute {
  /** Router path (hash portion). */
  path: string;
  /** Full URL to load (hash router). */
  url: string;
  /** Expected visible h1 text. */
  heading: string;
  /** Expected document.title. */
  title: string;
  /** Primary-nav link label (all shell routes are in the nav). */
  navLabel: string;
}

export const SHELL_ROUTES: ShellRoute[] = [
  {
    path: '/',
    url: '/#/',
    heading: 'WaveMotion Studio',
    title: 'Home — WaveMotion Studio',
    navLabel: 'Home',
  },
  {
    path: '/glossary',
    url: '/#/glossary',
    heading: 'Glossary',
    title: 'Glossary — WaveMotion Studio',
    navLabel: 'Glossary',
  },
  {
    path: '/progress',
    url: '/#/progress',
    heading: 'Progress',
    title: 'Progress — WaveMotion Studio',
    navLabel: 'Progress',
  },
  {
    path: '/teacher',
    url: '/#/teacher',
    heading: 'Teacher tools',
    title: 'Teacher tools — WaveMotion Studio',
    navLabel: 'Teacher',
  },
  {
    path: '/about',
    url: '/#/about',
    heading: 'About',
    title: 'About — WaveMotion Studio',
    navLabel: 'About',
  },
];

/**
 * Key that moves focus to the next focusable element INCLUDING links.
 * WebKit (Safari) skips links on plain Tab; Option+Tab visits everything.
 */
export function tabKey(browserName: string): string {
  return browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
}
