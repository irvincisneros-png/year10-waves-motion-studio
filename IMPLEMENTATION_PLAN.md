# WaveMotion Studio — Implementation Plan

Companion documents: `docs/plans/2026-07-17-wavemotion-orchestration-plan.md` (delivery/orchestration),
`SCIENCE_REVIEW.md` (scientific contracts), `CONTROL_INVENTORY.md`, `TEST_PLAN.md`,
`COVERAGE.md`, `docs/plans/stage-gates.md`.

## 1. Technology stack and reasons

| Choice | Reason |
|---|---|
| TypeScript strict | Shared-spec requirement; engine correctness |
| React 19 + Vite 8 | Shared-spec recommended stack; already scaffolded and working |
| react-router-dom 7 (**HashRouter** — decided Stage 1) | Deep links + refresh behaviour required by Stage 1 gate. Hash URLs (`/#/glossary`) load, refresh and deep-link correctly on any static host with zero SPA-fallback server configuration — the deployment target is plain school-friendly static hosting |
| Zustand 5 | Small, testable state; store-per-domain |
| SVG for diagrams, Canvas 2D for continuous simulations | Exact teaching diagrams must be data-driven; Canvas for 60 fps particle fields |
| No Three.js at launch | No Year 10 Waves & Motion module *requires* 3D; avoids WebGL fallback burden. Revisit post-release |
| Web Audio API (opt-in) | Pitch/loudness and Doppler audio; strictly user-initiated, default muted |
| MathML with visual fallback | Shared-spec equation requirement |
| Vitest + Playwright (+ @axe-core/playwright) | Unit/invariant + browser/a11y gates |
| vite-plugin-pwa | Offline shell; versioned service worker with update UI |

No runtime CDNs. Dependencies pinned via package-lock.json.

## 2. Modular source structure

```
src/
  app/            # app root, router, error boundaries, providers
  routes/         # one file per global route (thin; compose from modules)
  components/     # shared UI: shell, nav, panels, controls, graphs, tables
  simulations/    # per-workspace interactive modules (React; render only)
    wave-foundations/  sound/  optics/  vision-astronomy/  motion/  forces/  society/
  science/        # PURE TypeScript engines — no React imports, fully unit-tested
    waves.ts  soundDoppler.ts  optics.ts  kinematics.ts  forces.ts
    units.ts  equations.ts  rng.ts (seeded)  constants.ts
  content/        # outcomes.ts, mediumPresets, emRegions, opticalMedia, spectra,
                  # forceCases, evidencePacks, glossary — all typed, schema-tested
  assessment/     # question bank, answer validation, feedback, misconception tags
  investigations/ # investigation framework: variables, trials, tables, export
  teacher/        # presentation mode, deep-link presets, coverage view, print sheets
  accessibility/  # focus manager, live regions, reduced-motion hook, sim-to-table adapters
  store/          # zustand stores: progress, settings, evidence
  styles/         # design tokens (CSS custom properties), global styles
tests/
  unit/           # Vitest: engines, units, equations, content schemas, validation
  e2e/            # Playwright: routes, controls, keyboard, responsive, a11y, offline
public/
docs/
```

**Hard boundary:** `science/` and `content/` never import from React or `simulations/`.
Simulation components read engine state and render it; a low-graphics mode changes
rendering only, never results.

## 3. Route structure (release navigation shows only built routes)

| Route | Content | Stage |
|---|---|---|
| `/` | Home / learning map | 1 |
| `/waves` + `/waves/:activity` | Wave foundations workspace (vertical slice) | 2 |
| `/sound`, `/sound/:activity` | Sound laboratory | 3 |
| `/light`, `/light/:activity` | Light & optics | 4 |
| `/vision`, `/astronomy` | Eye + starlight | 4/6 |
| `/motion`, `/motion/:activity` | Describing motion | 5 |
| `/forces`, `/forces/:activity` | Forces & Newton's laws | 5 |
| `/spectrum` | EM spectrum explorer | 6 |
| `/hearing`, `/ultrasound` | Ear + ultrasound labs | 6 |
| `/society` | Argument studio | 6 |
| `/mastery` | Mastery challenge | 6 |
| `/glossary`, `/progress`, `/teacher`, `/about` | Shared routes | 1 (shell) / 6 (full) |

Deferred routes are absent from navigation and return the "not in this release" page
only via direct URL, listing what is available instead — never an "under construction" tease.

## 4. State and persistence design

- `settingsStore`: audio enabled, reduced motion (default from `prefers-reduced-motion`),
  low graphics, presentation mode. Persisted.
