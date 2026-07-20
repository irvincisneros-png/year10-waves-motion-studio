# Test Plan — WaveMotion Studio

Derived from `SCIENCE_SIMULATOR_SUITE_SHARED_SPEC.md` (Quality gates, Interaction-integrity
contract), `YEAR_10_WAVES_MOTION_APP_PLAN.md` §15–17, and the stage roadmap in
`docs/plans/2026-07-17-wavemotion-orchestration-plan.md`. Every control referenced below is
defined in `CONTROL_INVENTORY.md`; IDs are quoted in backticks, e.g. `wave-lab.frequency-slider`.

## Tooling mapping

| Layer | Tool | Location | Run command |
|---|---|---|---|
| Unit / invariant / equation / conversion / validation | Vitest | `tests/unit/**/*.test.ts` | `npm run test` (`vitest run`) |
| Browser / e2e / responsive / keyboard / route / offline / degraded-capability | Playwright | `tests/e2e/**/*.spec.ts` | `npm run test:e2e` (`playwright test`) |
| Accessibility audits | Playwright + `@axe-core/playwright` | `tests/e2e/a11y.spec.ts` | runs inside `npm run test:e2e` |
| Lint / types | oxlint, `tsc -b` | n/a | `npm run lint`, part of `npm run build` |
| Full gate | all of the above | n/a | **`npm run verify`** = `oxlint && tsc -b && vitest run && playwright test` |

`@axe-core/playwright` is installed and runs across every shipped route.

No test category is satisfied by agent narration. Every category below closes only when its
named tests exist, run under `npm run verify`, and their pass/fail output is captured in the
stage evidence pack, per the shared spec's "Stage evidence pack" and "Trust but verify" rules.

### Stage 5 as-built test mapping

- Pure engines: `src/science/motion.ts`, `src/science/forces.ts`; invariant and
  determinism coverage: `tests/unit/invariants/motion-forces.test.ts`.
- Equation rearrangements and division guards:
  `tests/unit/equations/motion-forces-equations.test.ts`; dimensional schema:
  `tests/unit/units.test.ts`.
- Assessment metadata, six misconception regressions, malformed/empty/wrong-unit
  false positives: `tests/unit/validation/assessment.test.ts`.
- Route refresh, controls, evidence, export, reduced-motion, seeded-noise and
  fallback paths: `tests/e2e/motion-forces.spec.ts`.
- Every Stage 5 route is included in `a11y.spec.ts`, `console.spec.ts` and the
  `320/375/768/1024/1440` responsive matrix. The invariant suite uses 64 fixed-seed
  generated cases per critical motion/force relationship (minimum contract: 50).

## Per-stage vs release-audit cadence

| Category | Runs every relevant stage (regression) | Also re-run at Stage 7 release audit |
|---|---|---|
| 1. Science-engine unit/invariant | Yes — new engine's tests at its stage, full suite regressed every later stage | Yes, full suite |
| 2. Equation/unit/rounding/validation | Yes, per engine at its stage | Yes, full suite |
| 3. Wave/ray/graph/motion/force calculation | Yes, per module at its stage | Yes, full suite |
| 4. Malformed/boundary/invalid input + false-positive regression | Yes, per module at its stage | Yes, full suite, plus a dedicated cross-module false-positive sweep |
| 5. Accessibility (axe, landmarks, labels, focus, live regions) | Yes, per route as it ships | Yes, full site audit incl. screen-reader spot-check (human) |
| 6. Keyboard-only walkthroughs | Yes, per workspace at its stage | Yes, full walkthrough of every workspace in one session |
| 7. Route/refresh/deep-link | Yes, from Stage 1 onward (shell) | Yes |
| 8. Responsive 320/375/768/1024/1440 | Yes, per route as it ships | Yes, full matrix |
| 9. Chrome/Edge/Safari | Automated: Chromium+WebKit every stage; Edge automated where available | Yes, plus human Chrome/Edge/Safari pass on laptop and tablet |
| 10. Offline (service worker, cache, update flow) | From Stage 1 (shell), regressed each stage that adds cached routes | Yes |
| 11. Degraded-capability fallbacks | Per feature as it ships (e.g. Web Audio fallback lands with Stage 3 sound) | Yes, full fallback matrix |
| 12. Safe/optional audio with visual equivalents | Stage 3 (sound), regressed later | Yes |
| 13. Console errors / unhandled rejections per route | Every stage, every new route | Yes, every route |
| 14. Runtime control-inventory parity | Every stage, for its shipped routes; route-specific specs prove effects | Yes, all-route documentation/ID/name/deferral sweep |
| 15. Deterministic sims + seeded-noise reproducibility | Stage 2 onward (deterministic engines), Stage 5 (seeded noise mode) | Yes |
| 16. Performance / memory / animation lifecycle | Stage 1 (shell budget), then per stage for its new routes | Yes, full budget audit |

