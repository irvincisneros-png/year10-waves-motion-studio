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
| Accessibility audits | Playwright + `@axe-core/playwright` | `tests/e2e/a11y/*.spec.ts` | runs inside `npm run test:e2e` |
| Lint / types | oxlint, `tsc -b` | n/a | `npm run lint`, part of `npm run build` |
| Full gate | all of the above | n/a | **`npm run verify`** = `oxlint && tsc -b && vitest run && playwright test` |

`@axe-core/playwright` is not yet a dependency — add it in the Stage 1 work package
(`npm install -D @axe-core/playwright`) alongside the existing Playwright devDependency.

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

Location: `tests/unit/invariants/*.test.ts`. Mirrors app-plan §15 verbatim. Each test runs the
engine directly (no DOM), across a spread of randomised-but-seeded input combinations (minimum
50 pseudo-random cases per invariant, seed fixed for reproducibility) plus explicit boundary
cases.

| Test name | Asserts | Example inputs → expected output |
|---|---|---|
| `waveEngine.test.ts › v equals f times lambda within tolerance` | `speed ≈ frequency × wavelength` for every wave scenario in `waveScenarios`, tolerance 1e-6 relative | `f = 2 Hz, λ = 0.75 m → v = 1.5 m/s ± 1.5e-6 m/s` |
| `waveEngine.test.ts › tagged medium particles return to zero net displacement over whole cycles` | After exactly N whole periods (N = 1, 5, 20), a tagged particle's displacement from its equilibrium position is within tolerance of zero | `frequency = 2 Hz, duration = 5 × 0.5 s = 2.5 s → |displacement| < 1e-9 m` |
| `waveEngine.test.ts › amplitude changes do not affect frequency or speed (basic linear model)` | Sweeping `amplitude` from 0–100% at fixed frequency/medium leaves `speed` and `frequency` outputs bit-for-bit unchanged | `amplitude ∈ {0,25,50,75,100}%, f = 2 Hz, medium = rope → frequency output stays exactly 2 Hz, speed output stays exactly the medium's fixed value for every amplitude` |
| `soundEngine.test.ts › frequency control changes pitch representation without changing amplitude output` | Changing `frequency` alone never mutates the stored `amplitude` field | `frequency 220→880 Hz at amplitude 40% → amplitude field remains exactly 40 before and after` |
| `soundEngine.test.ts › Doppler arrival intervals match the configured kinematics model` | Computed detected-frequency for approach/recession scenarios matches the closed-form Doppler formula `f' = f × (v ± v_o)/(v ∓ v_s)` within tolerance | `f = 500 Hz, v = 343 m/s, v_s = +20 m/s (approaching), v_o = 0 → f' ≈ 531 Hz ± 0.1 Hz` |
| `opticsEngine.test.ts › reflection angle equals incidence angle` | For every incident angle 0–89° in 1° steps, computed reflected angle equals incident angle within tolerance | `incident = 37° → reflected = 37.0° ± 0.01°` |
| `opticsEngine.test.ts › refraction satisfies Snell's law and frequency is constant at the boundary` | `n₁ sin θ₁ = n₂ sin θ₂` holds within tolerance for every curated medium pair; `frequency` output is bit-identical before/after crossing the boundary | `n₁=1.00, n₂=1.33, θ₁=40° → θ₂ ≈ 28.90° ± 0.02°; frequency unchanged exactly` |
| `opticsEngine.test.ts › optical energy fractions sum to one within tolerance` | `transmitted + reflected + absorbed = 1.0 ± 1e-6` for every curated material/illuminant pair | `material = "glass", illuminant = "daylight" → 0.10 + 0.08 + 0.82 = 1.00 ± 1e-6` |
| `motionEngine.test.ts › distance is non-negative while displacement carries direction` | `distance ≥ 0` for every walker run; `displacement` can be negative; `distance ≥ |displacement|` always | `walker moves +3 m then −5 m → distance = 8 m, displacement = −2 m; 8 ≥ 2 ✓, 8 ≥ 0 ✓` |
| `motionEngine.test.ts › graph slopes match configured motion` | The slope computed by `motion.slope-identification-tool`'s engine function between any two points on a straight distance-time segment equals the configured constant speed, within tolerance | `configured speed = 1.5 m/s, points at t=1s and t=4s → slope = 1.5 m/s ± 0.01 m/s` |
| `forceEngine.test.ts › one-dimensional force summation is correct` | Net force equals the signed sum of all configured force magnitudes/directions, for 1–6 simultaneous forces | `forces = [+5 N, −2 N, +1 N] → net = +4 N` |
| `forceEngine.test.ts › F_net = ma and a = Δv/Δt hold in ideal runs` | Both relations hold within tolerance for every (force, mass) pair in the ideal (non-noise) cart model, and independently for every recorded (Δv, Δt) pair | `F = 4 N, m = 2 kg → a = 2.0 m/s² ± 0.01; Δv = 6 m/s over Δt = 3 s → a = 2.0 m/s² ± 0.01` |
| `forceEngine.test.ts › third-law force pairs are equal, opposite, and attached to different objects` | For every Newton case with a defined pair, `pairA.magnitude === pairB.magnitude`, `pairA.direction === -pairB.direction`, and `pairA.object !== pairB.object` | `walking case → foot-on-ground = 400 N down (object: ground), ground-on-foot = 400 N up (object: foot)` |
| `units.test.ts › every displayed unit and conversion is dimensionally valid` | A schema-driven sweep asserts each conversion function's declared input/output dimension (length, frequency, time, force, velocity, acceleration) matches its physical formula, and round-trip conversion (A→B→A) returns the original value within floating-point tolerance | `toMeters(500, 'nm') → 500e-9 m (±1e-15); back to 'nm' → 500 ± 1e-9` |

