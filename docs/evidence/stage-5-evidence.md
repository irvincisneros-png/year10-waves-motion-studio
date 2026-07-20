# Stage 5 evidence pack — Motion and force module group

Builder gate run: 2026-07-20 (Australia/Sydney)

Build branch: `stage-5-wip`, based on merged Stage 4 main commit `81f2f18`

Gate contract: `docs/plans/stage-gates.md`, “Stages 3–5”

Builder status: **verified (builder)** — awaiting independent review

## Scope closed at this gate

- 7.4.1 — `/motion/track`: signed 1D position, changeable origin, distance,
  displacement, speed and average velocity with exact discrete stepping and
  explicit reversal handling.
- 7.4.2 — `/motion/diagrams`: 2–8-dot motion diagrams with selectable time
  interval, evidence table, spacing-pattern interpretation and targeted
  reversal feedback.
- 7.4.3 — `/motion/graphs`: linked position–time and velocity–time evidence,
  exact slope/area summaries, controlled investigation, unit-labelled graph,
  CSV/JSON/print evidence and graph-as-path misconception feedback.
- 7.4.4 — `/forces/cart`: F–m–a cart investigation with applied force, mass,
  capped friction, ideal and deterministic measured acceleration, two fair-test
  sweeps, tables, graphs, exports and complete investigation evidence.
- 7.4.5 — `/forces/applications`: six Newton-law contexts, third-law
  force-pairs on distinct objects and one reviewed numeric walking fixture.
- 7.4.6 — `/forces/vectors`: an up-to-six-force 1D builder with physical arrow
  direction, selectable coordinate convention, exact signed sum and text table.
- 7.4.7 — `/forces/calculations`: guarded, unit-aware F=ma rearrangements plus
  average motion, position–time slope and velocity–time area calculations.
- Complete learning rhythms: `/motion` + track/diagrams/graphs/check/explain/
  connect and `/forces` + vectors/cart/applications/calculations/check/explain/
  connect.

Intentionally outside this gate: astronomy and the remaining cross-cutting
completion work stay in Stage 6. `/astronomy` remains absent from navigation and
resolves to the real not-found route.

## Exact verification result

Final builder gate command: `npm run verify` — exit 0.

| Gate command | Result |
|---|---|
| oxlint | pass, 0 errors; 4 unchanged pre-existing warnings in `ErrorBoundary.tsx`, `WaveAnatomyDiagram.tsx`, `RulerTool.tsx` and `LiveRegion.tsx` |
| TypeScript project build | clean |
| Vitest | 17 files, 187 tests passed |
| Playwright | 482 tests: 481 passed, 1 expected skip; Chromium + WebKit; 5.8 min in the final gate run |

The one skip is the established WebKit exclusion for the Chromium-only offline
service-worker simulation. The production build contains 687,555 bytes (0.66
MiB) excluding macOS AppleDouble sidecars; counted assets total 650,874 bytes,
including the 614,347-byte main JavaScript chunk and 30,874-byte stylesheet.
Vite's chunk-size message is a non-failing advisory recorded for Stage 6
hardening, not a runtime or Stage 5 gate error.

## Module-group gate checklist

- [x] **Engine + invariant tests before UI integration.** Pure engines are
  `src/science/motion.ts`, `forces.ts` and the expanded `equations.ts`. The
  deterministic unit suite includes 64-case sweeps for signed motion, exact
  distance/displacement histories, reversal distance, diagram patterns, vector
  sums, capped friction, F=ma, seeded noise and all equation rearrangements.
- [x] **Every new control inventoried and Playwright-exercised.** As-built
  reconciliation is in `CONTROL_INVENTORY.md` §§8.4 and 9.4. The inventory uses
  unique control IDs, documents defaults/ranges/effects and distinguishes
  audited static readouts. `tests/e2e/motion-forces.spec.ts` plus the shared
  keyboard, responsive, accessibility, console and shell matrices exercise the
  shipped controls in Chromium and WebKit.
- [x] **Misconception feedback and false-positive regressions.** Validated
  motion/force banks reject empty or malformed input, provide progressive hints
  and distinguish distance/displacement, graph-as-path, force/motion, balanced
  forces and third-law misconceptions. Incomplete CER fields are named before
  evidence can save.
- [x] **Keyboard, reduced motion, alternatives and fallbacks.** Controls are
  native keyboard-operable elements with 44 px targets at 320 px. Stage 5 has
  no autoplay, Canvas or audio dependency; exact Step controls and static SVG,
  numeric and table representations provide the reduced-motion and degraded-
  capability path without changing science state.