---

## 1. Science-engine unit and invariant tests

All science-engine assertions run without React or the DOM. Real suites:

| File | Executable scope |
|---|---|
| `tests/unit/invariants/waves.test.ts`, `pulse.test.ts` | `v=fλ`, period, spatial repetition, amplitude independence, zero net particle transport and pulse propagation/boundaries. |
| `tests/unit/invariants/sound.test.ts`, `doppler.test.ts` | Sourced sound speeds, pressure/particle relationships, pitch/amplitude independence, safe frequency bounds, arrival-timed Doppler and invalid/supersonic rejection. |
| `tests/unit/invariants/optics.test.ts` | Reflection, Snell refraction, TIR, fixed boundary frequency, energy-ledger conservation, scattering and relative eye responses. |
| `tests/unit/invariants/motion-forces.test.ts` | Signed motion, distance/displacement, slope/area, motion diagrams, force sums, `F=ma`, Newton pairs and seeded-noise reproducibility across fixed generated cases. |
| `tests/unit/invariants/stage-six-science.test.ts` | EM spectrum transforms/bounds, ear pathway, ultrasound echo depth/trade-offs and catalogued astronomy lines/shifts. |

## 2. Equation rearrangement, unit conversion, rounding, and validation tests

| File | Executable scope |
|---|---|
| `tests/unit/equations/equations.test.ts` | All `v=fλ` and `T=1/f` rearrangements, the 343/440 worked example, zero/non-finite guards, triple consistency, rounding tolerance and numeric input parsing. |
| `tests/unit/equations/motion-forces-equations.test.ts` | `F=ma`, average velocity and acceleration rearrangements with signed quantities and invalid-denominator guards. |
| `tests/unit/units.test.ts` | Length/frequency/time conversions, round trips, dimensions and three-significant-figure display formatting. |

## 3. Worked science calculations

Worked examples are assertions inside the real equation and invariant files above; there is no
separate calculations test directory. Examples include 343 m/s at 440 Hz, the
glass-to-air critical angle, motion slope/area, there-and-back average velocity, inverse-mass
cart behavior and exact signed force sums.

## 4. Malformed, boundary, empty, out-of-range, and false-positive tests

| File | Executable scope |
|---|---|
| `tests/unit/validation/assessment.test.ts` | Empty/malformed/unknown/wrong-option/wrong-unit answers never score correct across wave, sound, light, motion and force banks; misconception regressions are explicit. |
| `tests/unit/mastery.test.ts` | The 101-question bank is fully tagged; the 24-question session covers every active outcome; constructed responses reject empty, short and keyword-free padding. |
| `tests/unit/progressData.test.ts`, `progressStore.test.ts` | Malformed, oversized and schema-invalid imports are atomic; imported levels need evidence; anonymous output omits text, IDs and timestamps. |
| `tests/unit/invariants/*.test.ts`, `tests/unit/equations/*.test.ts` | Non-finite values, zero denominators, invalid ranges and nonphysical masses/speeds are rejected rather than coerced. |
| Route-specific Playwright specs | UI-level empty, malformed, wrong-unit, misconception and incomplete-evidence paths show specific feedback and never report success. |

