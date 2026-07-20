# Stage 4 evidence pack — Light and vision module group

Builder gate run: 2026-07-20 (Australia/Sydney)  
Build branch: `stage-4-wip`, based on merged Stage 3 main commit `04b3526`  
Gate contract: `docs/plans/stage-gates.md`, “Stages 3–5”  
Builder status: **verified (builder)** — awaiting independent review

## Scope closed at this gate

- 7.3.1 — `/vision`: relative brightness/pupil response, object-distance/image-
  size response, accommodation/focus exploration, labelled optical and neural
  pathway, guided blind-spot text activity, non-diagnostic focusing extension
  and saved explanation.
- 7.3.2 — `/light/properties`: law of reflection, ordinary refraction, Snell
  calculation, boundary-frequency constancy, TIR/fibre disclosure, normalised
  transmission/reflection/absorption ledger, qualitative scattering regimes and
  a complete investigation record with hypothesis, trials, graph, exports,
  print, interpretation, conclusion and limitation.
- 7.3.3 — `/light/applications`: mirror/reflection context, qualitative
  converging/diverging lenses, optical-fibre TIR and five conditional
  application scenarios requiring evidence-based justification plus an
  assumption/limitation.
- Complete learning rhythm: `/light`, `/vision`, `/light/properties`,
  `/light/applications`, `/light/check`, `/light/explain` and `/light/connect`.

Intentionally outside this gate: 7.3.4 `/astronomy` remains Stage 6, is absent
from navigation and returns the real not-found route. No Stage 5 motion/force
route or outcome was started in this branch.

## Exact verification result

Final builder gate command: `npm run verify` — exit 0.

| Gate command | Result |
|---|---|
| oxlint | pass, 0 errors; 4 unchanged pre-existing warnings in `ErrorBoundary.tsx`, `WaveAnatomyDiagram.tsx`, `RulerTool.tsx` and `LiveRegion.tsx` |
| TypeScript project build | clean |
| Vitest | 15 files, 152 tests passed |
| Playwright | 368 tests: 367 passed, 1 expected skip; Chromium + WebKit; 3.7 min in the final gate run |

The one skip is the established WebKit exclusion for the Chromium-only offline
service-worker simulation. Production build content excluding 12 macOS
AppleDouble sidecars is 588,387 bytes (0.56 MiB): the main minified JavaScript
file is 519,257 bytes and the stylesheet is 26,796 bytes. Vite's chunk-size
message is a non-failing advisory, not a runtime or gate error.

## Module-group gate checklist

- [x] **Engine + invariant tests before UI integration.** Pure engines are
  `src/science/optics.ts` and `src/science/vision.ts`. Their 12 focused tests
  cover reflection equality, Snell agreement, frequency constancy, TIR/no false
  refracted ray, energy conservation for every fixture, scattering thresholds,
  qualitative mirror/lens cases, pupil monotonicity and focus behaviour.
- [x] **Every new control inventoried and Playwright-exercised.** As-built
  reconciliation is in `CONTROL_INVENTORY.md` §§6.4 and 7.1.1. The inventory
  explicitly separates state-tested static readouts from interactive controls.
  `tests/e2e/optics.spec.ts` and `vision.spec.ts` exercise controls, defaults,
  keyboard range bounds, evidence validation, deletion, reset, download, print,
  full question-bank completion and restart.
- [x] **Misconception feedback and false-positive regressions.** Eight validated
  questions cover optical versus neural stages, pupil role, reflection angles,
  speed-based refraction, TIR, energy conservation, conditional black/white
  surface claims and fibre guidance. Empty/malformed input never scores;
  progressive hints and specific misconception responses are browser-tested.
- [x] **Keyboard, reduced motion, alternatives and fallbacks.** Stage 4 uses
  native keyboard-operable controls and static SVG only—no animation, Canvas,
  audio, random state or network dependency. Every diagram is paired with
  numeric/text/table explanation, so reduced motion and missing Canvas/audio do
  not reduce the activity. Global keyboard navigation was expanded for the two
  added primary-nav items and passes both engines.
- [x] **Stage-specific science invariants.** Reflection returns θr = θi; the
  refraction engine preserves source frequency and handles 90° with an explicit
  range error; T/R/A fixtures total exactly 1; scattering and eye responses meet
  documented thresholds. UI-level worked values and boundary paths are tested.