## 2. Equation rearrangement, unit conversion, rounding, and validation tests

Location: `tests/unit/equations/*.test.ts`, `tests/unit/units.test.ts`.

| Test name | Asserts | Example |
|---|---|---|
| `equations.test.ts › v=fλ solves for any one variable given the other two` | Given `{v,f}`, `{f,λ}`, or `{v,λ}`, the third value matches the direct formula | `v=1500, f=3 → λ=500 (m); f=3, λ=500 → v=1500` |
| `equations.test.ts › a=Δv/Δt solves for any one variable` | as above for acceleration | `Δv=10, Δt=5 → a=2; a=2, Δt=5 → Δv=10` |
| `equations.test.ts › F=ma solves for any one variable` | as above for force | `m=2, a=3 → F=6; F=6, a=3 → m=2` |
| `units.test.ts › frequency conversions Hz/kHz/MHz/GHz round-trip exactly` | Chained conversion through all four units returns the original value within 1e-9 relative | `1,000,000 Hz → 1,000 kHz → 1 MHz → 0.000001 GHz → back to 1,000,000 Hz` |
| `units.test.ts › length conversions m/cm/mm/µm/nm round-trip exactly` | as above | `500 nm → 5e-5 cm → back to 500 nm ± 1e-9 relative` |
| `units.test.ts › rounding for display never mutates the stored exact value` | Display rounding is applied only at the presentation layer; the internal state object remains full-precision after 100 successive display re-renders | `stored f = 439.99999994 Hz displayed as "440 Hz"; internal value after 100 renders still 439.99999994` |
| `equations.test.ts › rearrangement rejects division by zero inputs with a specific message, never returns Infinity/NaN silently` | Solving `λ = v/f` for `λ` with `f = 0` returns a validation error object, not `Infinity` | `v=1500, f=0 → { error: "Frequency cannot be 0 Hz" }`, not `Infinity` |

## 3. Wave, ray, graph, motion, and force calculation tests

Location: `tests/unit/calculations/*.test.ts` — deterministic worked-example checks distinct
from the randomised invariant sweeps in §1.