- [x] **Stage-specific science invariants.** Signed displacement equals final
  minus initial position while distance accumulates absolute travel; average
  velocity uses displacement/time; diagram interval relabels without moving
  existing dots; vector sums preserve forces when the coordinate sign flips;
  friction is capped at the applied force; ideal cart acceleration is always
  visible and measurement noise is reproducible by seed.
- [x] **Full regression and clean runtime.** Stages 1–4 remain green. Every new
  route has cold-load/refresh coverage, zero axe violations, zero page console
  errors/warnings or unhandled rejections and no external network requests.
- [x] **Coverage/status records updated in the same stage.** `COVERAGE.md`,
  `IMPLEMENTATION_STATUS.md`, `CONTROL_INVENTORY.md`, `SCIENCE_REVIEW.md` and
  `TEST_PLAN.md` describe the as-built Stage 5 behaviour and limits.

## Responsive and accessibility evidence

- Automated responsive checks cover exactly 320, 375, 768, 1024 and 1440 px;
  no page uses horizontal-overflow masking. Wide evidence tables are contained
  in labelled, keyboard-focusable local scroll regions.
- Automated axe checks report zero violations on all 15 Stage 5 routes in both
  engines. Shared skip-link, focus visibility, 200% zoom and keyboard-only
  paths remain green.
- All sampled Stage 5 buttons, sliders and selectors meet the 44 px target at
  320 px. Sign, direction, correct/incorrect state and graph meaning are never
  communicated by colour alone.
- Visual QA at 1440 px and 320 px confirmed readable hierarchy, contained
  tables and no horizontal page overflow before the final automated gate.

## Science constants and honest limitations

- The track is a bounded teaching model from −20 m to +20 m; the selectable
  origin is −10 m to +10 m. Each Move/Step is exactly 1 s and the default speed
  is +2 m/s, capped to ±10 m/s.
- Motion diagrams contain 2–8 dots. Selectable intervals are 0.1, 0.2, 0.5 and
  1 s; changing interval changes timing labels, not already recorded positions.
  Pattern classification tolerances are explicit in `SCIENCE_REVIEW.md`.
- The cart uses applied force 0–20 N, mass 0.1–10 kg and a maximum 0.5 N
  opposing friction force that cannot reverse a stationary cart. Noise uses
  reviewed seed 4471 and a uniform envelope of ±max(0.02 m/s², 3%). Ideal
  acceleration remains separately visible.
- `g = 9.8 m/s²` is the documented school-level constant. Context forces are
  qualitative except for the reviewed 400 N walking pair; the UI does not
  fabricate force magnitudes for scenarios lacking supplied data.
- The models are one-dimensional, ignore air resistance and deformation, and
  do not claim laboratory-instrument precision or full rigid-body dynamics.

## As-built corrections and declared divergences

- Retired the archived kinematics/Newton prototypes from status claims and
  replaced them with tested pure engines and new route-local implementations.
- Separated position from the chosen origin from displacement since the run
  began, preventing the common but incorrect assumption that changing origin
  changes displacement.
- Made diagram timing a relabelling operation rather than silently rescaling
  recorded spatial evidence.
- Kept physical force arrows fixed when the chosen positive direction changes;
  only coordinate signs and signed sum change.
- Added explicit ideal-versus-measured acceleration so deterministic noise can
  teach measurement scatter without hiding F=ma.
- Reconciled older shared regression assumptions for primary-nav tab count,
  home availability counts and visible feedback versus the global live region.
  The oversized-import WebKit stress path now has an explicit 60 s test budget;
  the product continues to reject the file immediately under ordinary load.

## Changed implementation areas

- Science and assessment: `src/science/motion.ts`, `forces.ts`, `equations.ts`,
  constants/units additions and `src/assessment/motionForcesQuestions.ts`.
- UI: `src/simulations/motion-forces/`, Stage 5 routes/navigation, home cards,
  glossary content, evidence capture and shared styling.
- Verification: motion/force invariant and equation suites,
  `tests/e2e/motion-forces.spec.ts`, and expanded accessibility, console,
  keyboard, responsive, settings and shell contracts.
- Records: this pack, `COVERAGE.md`, `IMPLEMENTATION_STATUS.md`,
  `CONTROL_INVENTORY.md`, `SCIENCE_REVIEW.md` and `TEST_PLAN.md`.

No tag was created and nothing was pushed. Independent review should re-run
`npm run verify`, browser-check this pack's claims, then decide whether to tag
the Stage 5 gate and promote 7.4.1–7.4.7 from `verified (builder)` to `verified`.