## 5. Accessibility tests

As-built locations: `tests/e2e/a11y.spec.ts`, `responsive.spec.ts` and
`control-inventory.spec.ts`. This table records only executable assertions.

| Test name | Asserts |
|---|---|
| `a11y.spec.ts › axe reports zero violations on [route]` | Full axe scan returns zero violations on every route exported by the shared fixtures. |
| `a11y.spec.ts › axe reports zero violations on the not-found page and with the settings panel open` | Dynamic shell states also return zero axe violations. |
| `a11y.spec.ts › skip link is the first tab stop and jumps focus to main content` | Keyboard skip navigation reaches `<main>`. |
| `a11y.spec.ts › keyboard focus is visible on shell controls` | Sampled shell controls have a non-zero visible outline under keyboard focus. |
| `a11y.spec.ts › 200% zoom loses no shell content` | The shell reflows without horizontal overflow or losing navigation at the tested 200% equivalent viewport. |
| `responsive.spec.ts › native text and selection controls meet the 44px minimum on every route` | Every rendered text input, select and textarea is at least 44 px high at 320 px width. |

## 6. Keyboard-only operation walkthroughs per workspace

As-built locations: `tests/e2e/keyboard.spec.ts` plus explicit keyboard paths in
the route-specific specs.

| Test name | Asserts |
|---|---|
| `keyboard.spec.ts › every primary nav item is reachable and operable by keyboard` | All primary navigation links activate using the keyboard. |
| `keyboard.spec.ts › settings disclosure and toggles are fully keyboard operable` | Header settings open and the three preference controls toggle from the keyboard. |
| `keyboard.spec.ts › progress-page actions are reachable and operable by keyboard` | Export, import and reset controls receive keyboard focus and reset cancellation is safe. |
| `keyboard.spec.ts › teacher presentation toggle is keyboard operable` | Presentation mode toggles from the keyboard. |
| `waves.spec.ts › complete keyboard path` and `sound.spec.ts › sound controls are operable in a keyboard-only path` | Representative wave and sound tasks can be completed without pointer input. |
| Route-specific Stage 4/5 specs | Native ranges, selects, radios, evidence controls and buttons retain their keyboard semantics in the tested learning tasks. |

## 7. Route, refresh, and deep-link behaviour

As-built locations: `tests/e2e/shell.spec.ts`, the cold-load loops in each
workspace spec and the common route fixtures in `tests/e2e/helpers.ts`.

| Test name | Asserts |
|---|---|
| `shell.spec.ts › cold deep link to [shell route] renders and survives refresh` | Every shell route renders directly and after hard reload. |
| Route-specific `cold load + refresh` loops | Every released learning route renders directly and after hard reload. |
| `shell.spec.ts › client-side navigation reaches every route, updates the title, and moves focus to the heading` | Warm navigation covers every shared route with title and focus management. |
| `shell.spec.ts › unknown URL shows the not-found page with working navigation back` | Unknown routes render the real not-found surface. |
| `stage-six.spec.ts › deferred cultural outcome appears only in the teacher coverage view` | The deferred route is absent and learner surfaces omit the deferred content; Teacher Coverage retains the audit row. |
| `stage-six.spec.ts › teacher layers, presets, coverage and print templates have observable effects` | A whitelisted generated lesson link reproduces its preset state. |

## 8. Responsive tests at exactly 320, 375, 768, 1024, 1440 px

## Stage 4 as-built gate additions (2026-07-20)