| Test name | Asserts | Example |
|---|---|---|
| `waveCalculations.test.ts › worked wavelength example matches textbook value` | `f=440 Hz, v=343 m/s → λ≈0.78 m` | as stated, tolerance ±0.005 m |
| `rayCalculations.test.ts › critical angle for total internal reflection matches arcsin(n2/n1)` | `n1=1.5 (glass), n2=1.0 (air) → θc ≈ 41.8°` | tolerance ±0.1° |
| `graphCalculations.test.ts › slope tool computes correct speed for a two-segment piecewise graph` | Segment 1 slope and segment 2 slope independently match each segment's configured speed | `segment1: 0→2s at 1 m/s; segment2: 2→5s at 0 m/s (paused) → slopes 1.0 and 0.0 m/s` |
| `motionCalculations.test.ts › average velocity v_av = Δs/Δt matches average speed = total distance/total time for one-directional motion` | The two formulas agree when motion never reverses | `walker moves +10 m in 5 s only in the positive direction → v_av = average speed = 2.0 m/s` |
| `motionCalculations.test.ts › average velocity diverges correctly from average speed when motion reverses` | For a there-and-back run, `average speed > 0` while `average velocity` can be 0 | `walker: +5 m then −5 m over 10 s total → average speed = 1.0 m/s, average velocity = 0.0 m/s` |
| `forceCalculations.test.ts › cart F-m-a trial series matches the linear F_net=ma relationship across a swept range` | A regression fit of measured acceleration vs configured force (fixed mass) has slope within 5% of `1/m` | `m = 2 kg, F ∈ {1,2,3,4,5} N → fitted slope ≈ 0.5 (m/s²)/N ± 5%` |

## 4. Malformed, boundary, empty, out-of-range, and scientifically invalid input tests

Location: `tests/unit/validation/*.test.ts` (engine-level) and `tests/e2e/validation/*.spec.ts`
(UI-level). **Every row in this section requires an explicit false-positive regression
assertion** — the invalid input must never be marked correct, accepted, or silently coerced.

| Test name | Invalid input | Expected behaviour (false-positive regression) |
|---|---|---|
| `validation.test.ts › lambda-v-f calculator: empty answer` | `v`, `f`, or `λ` field left blank on submit | Rejected with "Enter a [field] value"; calculation never runs; never scored as correct |
| `validation.test.ts › lambda-v-f calculator: non-numeric text` | `"abc"`, `"5 metres"`, `"½"` typed into any field | Rejected with "Enter a number"; field value not coerced to 0 or NaN treated as valid |
| `validation.test.ts › lambda-v-f calculator: negative frequency` | `f = -10` | Rejected with "Frequency cannot be negative"; never accepted as a valid wave |
| `validation.test.ts › lambda-v-f calculator: 0 Hz frequency` | `f = 0` | Rejected with "Frequency cannot be 0 Hz for a travelling wave" (explicit boundary, not a generic negative-only check) |
| `validation.test.ts › lambda-v-f calculator: unit mismatch` | `v` entered in km/h while `f` and `λ` assume SI, with no unit selector engaged | The engine requires an explicit unit tag per field and rejects a bare number with ambiguous unit as "Select a unit before submitting" — never silently assumes SI |
| `validation.test.ts › lambda-v-f calculator: internally inconsistent triple` | `v=1500, f=2, λ=1` (does not satisfy `v=fλ`) | Rejected with "These three values don't satisfy v = fλ"; never marked as a correct measurement |
| `validation.test.ts › mastery numeric question: non-simplified answer` | Question expects `2/5`; student enters `4/10` | Accepted as scientifically equivalent per the "accept scientifically equivalent answers within stated rounding/format rules" contract — **not** a false-positive case, this is a required true-positive; paired test `validation.test.ts › mastery numeric question rejects wrong-value non-simplified answer` checks `3/10` is still rejected |
| `validation.test.ts › force magnitude input: empty` | Magnitude field blank on "Add force" | Rejected with "Enter a magnitude"; net-force calculation excludes the incomplete force, never treats blank as 0 silently without telling the student |
| `validation.test.ts › force magnitude input: negative value typed via paste` | Pasting `"-5"` into a field structurally restricted to non-negative magnitudes | Value clamped/rejected at the input boundary; direction must be set via the separate sign control, never inferred from a negative magnitude |
| `validation.test.ts › cart mass slider: 0 kg boundary` | `mass = 0` | Excluded from the slider's reachable range entirely (min 0.1 kg); if reached via a scripted/out-of-band value, engine returns `{ error: "Mass must be greater than 0 kg" }`, never `Infinity` acceleration |
| `validation.test.ts › optics incident angle: 90° boundary` | `incident angle = 90°` | Excluded (max 89°); grazing incidence flagged as undefined in the simple model, never silently rendered as a valid ray |
| `validation.test.ts › representation-trap question: misconception answer` | Student selects "particles physically move up and down" | Always marked incorrect regardless of any other state; feedback text is the specific guardrail correction, never generic |
| `validation.test.ts › piecewise motion story: "graph is a literal hill" answer` | Student selects the literal-path interpretation | Always marked incorrect; feedback restates the guardrail, never marked correct even if the student's shape-matching is otherwise close |
| `validation.test.ts › spectral line inspector: position with no catalogued line` | Cursor placed at an arbitrary wavelength with no curated line entry | Returns "No catalogued line here"; never invents/interpolates an identification |
| `validation.test.ts › progress import: malformed JSON` | Upload a `.json` file with a syntax error | Rejected with a specific parse-error message; import aborts entirely, no partial write to localStorage |
| `validation.test.ts › progress import: oversized file` | Upload a 5 MB file against the 1 MB cap | Rejected before parsing with "File too large (max 1 MB)"; never attempts to parse |
| `validation.test.ts › progress import: schema-invalid but valid JSON` | Valid JSON missing required fields / wrong types | Rejected by schema validation with a specific field-level message; never imported as partial/best-effort data |
| `validation.test.ts › society CER editor: empty required field` | Submit with "Reasoning" blank, "Claim" and "Evidence" filled | Identifies "Reasoning" specifically as missing, not a generic "form incomplete" message |
| `validation.test.ts › mastery MCQ: no option selected` | Submit with nothing selected | Rejected with "Choose an answer"; never scores as either correct or incorrect — treated as not-attempted |

