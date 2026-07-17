# WaveMotion Studio

An offline-capable, browser-based learning application for the NSW Year 10
**Waves & Motion** topic (outcomes 7.1.1–7.5.1). Built for NSW classrooms:
teacher demonstration, guided learning, free exploration, virtual investigation,
data collection, graphing, calculation, assessment, and revision.

Part of the NSW Junior Science Simulator suite — see
`../SCIENCE_SIMULATOR_SUITE_SHARED_SPEC.md` (platform contract) and
`../YEAR_10_WAVES_MOTION_APP_PLAN.md` (scientific content contract).

## Status

In staged rebuild — see `IMPLEMENTATION_STATUS.md` for honest per-outcome status and
`docs/plans/2026-07-17-wavemotion-orchestration-plan.md` for the delivery plan.
Pre-existing prototype code is being replaced stage by stage
(`docs/AUDIT_2026-07-17.md`).

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

No login, no student names, no analytics, no network calls after first load.
Optional progress lives in versioned local storage on the device only, with
export/import/reset under user control. Audio is off by default and
volume-limited when enabled.

## Language

Australian English throughout.