- Pure invariants live in `tests/unit/invariants/optics.test.ts`: reflection equality;
  Snell agreement; boundary-frequency constancy; TIR with no refracted ray; every
  normalised T/R/A fixture totals 1; scattering thresholds; qualitative mirror/lens
  outputs; relative pupil monotonicity and focus behaviour. The UI clamps angle input
  to 0–89°; direct engine calls at 90° throw an explicit `RangeError` and never produce
  `NaN`.
- `tests/e2e/optics.spec.ts` covers seven Stage 4 cold/refresh routes, the seven-phase
  path, Stage 6 astronomy availability, every ray/refraction/energy/application control,
  graph-worthy controlled trials, CSV/JSON, print, reset confirmation, invalid checks,
  progressive hints, and CER validation.
- `tests/e2e/vision.spec.ts` covers brightness extremes, distance/image-size response,
  accommodation/focus text, the non-diagnostic problem extension, complete labelled
  eye/neural pathway, blind-spot text fallback, evidence validation and reset.
- Shared axe, console and 320/375/768/1024/1440 responsive matrices include every
  Stage 4 route in Chromium and WebKit. Static manifest readouts are state-tested and
  text-complete; they are not interactive controls and are exempt from focus/activation.
- No Stage 4 activity uses Canvas, animation, audio, network access or random state.
  SVG diagrams always have adjacent state readouts/explanations, so reduced-motion,
  Canvas denial and audio denial do not reduce the learning task.

## Stage 6 as-built gate additions (2026-07-20)

- `tests/unit/invariants/stage-six-science.test.ts` sweeps EM f/λ transforms,
  continuous log positions, spectrum boundaries, ultrasound round-trip depth,
  frequency/angle bounds, cochlear-place bounds, catalogued-line matching and
  signed wavelength shifts. All data are deterministic and React-free.
- `tests/unit/stageSixContent.test.ts` verifies all six society evidence packs
  contain complete source/review/benefit/limitation/group/history/quantitative/
  competing-view fields.
- `tests/unit/mastery.test.ts` enforces ≥60 unique fully tagged questions,
  ≥one-third constructed response, all 24 active outcomes covered, 7.2.5 absent,
  exactly 24 session questions—one per active outcome—and empty/short/keyword-free constructed false
  positives rejected.
- Progress-store tests enforce schema v2 derivation: one evidence point is only
  `developing`; `secure` requires two distinct successful activity keys; imports
  cannot manufacture levels; anonymous JSON/CSV omit writing, IDs and timestamps.
- `tests/e2e/stage-six.spec.ts` exercises every completion route cold/refresh,
  all Stage 6 learner control groups, validation/evidence/export paths, deferred
  route absence, teacher layers/presets/coverage/print/reset, visible update
  prompt actions and whole-release-route offline reloads. WebKit keeps the
  service-worker offline case as an explicit expected skip.
- Shared axe, console and 320/375/768/1024/1440 matrices include all six
  completion routes in Chromium and WebKit. Stage 6 uses no Canvas, audio,
  randomness, clinical/patient data or runtime network fetch.

As-built location: `tests/e2e/responsive.spec.ts`, parametrised over the five
required widths at 800 px height. Native text/select targets are swept on every
route at 320 px; device-height and physical-tablet sampling remain human audit
items rather than automated claims.

| Test name | Asserts |
|---|---|
| `responsive.spec.ts › no horizontal overflow and nav reachable at [width]px` | At 320, 375, 768, 1024 and 1440 px, every released route has no document-level horizontal overflow, neither root masks overflow with `hidden`, and the route's primary navigation link remains visible. |
| `responsive.spec.ts › interactive targets meet the 44px minimum at 320px` | Samples shared Progress/Settings buttons at 320 px. |
| Route-specific 44 px tests at 320 px | Samples representative wave, sound, light, motion and forces buttons/sliders. |
| `responsive.spec.ts › native text and selection controls meet the 44px minimum on every route` | Sweeps every visible text input, select and textarea across all released routes at 320 px. |

Physical tablet/device-height checks and exhaustive target sampling at widths other than 320 px
remain human audit items.