## 5. Accessibility tests

As-built locations: `tests/e2e/a11y.spec.ts`, `responsive.spec.ts` and
`control-inventory.spec.ts`. The named rows below are acceptance requirements;
only assertions present in those files count as automated evidence.

| Test name | Asserts |
|---|---|
| `a11y.spec.ts › axe audit: [route] has zero critical/serious violations` (parametrised over all 10 shell routes + every shipped workspace route) | `AxeBuilder` results contain zero `critical` or `serious` impact violations |
| `a11y.spec.ts › landmark structure is present on every route` | Each route has exactly one `<main>`, a `<nav>` landmark, and a correctly nested heading outline starting at `h1` with no skipped levels |
| `a11y.spec.ts › every form control has a programmatically associated label` | Every input/select/textarea/slider in `CONTROL_INVENTORY.md` resolves an accessible name via `aria-label`, `aria-labelledby`, or a `<label for>` association — cross-checked against the inventory's "Accessible name" column |
| `a11y.spec.ts › no two controls on one route share an accessible name` | Accessible-name uniqueness check per route (catches, e.g., two "Show labels" toggles on the same page) |
| `a11y.spec.ts › focus is always visible` | `:focus-visible` outline computed style has non-zero width/contrast on every interactive element reached via Tab, sampled across all shipped routes |
| `a11y.spec.ts › focus order matches visual/DOM reading order` | Sequential Tab presses on each route visit elements in the same order as their DOM position (no positive `tabindex` traps) |
| `a11y.spec.ts › live-region announcements fire for state changes without spamming` | Reset, error messages, and mastery feedback use `aria-live="polite"` (never `assertive` except confirmation-dialog warnings) and fire at most once per discrete event, verified via the accessibility tree snapshot before/after the action |
| `a11y.spec.ts › colour is never the only channel for correctness/direction/state` | For each control flagged "never colour-only" in `CONTROL_INVENTORY.md` (e.g. `forces.force-direction-select`, `astronomy.redshift-blueshift-slider`, `mastery.progress-report-view`), the accessible text/DOM content conveys the same information independent of any CSS colour |
| `a11y.spec.ts › interactive targets meet the 44×44 CSS px minimum` | Computed bounding box of every button/slider handle/checkbox on a shipped route is ≥44×44 px |
| `a11y.spec.ts › 200% browser zoom does not clip or hide content` | At 200% zoom (viewport reflow, not just text scaling) on a 1280px-equivalent layout, no interactive control is clipped or requires two-directional scroll |

