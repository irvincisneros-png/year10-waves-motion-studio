# Stage 3 evidence pack — Sound module group

Builder gate run: 2026-07-20 (Australia/Sydney)  
Build branch: `stage-3-wip`, based on verified tag `stage-2`  
Gate contract: `docs/plans/stage-gates.md`, “Stages 3–5” plus the sound-only
audio criterion  
Builder status: **verified (builder)** — awaiting independent review

## Scope closed at this gate

- 7.2.1 — `/sound/compression`: linked source, particle, density/pressure and
  microphone-trace representations; tagged-particle evidence.
- 7.2.2 — `/sound/pitch-loudness`: independent frequency and output-level
  controls, visual/audio equivalents, controlled trials, graph, export,
  interpretation and limitation evidence.
- 7.2.3 — `/sound/doppler`: emitted wavefront arrival timing, moving
  source/observer presets, fixed source-frequency comparison, detected-frequency
  graph and optional detected pitch.
- Complete learning rhythm: `/sound`, `/sound/compression`,
  `/sound/pitch-loudness`, `/sound/doppler`, `/sound/check`, `/sound/explain`
  and `/sound/connect`.

Intentionally outside this gate: 7.2.4 hearing and 7.2.6 ultrasound remain Stage
6 work. Outcome 7.2.5 remains deferred until Irvin supplies or approves
community-specific Aboriginal and/or Torres Strait Islander sources. No Stage 4
route or outcome was started.

## Exact verification result

Final builder gate command: `npm run verify` — exit 0.

| Gate command | Result |
|---|---|
| oxlint | pass, 0 errors; 4 unchanged pre-existing warnings in `ErrorBoundary.tsx`, `WaveAnatomyDiagram.tsx`, `RulerTool.tsx` and `LiveRegion.tsx` |
| TypeScript project build | clean |
| Vitest | 14 files, 138 tests passed |
| Playwright | 296 tests: 295 passed, 1 expected skip; Chromium + WebKit; 1.8 min in the final gate run |

The one skip is the established WebKit exclusion for the Chromium-only offline
service-worker simulation; it is inherited from the verified Stage 2 suite.
The sound-only suite contributes 48 passing checks (24 per browser engine).

## Module-group gate checklist

- [x] **Engine + invariant tests before UI integration.** Pure engines live in
  `src/science/sound.ts` and `src/science/doppler.ts`. The sound and Doppler
  invariant suites contain 25 passing tests, including amplitude/frequency
  independence, pressure/density phase alignment, medium speed/wavelength,
  source-frequency constancy, arrival-time ordering and closed-form Doppler
  agreement.
- [x] **Every new control inventoried and Playwright-exercised.** The Stage 3
  as-built reconciliation is in `CONTROL_INVENTORY.md` §4.4. Every sound route
  and exposed control is exercised by `tests/e2e/sound.spec.ts`; shared shell,
  axe, console and responsive matrices include all seven routes.
- [x] **Misconception feedback and false-positive regressions.** Nine validated
  questions target particle transport, pressure/density, pitch/amplitude,
  volume/loudness and source-versus-detected frequency. Empty or malformed
  responses cannot score correct, and progressive hints are tested.
- [x] **Keyboard, reduced motion, tabular alternatives and fallbacks.** Sound
  controls pass keyboard operation; reduced-motion mode preserves static/step
  equivalents; Canvas/SVG graphs expose tables/readouts. Canvas unavailable,
  Web Audio unavailable, audio-context denial and storage failure paths are
  covered.
- [x] **Stage-specific science invariants.** All sound and Doppler invariants in
  `TEST_PLAN.md` and the implemented engines are green. Visible compression
  maxima align with pressure maxima. Detected Doppler frequency is absent until
  a wavefront arrives, while the source frequency remains 500 Hz.
- [x] **Full regression and clean runtime.** All Stage 1–2 unit and e2e checks
  remain green. Shared console checks and the direct browser walkthrough found
  zero page console errors/warnings and zero unhandled rejections.