## 9. Current Chrome, Edge, Safari

As-built configuration: `playwright.config.ts` runs bundled `chromium` and
`webkit` by default. `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome` or `msedge` reruns the
Chromium project against an installed branded browser. WebKit is a Safari-engine
proxy; real Chrome, Edge and Safari remain explicit human sign-off items.

| Test name | Asserts |
|---|---|
| Full Playwright project `chromium` | The complete route, interaction, accessibility, responsive and console suite runs in bundled Chromium. |
| Full Playwright project `webkit` | The same complete suite runs in WebKit, with two explicit service-worker network-emulation skips. |
| Optional `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome` / `msedge` | Reruns the Chromium project against a locally installed branded browser; this is not part of the default automated result. |
| Human sign-off (not automated) | Manual smoke pass on real Chrome, Edge, and Safari on laptop and tablet per the shared spec's Human quality gates, recorded in the Stage 7 evidence pack |

## 10. Offline operation (service worker, first-load cache, update flow)

As-built locations: `tests/e2e/shell.spec.ts` and `stage-six.spec.ts`.

| Test name | Asserts |
|---|---|
| `shell.spec.ts › offline: shell and visited routes still work after first load` | A visited shell route remains available after the production service worker controls the page and Chromium is put offline. |
| `stage-six.spec.ts › every released route reloads offline after one production-app load` | With `context.setOffline(true)` after service-worker readiness/control, every shipped route is hard-reloaded from the production precache |
| `stage-six.spec.ts › visible update prompt supports defer and refresh actions` | A deterministic update-available event surfaces the same production prompt; “Not now” dismisses it and “Refresh now” invokes the update callback |
| `console.spec.ts › no unexpected network requests to external hosts` | Normal release-route loads make no automatic external requests. This does not inspect Cache Storage contents. |

## 11. Degraded-capability fallbacks

As-built locations: degraded-capability cases in `tests/e2e/waves.spec.ts`,
`sound.spec.ts`, `settings.spec.ts` and `stage-six.spec.ts`, using
`page.addInitScript` or deterministic test events where necessary.

| Test name | Asserts |
|---|---|
| `waves.spec.ts › Canvas unavailable: chambers fall back to the text alternative with a notice` | Canvas denial on the reference wave chamber produces the visible semantic alternative. |
| `sound.spec.ts › reduced motion steps without autoplay and Canvas absence keeps text alternatives` | Sound Canvas denial retains its adjacent text alternative. |
| `sound.spec.ts › unsupported and denied audio both fall back to a complete visual-only activity` | Audio construction denial keeps the activity usable and visible. |
| `sound.spec.ts › resume denial is caught and changes the panel to visual-only without a page error` | Audio resume rejection is handled without an uncaught error. |
| `stage-six.spec.ts › service-worker registration failure gives a visible online-only fallback` | A deterministic registration-error event produces the online-only notice. |

## 12. Safe and optional audio with equivalent visual information

As-built locations: `tests/e2e/sound.spec.ts` and
`tests/unit/audio/toneAudio.test.ts` (also cross-referenced from §11 and
`CONTROL_INVENTORY.md` §§1 and 4).

| Test name | Asserts |
|---|---|
| `sound.spec.ts › the header sound preference is a real master opt-out for activity audio` | The persisted global preference prevents activity audio enablement and immediately mutes an active panel when switched off. |
| `sound.spec.ts › explicit acknowledgement then enable starts muted, capped, and visual-only can never unmute` | Web Audio is gesture-gated, begins muted, respects the gain cap and cannot unmute in visual-only mode. |
| `sound.spec.ts › frequency and output level remain independent and every visual control works without audio` | Visual waveform/readout changes do not require audio. |
| `sound.spec.ts › detected pitch stays opt-in and Doppler explanation evidence rejects empty text` | Doppler pitch remains opt-in and its learning task remains available without it. |
| `tests/unit/audio/toneAudio.test.ts` | Gain bounds, mute behavior, oscillator lifecycle and failure paths are deterministic unit-tested contracts. |