- [x] **Full regression and clean runtime.** Stages 1–3 remain green. Shared
  console tests cover every Stage 4 route with zero page console errors/warnings
  and zero unhandled rejections.
- [x] **Coverage/status records updated in the same stage.** `COVERAGE.md`,
  `IMPLEMENTATION_STATUS.md`, `CONTROL_INVENTORY.md` and `TEST_PLAN.md` now
  describe the as-built Stage 4 behavior and use `verified (builder)`.

## Responsive and accessibility evidence

- Automated responsive checks cover exactly 320, 375, 768, 1024 and 1440 px
  across every shipped route and forbid `overflow-x: hidden` masking.
- Stage 4 initially exposed a 320 px overflow from an intrinsically wide energy
  table. The final implementation constrains the page grid and provides local
  horizontal table scrolling; the full five-breakpoint matrix is green.
- Automated axe checks report zero violations on all seven Stage 4 routes in
  Chromium and WebKit. An initial invalid `role=status` inside two description
  lists was removed before the final gate.
- Buttons/sliders sampled at 320 px meet the 44 px minimum target. Reset glyphs
  are decorative to assistive technology; correctness, focus and ray/energy
  state are never colour-only.
- Cold loads, refreshes, warm phase navigation, home cards, document titles and
  the intentionally absent astronomy route are tested directly in both engines.

## Science constants and honest limitations

- Refractive indices are the curated, review-dated reference values recorded in
  `SCIENCE_REVIEW.md` §9.5. Default ray frequency is `5.00e14 Hz`; the stationary
  boundary changes speed/wavelength, never frequency.
- Angles are measured from the normal. UI input is 0–89°; 90° grazing incidence
  is outside the simple control and engine calls throw rather than yielding NaN.
- Surface/illuminant responses are deterministic normalised teaching fixtures,
  not empirical material constants or D65 measurements. They conserve optical
  energy but do not calculate temperature or heating rate.
- Particle size is a 0–100 conceptual selector only: Small 0–33,
  Comparable-size 34–66 and Large 67–100. It is not a particle measurement.
- Mirror/lens outputs are qualitative extensions; no focal length, mirror/lens
  equation or fabricated geometry is claimed.
- Pupil opening, accommodation and retinal image size are relative teaching
  outputs. The vision extension is non-biometric, non-diagnostic and not medical
  advice.

## As-built corrections and declared divergences

- Split the original combined Vision/Astronomy workspace promise: Vision is
  available now while Reading starlight is visibly Stage 6/in development.
- Added the first-medium selector needed to model higher-to-lower-index TIR and
  the planned-but-missing qualitative lens selector/object-position control.
- Implemented mirror placement and angle as two explicit native range sliders,
  and the protractor as an attachable numeric measurement readout, preserving
  pointer/keyboard access without pretending the graphic itself is draggable.
- Strengthened the investigation gate: evidence now requires a hypothesis, two
  reflection points for a meaningful graph, refraction and energy trials,
  interpretation, conclusion and a limitation/improvement.
- Classified frequency, energy-ledger and pupil outputs as static audited
  manifest entries; they update from state and have text/table equivalents but
  are correctly exempt from focus and activation requirements.
- Replaced a duplicated numeric-validation phrase (“value value”) with the
  actionable empty-input message “Enter a numeric value.”

## Changed implementation areas

- Science and assessment: `src/science/optics.ts`, `src/science/vision.ts`,
  `src/assessment/lightQuestions.ts`, shared validation and science review.
- UI: `src/simulations/optics/`, Stage 4 routing/navigation, home/not-found
  visibility, glossary additions and evidence-store integration.
- Verification: `tests/unit/invariants/optics.test.ts`, assessment validation,
  `tests/e2e/optics.spec.ts`, `vision.spec.ts`, and shared accessibility,
  console, keyboard, responsive and shell matrices.
- Records: this pack, `COVERAGE.md`, `IMPLEMENTATION_STATUS.md`,
  `CONTROL_INVENTORY.md` and `TEST_PLAN.md`.

No tag was created and nothing was pushed. Independent review should re-run
`npm run verify`, browser-check this pack's claims, then decide whether to tag
the Stage 4 gate and promote 7.3.1–7.3.3 from `verified (builder)` to `verified`.
