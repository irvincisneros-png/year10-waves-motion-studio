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
    path: "/",
    url: "/#/",
    heading: "Choose a science simulator",
    title: "Simulators — WaveMotion Studio",
    navLabel: "All simulators",
  },
  {
    path: "/glossary",
    url: "/#/glossary",
    heading: "Glossary",
    title: "Glossary — WaveMotion Studio",
    navLabel: "Glossary",
  },
  {
    path: "/progress",
    url: "/#/progress",
    heading: "Progress",
    title: "Progress — WaveMotion Studio",
    navLabel: "Progress",
  },
  {
    path: "/teacher",
    url: "/#/teacher",
    heading: "Teacher tools",
    title: "Teacher tools — WaveMotion Studio",
    navLabel: "Teacher",
  },
  {
    path: "/about",
    url: "/#/about",
    heading: "About",
    title: "About — WaveMotion Studio",
    navLabel: "About",
  },
];

/** Corrected-direction outcome simulator routes. */
export const OUTCOME_ROUTES: ShellRoute[] = [
  {
    path: "/simulators/7.1.1",
    url: "/#/simulators/7.1.1",
    heading: "7.1.1 Medium or vacuum?",
    title: "7.1.1 Transmission Lab — WaveMotion Studio",
    navLabel: "All simulators",
  },
  {
    path: "/simulators/7.1.2",
    url: "/#/simulators/7.1.2",
    heading: "7.1.2 Energy Relay",
    title: "7.1.2 Energy Relay — WaveMotion Studio",
    navLabel: "All simulators",
  },
  {
    path: "/simulators/7.1.3",
    url: "/#/simulators/7.1.3",
    heading: "7.1.3 Twin Wave Observatory",
    title: "7.1.3 Twin Wave Observatory — WaveMotion Studio",
    navLabel: "All simulators",
  },
];

/**
 * Stage 2 wave-foundations workspace routes (nested under /waves). All are in
 * the "Waves" primary-nav section; navLabel is therefore constant.
 */
export const WAVES_ROUTES: ShellRoute[] = [
  {
    path: "/waves",
    url: "/#/waves",
    heading: "Wave foundations",
    title: "Wave foundations — WaveMotion Studio",
    navLabel: "Waves",
  },
  {
    path: "/waves/medium",
    url: "/#/waves/medium",
    heading: "Medium or vacuum?",
    title: "Medium or vacuum? — WaveMotion Studio",
    navLabel: "Waves",
  },
  {
    path: "/waves/energy",
    url: "/#/waves/energy",
    heading: "Energy transfer",
    title: "Energy transfer — WaveMotion Studio",
    navLabel: "Waves",
  },
  {
    path: "/waves/types",
    url: "/#/waves/types",
    heading: "Wave types",
    title: "Wave types — WaveMotion Studio",
    navLabel: "Waves",
  },
  {
    path: "/waves/measure",
    url: "/#/waves/measure",
    heading: "Measurement lab",
    title: "Measurement lab — WaveMotion Studio",
    navLabel: "Waves",
  },
  {
    path: "/waves/check",
    url: "/#/waves/check",
    heading: "Check questions",
    title: "Check questions — WaveMotion Studio",
    navLabel: "Waves",
  },
  {
    path: "/waves/explain",
    url: "/#/waves/explain",
    heading: "Explain",
    title: "Explain — WaveMotion Studio",
    navLabel: "Waves",
  },
  {
    path: "/waves/connect",
    url: "/#/waves/connect",
    heading: "Waves in the real world",
    title: "Waves in the real world — WaveMotion Studio",
    navLabel: "Waves",
  },
];

/** Stage 3 sound-laboratory routes (nested under /sound). */
export const SOUND_ROUTES: ShellRoute[] = [
  {
    path: "/sound",
    url: "/#/sound",
    heading: "Sound laboratory",
    title: "Sound laboratory — WaveMotion Studio",
    navLabel: "Sound",
  },
  {
    path: "/sound/compression",
    url: "/#/sound/compression",
    heading: "Compression & rarefaction",
    title: "Compression & rarefaction — WaveMotion Studio",
    navLabel: "Sound",
  },
  {
    path: "/sound/pitch-loudness",
    url: "/#/sound/pitch-loudness",
    heading: "Pitch & loudness",
    title: "Pitch & loudness — WaveMotion Studio",
    navLabel: "Sound",
  },
  {
    path: "/sound/doppler",
    url: "/#/sound/doppler",
    heading: "Doppler effect",
    title: "Doppler effect — WaveMotion Studio",
    navLabel: "Sound",
  },
  {
    path: "/sound/check",
    url: "/#/sound/check",
    heading: "Check questions",
    title: "Check questions — WaveMotion Studio",
    navLabel: "Sound",
  },
  {
    path: "/sound/explain",
    url: "/#/sound/explain",
    heading: "Explain",
    title: "Explain — WaveMotion Studio",
    navLabel: "Sound",
  },
  {
    path: "/sound/connect",
    url: "/#/sound/connect",
    heading: "Sound in the real world",
    title: "Sound in the real world — WaveMotion Studio",
    navLabel: "Sound",
  },
];

