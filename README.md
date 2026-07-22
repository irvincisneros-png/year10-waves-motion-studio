# WaveMotion Studio

An offline-capable, browser-based learning application for the NSW Year 10
**Waves & Motion** topic (outcomes 7.1.1–7.5.1). Built for NSW classrooms:
teacher demonstration, guided learning, free exploration, virtual investigation,
data collection, graphing, calculation, assessment, and revision.

Part of the NSW Junior Science Simulator suite — see
`../SCIENCE_SIMULATOR_SUITE_SHARED_SPEC.md` (platform contract) and
`../YEAR_10_WAVES_MOTION_APP_PLAN.md` (scientific content contract).

## Live classroom site

[Open WaveMotion Studio](https://irvincisneros-png.github.io/year10-waves-motion-studio/)

The outcome-first release currently includes four canonical simulators:

- [7.1.1 Transmission Lab](https://irvincisneros-png.github.io/year10-waves-motion-studio/#/simulators/7.1.1)
- [7.1.2 Energy Relay](https://irvincisneros-png.github.io/year10-waves-motion-studio/#/simulators/7.1.2)
- [7.1.3 Twin Wave Observatory](https://irvincisneros-png.github.io/year10-waves-motion-studio/#/simulators/7.1.3)
- [7.1.4 Spectrum Tuner](https://irvincisneros-png.github.io/year10-waves-motion-studio/#/simulators/7.1.4)

## Status

Stages 0–6 are builder-complete. The release includes 24 active syllabus
outcomes, six completion routes, a 101-question mastery bank, evidence-derived
local progress, teacher tools and whole-app offline support. Outcome 7.2.5 is
explicitly deferred until attributable, community-approved sources are supplied;
it has no route, navigation item, card or mastery question. Stage 7 is the
fresh-context release audit. See `IMPLEMENTATION_STATUS.md`, `COVERAGE.md` and
the evidence packs under `docs/evidence/`.

The complete 2026-07-22 release gate passed 254 unit/invariant checks and 761
browser checks across Chromium and WebKit, with three expected WebKit capability
skips. GitHub Actions builds the site for its repository subpath and deploys the
verified static artifact to GitHub Pages on each push to `main`.

## Stack

- TypeScript (strict) · React 19 · Vite 8 · react-router-dom 7 · Zustand 5
- Vitest (unit/invariant tests) · Playwright (browser tests) · oxlint
- vite-plugin-pwa (offline shell) — no runtime CDNs, all assets bundled locally

## Scripts

```bash
npm install            # once
npm run dev            # dev server (test via HTTP, not file://)
npm run build          # type-check + production build to dist/
npm run preview        # serve the production build locally
npm run test           # unit tests (Vitest)
npm run lint           # oxlint
npm run verify         # lint + typecheck + unit tests + Playwright (full gate)
```

## Routing

Hash-based routing (react-router-dom `HashRouter`): all routes live behind
`/#/…` (for example `/#/glossary`). Cold loads, refreshes and deep links work
on any static host without SPA-fallback configuration, which suits the plain
static hosting this app targets. Playwright's e2e server runs on port **4611**
(not vite's default 4173) so it never latches onto another project's preview
server on this machine.

## Supported browsers

Current Chrome, Edge, and Safari on laptop and tablet. Responsive from 320 px
(phone) to 1440 px. WCAG 2.2 AA target: full keyboard operation, reduced-motion
support, non-visual alternatives for Canvas/audio content.

## Privacy model

No login, no student names, and no analytics or tracking. The app makes no
automatic external runtime requests; source links open only when the user
chooses them. Optional progress lives in versioned local storage on the device
only, with export/import/reset under user control. Audio is off by default and
volume-limited when enabled.

## Language

Australian English throughout.