## 6. Keyboard-only operation walkthroughs per workspace

As-built locations: `tests/e2e/keyboard.spec.ts` plus the keyboard paths in
`waves.spec.ts`, `sound.spec.ts`, `optics.spec.ts`, `vision.spec.ts` and
`motion-forces.spec.ts`. The rows below remain the acceptance catalogue and must
not be read as separate files that exist.

| Test name | Asserts |
|---|---|
| `keyboard.spec.ts › wave-lab: full keyboard walkthrough from Orient to Connect` | Every control listed under CONTROL_INVENTORY §2 (`wave-lab.*`) is reachable and operable by keyboard alone; the trial table can be populated and the graph viewed without a mouse |
| `keyboard.spec.ts › em-spectrum: full keyboard walkthrough` | Every `em-spectrum.*` control operable by keyboard; region jump, dataset comparison, and citation submission complete without a mouse |
| `keyboard.spec.ts › sound-lab: full keyboard walkthrough including enable-sound gate` | `global.enable-sound-button` and `sound-lab.headphone-warning-ack` are reachable and activatable by keyboard before any audio-bearing control becomes operable; Doppler preset cycling works via keyboard |
| `keyboard.spec.ts › hearing/ultrasound: full keyboard walkthrough` | All 8 `hearing.anatomy-part-buttons` reachable in pathway order; ultrasound pulse/probe controls operable without a mouse |
| `optics.spec.ts` + `vision.spec.ts › Stage 4 keyboard paths` | Native ray/source/angle/particle/brightness/distance/accommodation ranges accept arrow and `Home`/`End` keys; check, evidence, disclosure, select and radio controls retain native keyboard semantics. |
| `keyboard.spec.ts › motion: full keyboard walkthrough including strobe-dot editor` | `motion.strobe-dot-editor` placement/removal fully keyboard-driven; graph slope tool selects two points via keyboard |
| `keyboard.spec.ts › forces: full keyboard walkthrough` | Force add/remove/direction/type controls and the F-m-a trial run are keyboard-operable end to end |
| `keyboard.spec.ts › society: full keyboard walkthrough` | Case-study tablist, evidence table, and CER editor are keyboard-navigable and submittable |
| `keyboard.spec.ts › mastery: full keyboard walkthrough across all answer-input types` | Each answer-input variant (MCQ, numeric, diagram-placement, graph-point, text) is completed via keyboard alone, including the 3-level hint disclosure |
| `keyboard.spec.ts › teacher-tools: full keyboard walkthrough including confirmation dialogs` | Presentation mode, show/hide toggles, deep-link generator, and both reset confirmation dialogs (focus-trapped, `Escape` cancels) are keyboard-operable |

## 7. Route, refresh, and deep-link behaviour

As-built locations: `tests/e2e/shell.spec.ts`, the cold-load loops in each
workspace spec and the common route fixtures in `tests/e2e/helpers.ts`.