## 13. Console errors and unhandled rejections on every route

As-built location: `tests/e2e/console.spec.ts`, parametrised over all shipped
routes. It verifies clean load/effects and external-request hygiene; interaction
effects are owned by the route-specific specs and are not overclaimed here.

| Test name | Asserts |
|---|---|
| `console.spec.ts › no console errors, warnings or unhandled rejections on [route]` | `page.on('console')` and `page.on('pageerror')` capture zero warning/error messages or uncaught exceptions during production-route load and settling |
| `console.spec.ts › no unexpected network requests to external hosts` | All shipped routes load without automatic requests beyond localhost; user-initiated evidence-source links are outside this loop |

## 14. Runtime control-inventory parity

Location: `tests/e2e/control-inventory.spec.ts`. The executable test reads stable backtick-
delimited control IDs directly from `CONTROL_INVENTORY.md` and visits every route exported by
the shared route fixtures. There is no generated JSON fixture or generator script.

| Test name | Asserts |
|---|---|
| `runtime control-inventory parity › [route] has documented, unique runtime IDs and named controls` | Every rendered `data-control-id` is well formed and documented here; non-repeatable IDs occur at most once on that route; every rendered interactive element has a non-empty computed accessible name; no deferred `cultural-sound.*` control renders |
| `runtime control-inventory parity › the deferred cultural route remains absent` | The attempted cultural-sound URL resolves to the real not-found page and exposes zero deferred control IDs |

This is deliberately a **runtime documentation-parity** check, not an interaction generator.
Some inventory IDs identify repeatable families (for example per-force inputs), and many controls
need scientifically meaningful setup before an effect can be asserted. Their observable effects,
keyboard paths, reset/validation behaviour and scientific outcomes stay covered by the existing
route-specific specs (`waves.spec.ts`, `sound.spec.ts`, `optics.spec.ts`, `vision.spec.ts`,
`motion-forces.spec.ts`, `stage-six.spec.ts`, `settings.spec.ts` and `shell.spec.ts`). The parity
test must not be cited as proof that it activates every visible control.

## 15. Deterministic simulations and seeded-noise reproducibility

As-built locations: the pure invariant suites in `tests/unit/invariants/` and the
seeded-noise cases in `waves.spec.ts` and `motion-forces.spec.ts`. There is no
separate determinism directory or e2e file.

| Test name | Asserts |
|---|---|
| `tests/unit/invariants/sound.test.ts › waveformSample stays within [-1, 1] and is deterministic` | Repeated inputs return the same bounded waveform sample. |
| `tests/unit/invariants/motion-forces.test.ts › seeded noise is reproducible and never changes underlying scientific state` | Equal seeds reproduce measured values; a different seed changes noise only. |
| `tests/e2e/waves.spec.ts › noise mode perturbs ruler readings deterministically and never the wave state` | Reset/replay reproduces the measured-noise sequence while model values stay unchanged. |
| `tests/e2e/motion-forces.spec.ts › measurement noise reproduces after a reset and never hides ideal acceleration` | UI-driven cart trials reproduce noise after reset and continue to expose the ideal value. |

## 16. Performance and memory/animation-lifecycle checks

No dedicated automated performance suite is shipped. The release evidence records production
bundle sizes and browser smoke observations only. Throttled school-device time-to-interaction,
long-run frame rate, background-tab lifecycle, repeated mount/unmount memory growth, listener
counts and compressed-transfer budgets remain explicit known limitations and human follow-up
items; none is counted as an automated pass.

---

## Runner counts

Concrete unit and browser counts belong in each stage evidence pack because parametrised route
matrices change as the release grows. `npm run verify` is the only aggregate gate; this document
maps its real files and assertion scope without maintaining a second, drift-prone total.