- [x] **Coverage/status records updated in the same stage.** `COVERAGE.md`,
  `IMPLEMENTATION_STATUS.md`, `CONTROL_INVENTORY.md` and `TEST_PLAN.md` describe
  the as-built Stage 3 behaviour and use `verified (builder)`.
- [x] **Sound-only audio gate.** Web Audio is strictly opt-in after a session
  headphone warning; it begins muted, has a 0.15 hard gain ceiling, and cannot
  unmute in visual-only mode. Visual pulse timing, waveform/spectrum,
  detected-frequency graph and accessible readouts work when audio is absent or
  denied.

## Responsive, accessibility and manual walkthrough evidence

- Automated responsive checks cover exactly 320, 375, 768, 1024 and 1440 px.
- Automated axe checks report zero violations on every Stage 3 route in both
  browser engines. Correctness is never colour-only.
- Direct in-app browser walkthrough checked the seven routes and the 320 px core
  laboratory views. At 320 px, document `scrollWidth` equalled viewport width
  for the hub, compression, pitch/loudness and Doppler pages; controls remained
  visible and operable. Default-width inspection confirmed all route headings,
  graphs/tables and phase navigation. The browser console had no errors or
  warnings.
- Audio was not activated during the manual walkthrough; safety, denial,
  unsupported-audio and muted/capped behaviour are asserted through stubbed e2e
  tests so the gate never depends on a test machine's speakers.

## Science constants and honest limitations

- Air reference speed is 343 m/s at about 20 °C. Curated medium presets use
  labelled reference values and recalculate wavelength.
- The compression chamber represents a fixed 3.12 m physical span; changing
  frequency or medium changes the number of wavelengths visible. Particle
  positions/displacements are labelled relative and visually exaggerated.
- Pressure and density use the same phase convention: bunched particles are
  pressure maxima; rarefactions are minima. The microphone remains at a fixed
  physical position when wavelength changes.
- Pitch/loudness output is relative, not calibrated SPL; volume is a control
  setting and loudness is perception. Hearing response is non-linear.
- Doppler is a deterministic 1D, subsonic arrival-timing model with wave speed
  fixed relative to the medium. It does not model shock waves or sonic booms.

## As-built corrections and declared divergences

- Corrected the compression pressure sign so the particle-density and pressure
  representations share the same physical phase; added an invariant test.
- Replaced automatic chamber rescaling with the fixed physical viewport above.
- Corrected the worked Doppler expectation in `TEST_PLAN.md`: for 500 Hz,
  343 m/s and a +20 m/s approaching source, `500 × 343 / (343 − 20)` is about
  **531 Hz**, not 536.7 Hz.
- Reconciled the headphone-warning contract: it gates only Web Audio creation,
  while the visual investigation controls stay available.
- The planned “tag particles” control is implemented as four independently
  named particle checkboxes so students can compare paths. The Doppler preset
  selector exposes a `Custom velocities` state after manual slider changes.
- Pitch/loudness reset requests confirmation only when recorded trials would be
  lost. Doppler replay now stops its animation clock at the 2.5 s model limit.

## Changed implementation areas

- Science and assessment: `src/science/sound.ts`, `src/science/doppler.ts`,
  `src/assessment/soundQuestions.ts` and shared constants.
- UI and audio: `src/simulations/sound/`, sound routing/navigation, workspace
  availability, home/not-found links and the shared preset-control ID hook.
- Verification: `tests/unit/invariants/sound.test.ts`,
  `tests/unit/invariants/doppler.test.ts`, `tests/unit/audio/toneAudio.test.ts`,
  assessment validation and `tests/e2e/sound.spec.ts`, plus shared accessibility,
  console, responsive and shell matrices.
- Records: this pack, `COVERAGE.md`, `IMPLEMENTATION_STATUS.md`,
  `CONTROL_INVENTORY.md` and `TEST_PLAN.md`.

No tag was created and nothing was pushed. Independent review should re-run
`npm run verify`, browser-check this pack's claims, then decide whether to tag
the gate and promote 7.2.1–7.2.3 from `verified (builder)` to `verified`.