| Test name | Asserts |
|---|---|
| `routing.spec.ts › all 10 shell routes load directly via URL (no client-side-only navigation dependency)` | Navigating directly to each of the 10 global routes (not via in-app link click) renders the correct page, not a blank/404 |
| `routing.spec.ts › refreshing mid-workspace preserves or gracefully resets state per its persistence contract` | A hard reload on a workspace with persisted state (e.g. trial table) restores it from localStorage; a workspace with session-only state resets cleanly with no console error |
| `routing.spec.ts › generated teacher deep link reproduces exact workspace state` | Loading a `teacher.deep-link-generator` output URL in a fresh browser context reproduces the exact control values encoded, verified control-by-control |
| `routing.spec.ts › unknown route falls back to a real 404 page, never a blank screen` | Navigating to `/does-not-exist` renders `shell.route-404` content with a working link home |
| `routing.spec.ts › deferred routes (e.g. cultural-sound) are absent from navigation and return 404, not a placeholder` | `/cultural-sound-investigation` (or equivalent) is not linked from any nav and returns the 404 route, confirming the "never ship placeholder" rule |
| `routing.spec.ts › browser back/forward preserves scroll and focus sensibly` | Using browser back after opening a disclosure panel returns to the prior route without a focus trap or lost skip-link target |

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
  exactly 20 session questions and empty/short/keyword-free constructed false
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
| `responsive.spec.ts › [route] at 320px has no horizontal scroll and no clipped/hidden interactive content` | `document.documentElement.scrollWidth <= viewport width`; every control in `CONTROL_INVENTORY.md` for that route remains reachable and fully visible or reachable via in-page scroll (never `overflow-x: hidden` masking) |
| `responsive.spec.ts › [route] at 375px …` | as above |
| `responsive.spec.ts › [route] at 768px (tablet portrait) …` | as above, plus nav pattern switches correctly (e.g. to a tablet layout) without losing any control |
| `responsive.spec.ts › [route] at 1024px (tablet landscape) …` | as above; shared spec explicitly requires tablet-landscape support without content loss |
| `responsive.spec.ts › [route] at 1440px (desktop) …` | as above; layout does not leave excessive unused whitespace that hides controls off-screen |
| `responsive.spec.ts › touch targets remain ≥44×44 CSS px at every breakpoint` | Cross-checked against §5's 44×44 assertion, repeated at each of the 5 widths |

Parametrise across every shipped route at each stage; the full 5-breakpoint × all-routes matrix
runs at the Stage 7 release audit.

## 9. Current Chrome, Edge, Safari

As-built configuration: `playwright.config.ts` runs bundled `chromium` and
`webkit` by default. `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome` or `msedge` reruns the
Chromium project against an installed branded browser. WebKit is a Safari-engine
proxy; real Chrome, Edge and Safari remain explicit human sign-off items.

| Test name | Asserts |
|---|---|
| `cross-browser.spec.ts › smoke suite passes on chromium` | Home route loads, one control from each workspace operates, no console errors |
| `cross-browser.spec.ts › smoke suite passes on webkit` | as above — WebKit is the closest automatable proxy for Safari; Web Audio and Canvas API differences are specifically checked here since WebKit has historically diverged |
| `cross-browser.spec.ts › smoke suite passes on msedge` | as above |
| Human sign-off (not automated) | Manual smoke pass on real Chrome, Edge, and Safari on laptop and tablet per the shared spec's Human quality gates, recorded in the Stage 7 evidence pack |

## 10. Offline operation (service worker, first-load cache, update flow)

As-built locations: `tests/e2e/shell.spec.ts` and `stage-six.spec.ts`.

| Test name | Asserts |
|---|---|
| `offline.spec.ts › service worker registers and caches the app shell on first load` | After first visit, `navigator.serviceWorker.getRegistration()` resolves and the Cache Storage API contains the shell's precache manifest entries |
| `stage-six.spec.ts › every released route reloads offline after one production-app load` | With `context.setOffline(true)` after service-worker readiness/control, every shipped route is hard-reloaded from the production precache |
| `stage-six.spec.ts › visible update prompt supports defer and refresh actions` | A deterministic update-available event surfaces the same production prompt; “Not now” dismisses it and “Refresh now” invokes the update callback |
| `offline.spec.ts › offline shell has no unexpected network calls` | Network log during an offline session contains zero failed non-cache requests beyond the expected offline-check ping (if any) |

## 11. Degraded-capability fallbacks

As-built locations: degraded-capability cases in `tests/e2e/waves.spec.ts`,
`sound.spec.ts`, `settings.spec.ts` and `stage-six.spec.ts`, using
`page.addInitScript` or deterministic test events where necessary.