/** Stage 4 light-and-vision group routes. */
export const LIGHT_ROUTES: ShellRoute[] = [
  {
    path: "/light",
    url: "/#/light",
    heading: "Light & vision laboratory",
    title: "Light & vision laboratory — WaveMotion Studio",
    navLabel: "Light",
  },
  {
    path: "/vision",
    url: "/#/vision",
    heading: "How the eye responds to light",
    title: "How the eye responds to light — WaveMotion Studio",
    navLabel: "Vision",
  },
  {
    path: "/light/properties",
    url: "/#/light/properties",
    heading: "Investigate light properties",
    title: "Investigate light properties — WaveMotion Studio",
    navLabel: "Light",
  },
  {
    path: "/light/applications",
    url: "/#/light/applications",
    heading: "Everyday applications of light",
    title: "Everyday applications of light — WaveMotion Studio",
    navLabel: "Light",
  },
  {
    path: "/light/check",
    url: "/#/light/check",
    heading: "Check light & vision",
    title: "Check light & vision — WaveMotion Studio",
    navLabel: "Light",
  },
  {
    path: "/light/explain",
    url: "/#/light/explain",
    heading: "Explain refraction with evidence",
    title: "Explain refraction with evidence — WaveMotion Studio",
    navLabel: "Light",
  },
  {
    path: "/light/connect",
    url: "/#/light/connect",
    heading: "Light in the real world",
    title: "Light in the real world — WaveMotion Studio",
    navLabel: "Light",
  },
];

/** Stage 5 motion and forces group routes. */
export const MOTION_ROUTES: ShellRoute[] = [
  {
    path: "/motion",
    url: "/#/motion",
    heading: "Describing motion",
    title: "Describing motion — WaveMotion Studio",
    navLabel: "Motion",
  },
  {
    path: "/motion/track",
    url: "/#/motion/track",
    heading: "Explore a signed motion track",
    title: "Explore a signed motion track — WaveMotion Studio",
    navLabel: "Motion",
  },
  {
    path: "/motion/diagrams",
    url: "/#/motion/diagrams",
    heading: "Construct equal-time motion diagrams",
    title: "Construct equal-time motion diagrams — WaveMotion Studio",
    navLabel: "Motion",
  },
  {
    path: "/motion/graphs",
    url: "/#/motion/graphs",
    heading: "Investigate motion with data and graphs",
    title: "Investigate motion with data and graphs — WaveMotion Studio",
    navLabel: "Motion",
  },
  {
    path: "/motion/check",
    url: "/#/motion/check",
    heading: "Check motion",
    title: "Check motion — WaveMotion Studio",
    navLabel: "Motion",
  },
  {
    path: "/motion/explain",
    url: "/#/motion/explain",
    heading: "Explain motion from evidence",
    title: "Explain motion from evidence — WaveMotion Studio",
    navLabel: "Motion",
  },
  {
    path: "/motion/connect",
    url: "/#/motion/connect",
    heading: "Motion beyond the track",
    title: "Motion beyond the track — WaveMotion Studio",
    navLabel: "Motion",
  },
];

export const FORCE_ROUTES: ShellRoute[] = [
  {
    path: "/forces",
    url: "/#/forces",
    heading: "Forces & Newton’s laws",
    title: "Forces & Newton’s laws — WaveMotion Studio",
    navLabel: "Forces",
  },
  {
    path: "/forces/vectors",
    url: "/#/forces/vectors",
    heading: "Build a one-object force diagram",
    title: "Build a one-object force diagram — WaveMotion Studio",
    navLabel: "Forces",
  },
  {
    path: "/forces/cart",
    url: "/#/forces/cart",
    heading: "Investigate force, mass and acceleration",
    title: "Investigate force, mass and acceleration — WaveMotion Studio",
    navLabel: "Forces",
  },
  {
    path: "/forces/applications",
    url: "/#/forces/applications",
    heading: "Apply Newton’s laws",
    title: "Apply Newton’s laws — WaveMotion Studio",
    navLabel: "Forces",
  },
  {
    path: "/forces/calculations",
    url: "/#/forces/calculations",
    heading: "Calculate motion and force relationships",
    title: "Calculate motion and force relationships — WaveMotion Studio",
    navLabel: "Forces",
  },
  {
    path: "/forces/check",
    url: "/#/forces/check",
    heading: "Check forces",
    title: "Check forces — WaveMotion Studio",
    navLabel: "Forces",
  },
  {
    path: "/forces/explain",
    url: "/#/forces/explain",
    heading: "Explain force and acceleration from evidence",
    title: "Explain force and acceleration from evidence — WaveMotion Studio",
    navLabel: "Forces",
  },
  {
    path: "/forces/connect",
    url: "/#/forces/connect",
    heading: "Forces beyond the cart",
    title: "Forces beyond the cart — WaveMotion Studio",
    navLabel: "Forces",
  },
];

/** Stage 6 cross-cutting completion routes. */
export const COMPLETION_ROUTES: ShellRoute[] = [
  { path: "/spectrum", url: "/#/spectrum", heading: "Electromagnetic spectrum", title: "Electromagnetic spectrum — WaveMotion Studio", navLabel: "Spectrum" },
  { path: "/hearing", url: "/#/hearing", heading: "How the ear responds to sound", title: "How the ear responds to sound — WaveMotion Studio", navLabel: "Hearing" },
  { path: "/ultrasound", url: "/#/ultrasound", heading: "Medical ultrasound: pulse and echo", title: "Medical ultrasound: pulse and echo — WaveMotion Studio", navLabel: "Ultrasound" },
  { path: "/astronomy", url: "/#/astronomy", heading: "Reading starlight", title: "Reading starlight — WaveMotion Studio", navLabel: "Astronomy" },
  { path: "/society", url: "/#/society", heading: "Waves and motion in society", title: "Waves and motion in society — WaveMotion Studio", navLabel: "Society" },
  { path: "/mastery", url: "/#/mastery", heading: "Mastery challenge", title: "Mastery challenge — WaveMotion Studio", navLabel: "Mastery" },
];

/**
 * Key that moves focus to the next focusable element INCLUDING links.
 * WebKit (Safari) skips links on plain Tab; Option+Tab visits everything.
 */
export function tabKey(browserName: string): string {
  return browserName === "webkit" ? "Alt+Tab" : "Tab";
}