- `progressStore`: per-outcome evidence points (`not attempted` / `developing` / `secure`),
  check-question history, investigation artefacts. Persisted, versioned
  (`wavemotion.v1` key; migration table on version bump), export/import as JSON with
  sanitisation + size cap, reset-module and reset-all with confirmation.
- `evidenceStore`: current investigation trials/tables/graph configs; exportable CSV/JSON.
- Simulation state itself is ephemeral React/engine state — never persisted mid-animation.

## 5. Science-engine boundaries and contracts

Engines are pure functions/classes: `(params, t) → state` or stepped
`advance(state, dt) → state`. Deterministic; optional noise via injected seeded RNG
(`rng.ts`, mulberry32). All units SI internally; conversion only at the UI boundary via
`units.ts`. Equations module owns `v = fλ` (+ rearrangements), `F = ma`,
`v_av = Δs/Δt`, `a = Δv/Δt` with validation and tolerance rules from SCIENCE_REVIEW.md.
Graph contracts: every graph component takes typed series `{t|x, value, unit}[]` produced
by engines, never computes physics itself.

## 6. Rendering responsibilities and fallbacks

- **SVG:** ray diagrams, spectra, graphs, motion diagrams, force vectors, ear/eye diagrams.
- **Canvas 2D:** particle fields, wavefronts, continuous animation. Every Canvas scene has
  an adjacent accessible alternative (data table / text description, live-updated at a
  throttled rate) and a `canvas-unsupported` branch rendering the alternative alone.
- **Web Audio:** created only on "Enable sound" click; gain capped; default muted;
  denial/absence falls back to visual-only with no broken controls.
- **Storage:** persistence failures degrade to in-memory with a visible, polite notice.
- **Service worker:** unsupported → app still works online; update flow shows refresh prompt.

## 7. Accessibility architecture

Design tokens include focus ring and 44×44 px minimum targets. Shared primitives:
`SkipLink`, `VisuallyHidden`, `LiveRegion` (polite, throttled), `useReducedMotion`,
`SimControls` (keyboard-standardised slider/stepper pattern: arrows = fine step,
PageUp/Down = coarse, Home/End = bounds, with units announced). Route-level focus
management on navigation. No colour-only meaning: correctness shown with icon + text.
Every workspace keyboard-operable end to end (tested per CONTROL_INVENTORY.md).

## 8. Offline strategy

vite-plugin-pwa, `registerType: 'prompt'` with visible update UI; precache app shell +
route chunks + content JSON; explicit `VERSION` surfaced in About. First load online,
everything after offline-capable. No external requests at runtime (CSP verifies).

## 9. Asset and provenance strategy

SVG-first art direction at launch (no raster generation available in this environment;
also required for all scientific diagrams anyway). Decorative SVG headers follow the
suite design language (electric cyan + spectral violet on deep navy). `ASSET_MANIFEST.md`
records every non-trivial asset: id, purpose, route, source (hand-authored SVG),
decorative/informative, alt decision, review status. Generated raster heroes are a
deferred post-release enhancement under the shared-spec image rules.

## 10. Build and deployment

`npm run build` → `dist/` static bundle for any HTTPS static host (school-friendly:
GitHub Pages or equivalent). `npm run verify` = oxlint + `tsc -b` + Vitest + Playwright
is the merge gate for every stage. Git tags `stage-N` at each gate pass.

## 11. Stage-by-stage order

Per Part C of the orchestration plan: S0 contracts → S1 shell/foundations →
S2 wave-lab vertical slice → S3 sound → S4 light/vision → S5 motion/forces →
S6 spectrum/hearing/ultrasound/astronomy/society/mastery/teacher/progress/offline-hardening →
S7 independent audit. Each stage: engine+tests first, UI second, content/assessment third,
then gate + regression + tag.

## 12. Dependencies and risks

| Risk | Mitigation |
|---|---|
| Outcome numbering mismatch between app plan and syllabus docx | Canonical `outcomes.ts` extraction with flagged mismatches (Stage 0) |
| Cultural module 7.2.5 sources unavailable | Deferred with explicit COVERAGE.md record; never generated |
| Prototype code quality misleading later builders | Audit doc + "prototype — not verified" status; builders instructed to replace, not trust |
| Web Audio autoplay policies / school-device lockdown | Opt-in design; visual equivalents mandatory |
| External SSD unmounted breaks dev sessions | Check mount before work (workspace convention) |
| Safari differences (service worker, MathML) | Playwright WebKit project + manual Safari pass at audit |
| Disk space on build machine (~13 GB free) | Only Chromium + WebKit Playwright browsers; no video recording by default |