| Test name | Asserts |
|---|---|
| `fallbacks.spec.ts › Canvas unavailable: [route] falls back to text/table equivalent` (parametrised over every Canvas-bearing route) | With `HTMLCanvasElement.prototype.getContext` stubbed to return `null`, the route renders its documented text/table alternative instead of a blank/broken canvas, and every numeric readout still matches the engine output |
| `fallbacks.spec.ts › WebGL unavailable: astronomy/optics 3D extension views degrade to the 2D/SVG equivalent` | With `WebGLRenderingContext` stubbed unavailable, any optional 3D view auto-switches to the mandatory 2D/SVG view with a visible notice, never a blank pane |
| `fallbacks.spec.ts › Web Audio denied: sound-lab and doppler run in visual-only mode automatically` | With `AudioContext` construction throwing, `sound-lab.visual-only-mode-toggle` auto-enables and locks, `global.enable-sound-button` shows "Sound unavailable — visual mode only", and every audio-paired readout (oscilloscope, spectrum, detected-frequency graph) still renders correctly |
| `fallbacks.spec.ts › localStorage full: progress save fails gracefully with a message, not a crash` | With `localStorage.setItem` stubbed to throw `QuotaExceededError`, saving progress shows "Couldn't save progress — storage is full" and the in-session state remains usable |
| `fallbacks.spec.ts › localStorage denied (private browsing): app runs session-only with a visible notice` | With `localStorage` access throwing on read, a one-time banner explains progress won't persist, and no console error is thrown on any subsequent read/write attempt |
| `fallbacks.spec.ts › service worker unsupported: app still functions online without offline support` | With `navigator.serviceWorker` undefined, the app loads and every control functions identically; only the offline-availability claim is absent, with no console error |

## 12. Safe and optional audio with equivalent visual information

As-built locations: `tests/e2e/sound.spec.ts` and
`tests/unit/audio/toneAudio.test.ts` (also cross-referenced from §11 and
`CONTROL_INVENTORY.md` §§1 and 4).

| Test name | Asserts |
|---|---|
| `audio-safety.spec.ts › audio never plays before global.enable-sound-button is activated` | On first load of `sound-lab` and the Doppler view, no `AudioContext` is constructed and no sound plays until the gesture fires |
| `audio-safety.spec.ts › audio defaults muted and to a safe low gain` | Immediately after `enable-sound-button` activation, `global.mute-button` state is muted and `sound-lab.amplitude-output-slider` reads its documented safe default (20%), never defaulting to maximum |
| `audio-safety.spec.ts › gain is hard-capped regardless of input` | Attempting to set gain above the documented ceiling via `sound-lab.amplitude-output-slider` (including scripted/out-of-band values) never exceeds the cap |
| `audio-safety.spec.ts › every audio-bearing control has a simultaneous, equivalent visual representation` | For `sound-lab.frequency-slider`, `sound-lab.oscilloscope-timescale-slider`, `sound-lab.doppler-pitch-audio-toggle`, and `hearing.frequency-location-slider`, the visual waveform/graph/oscilloscope updates identically whether or not audio is playing or muted |
| `audio-safety.spec.ts › headphone warning is shown once per session before Web Audio is enabled` | `sound-lab.headphone-warning-ack` blocks only creation/enabling of Web Audio on first entry; visual frequency/amplitude controls remain usable with sound off, and the warning is not re-shown after acknowledgement within the same session |

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
| `determinism.test.ts › ideal-mode engines produce bit-identical output for identical input across repeated runs` | Running `waveEngine`, `soundEngine`, `opticsEngine`, `motionEngine`, and `forceEngine` (ideal mode) twice with identical inputs and identical elapsed-time steps produces bit-identical output arrays | `waveEngine.simulate({f:2,amp:0.5}, steps:100)` run twice → arrays `Array.isArray` deep-equal |
| `determinism.test.ts › seeded measurement-noise mode (forces.noise-mode-toggle) is reproducible for a fixed seed` | Two runs with the same seed value produce identical noisy trial data; two runs with different seeds produce different data | `seed=4471 twice → identical trial[]; seed=4471 vs seed=9001 → different trial[]` |
| `determinism.e2e.spec.ts › UI-driven noise-mode run is reproducible when the seed is fixed via a teacher deep link` | Loading the same `teacher.deep-link-generator` URL with a fixed seed twice in fresh browser contexts produces the same displayed trial table |

