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
 * Stage 2 wave-foundations workspace routes (nested under /waves). All are in
 * the "Waves" primary-nav section; navLabel is therefore constant.
 */
export const WAVES_ROUTES: ShellRoute[] = [
  {
    path: '/waves',
    url: '/#/waves',
    heading: 'Wave foundations',
    title: 'Wave foundations — WaveMotion Studio',
    navLabel: 'Waves',
  },
  {
    path: '/waves/medium',
    url: '/#/waves/medium',
    heading: 'Medium or vacuum?',
    title: 'Medium or vacuum? — WaveMotion Studio',
    navLabel: 'Waves',
  },
  {
    path: '/waves/energy',
    url: '/#/waves/energy',
    heading: 'Energy transfer',
    title: 'Energy transfer — WaveMotion Studio',
    navLabel: 'Waves',
  },
  {
    path: '/waves/types',
    url: '/#/waves/types',
    heading: 'Wave types',
    title: 'Wave types — WaveMotion Studio',
    navLabel: 'Waves',
  },
  {
    path: '/waves/measure',
    url: '/#/waves/measure',
    heading: 'Measurement lab',
    title: 'Measurement lab — WaveMotion Studio',
    navLabel: 'Waves',
  },
  {
    path: '/waves/check',
    url: '/#/waves/check',
    heading: 'Check questions',
    title: 'Check questions — WaveMotion Studio',
    navLabel: 'Waves',
  },
  {
    path: '/waves/explain',
    url: '/#/waves/explain',
    heading: 'Explain',
    title: 'Explain — WaveMotion Studio',
    navLabel: 'Waves',
  },
  {
    path: '/waves/connect',
    url: '/#/waves/connect',
    heading: 'Waves in the real world',
    title: 'Waves in the real world — WaveMotion Studio',
    navLabel: 'Waves',
  },
];

/**
 * Key that moves focus to the next focusable element INCLUDING links.
 * WebKit (Safari) skips links on plain Tab; Option+Tab visits everything.
 */
export function tabKey(browserName: string): string {
  return browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
}
