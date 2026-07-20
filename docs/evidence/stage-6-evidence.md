# Stage 6 evidence pack — cross-cutting completion gate

Builder gate run: 2026-07-20 (Australia/Sydney)

Build branch: `stage-6-wip`, based on merged Stage 5 main commit `945c99e`

Gate contract: `docs/plans/stage-gates.md`, “Stage 6 — cross-cutting completion
gate”, and `docs/plans/stage-6-plan.md`

Builder status: **verified (builder)** — awaiting the fresh-context Stage 7
release audit

## Scope closed at this gate

- 7.1.4 and 7.1.7 — `/spectrum`: a continuous logarithmic EM comparison,
  linked frequency/wavelength values, approximate overlapping regions,
  ionising-risk guardrails and dated secondary-source analysis.
- 7.2.4 — `/hearing`: a simplified, non-diagnostic mechanical → fluid →
  electrical response pathway and qualitative frequency-place relationship.
- 7.2.6 — `/ultrasound`: synthetic pulse-echo phantoms, exact round-trip depth
  calculation and an explicit frequency/resolution/penetration trade-off.
- 7.3.4 — `/astronomy`: curated multiwavelength evidence, catalogued stellar
  lines, tolerance-bounded identification and signed red/blueshift reasoning.
- 7.5.1 — `/society`: six sourced evidence packs and a validated argument
  workflow with contention, criterion, CER, counterclaim, proportional
  conclusion and bibliography.
- `/mastery`: a validated 101-question bank covering all 24 active outcomes;
  48 questions (47.5%) are constructed response.
- Cross-cutting teacher, progress, offline/update and asset-provenance work.

Outcome 7.2.5 is intentionally deferred. No attributable, community-approved
source set was supplied or approved, so the release contains no cultural
sound-material route, card, navigation item, mastery question, asset or generic
substitute.

## Exact verification result

Final builder gate command: `npm run verify` — exit 0.

| Gate command | Result |
|---|---|
| oxlint | pass, 0 errors; 4 unchanged warnings in `LiveRegion.tsx`, `ErrorBoundary.tsx`, `WaveAnatomyDiagram.tsx` and `RulerTool.tsx` |
| TypeScript project build | clean |
| Vitest | 20 files, 202 tests passed |
| Production build | pass; service worker and precache generated |
| Playwright | 538 tests: 536 passed, 2 expected skips; Chromium + WebKit; 8.3 min in the final gate run |

Both skips are declared WebKit exclusions for Playwright network-condition
emulation: the established shell offline test and the completion-route offline
test. The equivalent production service-worker paths pass in Chromium; these
are not hidden or retry-converted passes.

The inspected deployable `dist/` contains 753,080 bytes (0.72 MiB) excluding
macOS AppleDouble sidecars. Its largest assets are the 689,972-byte JavaScript
bundle and 34,991-byte stylesheet. Vite's greater-than-500 kB chunk message is
a non-failing advisory; the complete local bundle is deliberately precached
for offline use and remains a release-audit performance consideration.

## Stage 6 gate mapping

- [x] **Mastery bank.** `src/assessment/masteryQuestions.ts` validates outcome,
  concept, difficulty, representation and misconception tags. All 101 entries
  target the 24 active outcomes; 48 are constructed response. The UI provides
  three progressive hints, retry, keyboard-complete answer paths, guarded
  malformed/empty handling and evidence recording.
- [x] **Teacher tools.** `/teacher` provides presentation mode, seven persistent
  display layers, student-data-free preset links, registry-derived outcome
  coverage, misconception prompts, suggested questions and printable
  investigation/report sheets. Module and whole-progress resets are confirmed
  and tested.
- [x] **Evidence-derived progress.** Schema v2 derives `not attempted`,
  `developing` and `secure`; `secure` requires successful evidence from at least
  two distinct evidence keys. Sanitised import cannot manufacture a level
  without the supporting evidence. Anonymous JSON, CSV and print outputs omit
  free text, generated IDs and timestamps.
- [x] **Offline and update hardening.** The production service worker precaches
  the application; shell and completion routes reload offline after first
  control in Chromium. The visible update prompt's refresh and defer actions
  are deterministic-testable. Console/network tests detect unexpected runtime
  requests; source links are user-initiated only.
- [x] **Asset manifest and honest deferral.** `ASSET_MANIFEST.md` records the PWA
  icons and every release visual's provenance, purpose, alternative and review
  state. The unused inherited third-party icon sprite was removed. Outcome
  7.2.5 is explicitly absent.

## Science and content evidence