## 16. Performance and memory/animation-lifecycle checks

No dedicated performance suite is shipped at this gate. The rows below are a
future performance acceptance catalogue, not automated pass claims. Stage 7
records only production-bundle size, route-load smoke timing and human browser
observations; memory/long-run frame budgets remain known limitations.

| Test name | Asserts |
|---|---|
| `performance.spec.ts › first interaction ready within ~3s on warm cache` | Using Playwright's tracing/`page.evaluate(() => performance.timing...)` (or the Performance API's `interactive` timing) on a warm-cache reload, time-to-first-interactive is ≤3.5s (documented budget with headroom over the shared spec's "about 3 seconds") on a throttled "typical school laptop" CPU/network profile |
| `performance.spec.ts › animated simulations sustain 30-60 fps in standard graphics mode` | Frame-timing sampled via `requestAnimationFrame` deltas over a 5s window on `wave-lab` and `motion` routes averages ≥30 fps |
| `performance.spec.ts › low-graphics mode sustains 20-30 fps and never changes displayed numeric results` | Same measurement with `global.low-graphics-toggle` enabled; cross-checked against §1's amplitude/frequency invariants to confirm science state is unaffected |
| `performance.spec.ts › rAF loop pauses when the tab is hidden` | Simulating `document.visibilitychange` to `hidden` stops new `requestAnimationFrame` calls within one frame; resuming visibility resumes them |
| `performance.spec.ts › rAF loop pauses on a fully static scene (no motion configured)` | A workspace configured with zero velocity/frequency (e.g. paused walker) stops issuing new rAF calls after settling, rather than animating a static frame indefinitely |
| `performance.spec.ts › no memory growth over repeated mount/unmount of a simulation route` | Navigating into and out of `wave-lab` 20 times and forcing GC (via Chromium DevTools Protocol `HeapProfiler`) shows heap size after the 20th cycle within 10% of after the 2nd cycle (allows JIT warm-up noise, catches real leaks) |
| `performance.spec.ts › event listeners are removed on unmount` | A listener-count check (via a lightweight instrumented `addEventListener`/`removeEventListener` wrapper active only in the test build) confirms zero net listener growth after 20 mount/unmount cycles of any Canvas-bearing workspace |
| `performance.spec.ts › initial route payload stays under the 2MB compressed budget` | Network log total transferred bytes for the first route load (compressed) is <2MB, audited per shipped route |

---

## Summary counts

| Category | Named test cases listed |
|---|---|
| 1. Science-engine unit/invariant | 13 |
| 2. Equation/unit/rounding/validation | 7 |
| 3. Wave/ray/graph/motion/force calculation | 6 |
| 4. Malformed/boundary/invalid input (incl. false-positive regressions) | 19 |
| 5. Accessibility | 10 |
| 6. Keyboard-only walkthroughs | 11 |
| 7. Route/refresh/deep-link | 6 |
| 8. Responsive (5 breakpoints) | 6 test patterns × up to ~14 shipped routes at full matrix |
| 9. Chrome/Edge/Safari | 4 |
| 10. Offline | 5 |
| 11. Degraded-capability fallbacks | 6 |
| 12. Safe/optional audio | 5 |
| 13. Console errors / unhandled rejections | 2 test patterns × every shipped route |
| 14. Runtime control-inventory parity | all shipped routes + one deferred-route assertion |
| 15. Deterministic + seeded reproducibility | 3 |
| 16. Performance / memory | 8 |
| **Fixed-count total (excl. per-route parametrisation)** | Planning estimate only; concrete runner counts are recorded in stage evidence. The runtime parity case expands across every shipped route, while route-specific specs own interaction effects. |