- React-free EM, hearing, ultrasound and astronomy modules have deterministic
  boundary, invariant and false-positive coverage, including ≥50-case sweeps.
- The EM model preserves `c = 3.00 × 10⁸ m/s`, presents boundaries as
  approximate/overlapping and never equates ionising radiation with
  radioactivity or risk with frequency alone.
- Ultrasound depth is calculated as `speed × round-trip time ÷ 2`; every
  phantom is visibly synthetic and the route makes no clinical claim.
- Stellar line matching uses only the reviewed H/He/Na catalogue and returns
  no match outside tolerance. Shift sign is always paired with direction text.
- Society packs carry review dates and direct source metadata. The authoritative
  source register and retrieval notes are in `SCIENCE_REVIEW.md`; sources
  include Australian and international health, science, communications and
  space authorities. No source is fetched silently at runtime.

## Accessibility, responsive and runtime evidence

- Shared axe and console matrices include every released route in Chromium and
  WebKit and report zero violations, page errors, console warnings/errors or
  unhandled rejections.
- Automated responsive coverage exercises 320, 375, 768, 1024 and 1440 px.
  Stage 6 completion pages, including the dense society bibliography surface,
  retain document-width containment at 320 px.
- Native controls, 44 px minimum sampled targets, focus visibility, skip-link,
  200% zoom and keyboard-only paths remain green. Stage 6 visuals use semantic
  HTML/CSS/SVG with always-present text/table equivalents and no audio or Canvas
  dependency.
- Every released route cold-loads and refreshes. Home, primary navigation and
  the release registry expose only real destinations; 7.2.5 resolves through
  the genuine not-found path.

## As-built corrections and declared divergences

- Progress schema v1's stored status field was replaced by schema v2 evidence
  derivation before Stage 6 evidence producers were added.
- The older minimum-60 plan was exceeded with 101 validated questions; the
  constructed-response share is 47.5%, above the one-third gate.
- Constructed responses use deterministic completeness and concept checks.
  They verify assessable concepts but do not claim to replace teacher judgement
  of writing quality.
- Teacher destructive actions use the browser's native confirmation dialog,
  preserving platform focus handling rather than introducing a custom modal.
- The ultrasound pulse is a deterministic immediate model; reduced-motion users
  receive the same static readout without an animated wait state.
- A 60-second Playwright test budget replaces the framework's 30-second default
  because concurrent WebKit physics-step sequences on the external workspace
  volume can legitimately take 40–50 seconds. There are no retries, and all 538
  cases execute under the same production-build configuration.

## Known limitations for the Stage 7 auditor

- Builder verification is not independent release sign-off. Stage 7 must run
  from fresh context, review every control and reconcile the completion matrix.
- Playwright WebKit approximates Safari but cannot automate Chromium's network
  condition API; the two WebKit offline cases remain explicit skips.
- Browser-generated print dialogs, native confirmation-dialog chrome, physical
  audio output and installed-PWA update behaviour still warrant real-device
  human sampling.
- Completion science models are deliberately bounded teaching models: the ear
  pathway is non-diagnostic, ultrasound data are synthetic, EM regions overlap,
  stellar lines use a small curated catalogue and society evidence is a dated
  secondary-source set.
- The monolithic JavaScript bundle produces Vite's size advisory. It is small
  enough for the current offline release but should be reconsidered if future
  content materially expands it.
- 7.2.5 cannot enter release scope until Irvin supplies or approves
  attributable, community-specific sources and the resulting content receives
  cultural review.

## Changed implementation areas

- Science/content: `src/science/emSpectrum.ts`, `hearing.ts`, `ultrasound.ts`,
  `astronomy.ts`, `src/content/stageSixContent.ts` and the release registry.
- Learner/assessment: completion pages, `/mastery`, the 101-question bank and
  constructed-response validation.
- Cross-cutting: progress schema v2, anonymous export/print, teacher surfaces,
  PWA update testing, route/navigation/home integration and asset replacement.
- Verification/records: Stage 6 unit/e2e suites and the shared accessibility,
  console, keyboard, responsive, settings, shell and offline matrices;
  `COVERAGE.md`, `IMPLEMENTATION_STATUS.md`, `CONTROL_INVENTORY.md`,
  `SCIENCE_REVIEW.md`, `TEST_PLAN.md`, `ASSET_MANIFEST.md` and README.

No tag was created and nothing was pushed. The fresh-context Stage 7 auditor
should re-run `npm run verify`, inspect the deployable archive, close any
release-blocking finding and decide whether the release is ready for the human
`v1.0.0` tag.
