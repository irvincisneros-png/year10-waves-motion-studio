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
| 14. Every visible control exercised (CONTROL_INVENTORY-linked) | Every stage, for that stage's controls | Yes, full inventory sweep — this **is** the generated control-inventory test |
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
| `soundEngine.test.ts › Doppler arrival intervals match the configured kinematics model` | Computed detected-frequency for approach/recession scenarios matches the closed-form Doppler formula `f' = f × (v ± v_o)/(v ∓ v_s)` within tolerance | `f = 500 Hz, v = 343 m/s, v_s = +20 m/s (approaching), v_o = 0 → f' ≈ 536.7 Hz ± 0.1 Hz` |
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

Location: `tests/e2e/a11y/*.spec.ts`, using `@axe-core/playwright`'s `AxeBuilder` against
each route with `wcag2a`, `wcag2aa`, `wcag21aa`, and `wcag22aa` tags.

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

Location: `tests/e2e/keyboard/*.spec.ts`. Each walkthrough uses **only** `Tab`, `Shift+Tab`,
arrow keys, `Enter`, `Space`, `Escape`, and `Home`/`End` — no `page.click()` calls — and drives
the full Orient→Connect rhythm for that workspace's primary activity.

| Test name | Asserts |
|---|---|
| `keyboard.spec.ts › wave-lab: full keyboard walkthrough from Orient to Connect` | Every control listed under CONTROL_INVENTORY §2 (`wave-lab.*`) is reachable and operable by keyboard alone; the trial table can be populated and the graph viewed without a mouse |
| `keyboard.spec.ts › em-spectrum: full keyboard walkthrough` | Every `em-spectrum.*` control operable by keyboard; region jump, dataset comparison, and citation submission complete without a mouse |
| `keyboard.spec.ts › sound-lab: full keyboard walkthrough including enable-sound gate` | `global.enable-sound-button` and `sound-lab.headphone-warning-ack` are reachable and activatable by keyboard before any audio-bearing control becomes operable; Doppler preset cycling works via keyboard |
| `keyboard.spec.ts › hearing/ultrasound: full keyboard walkthrough` | All 8 `hearing.anatomy-part-buttons` reachable in pathway order; ultrasound pulse/probe controls operable without a mouse |
| `keyboard.spec.ts › optics: full keyboard walkthrough` | Draggable source/mirror/protractor controls in `optics.*` are each operable via their documented keyboard-stepping pattern, not only by drag |
| `keyboard.spec.ts › vision/astronomy: full keyboard walkthrough` | Eye and starlight controls operable by keyboard; spectral-line inspector cursor moves via arrow keys |
| `keyboard.spec.ts › motion: full keyboard walkthrough including strobe-dot editor` | `motion.strobe-dot-editor` placement/removal fully keyboard-driven; graph slope tool selects two points via keyboard |
| `keyboard.spec.ts › forces: full keyboard walkthrough` | Force add/remove/direction/type controls and the F-m-a trial run are keyboard-operable end to end |
| `keyboard.spec.ts › society: full keyboard walkthrough` | Case-study tablist, evidence table, and CER editor are keyboard-navigable and submittable |
| `keyboard.spec.ts › mastery: full keyboard walkthrough across all answer-input types` | Each answer-input variant (MCQ, numeric, diagram-placement, graph-point, text) is completed via keyboard alone, including the 3-level hint disclosure |
| `keyboard.spec.ts › teacher-tools: full keyboard walkthrough including confirmation dialogs` | Presentation mode, show/hide toggles, deep-link generator, and both reset confirmation dialogs (focus-trapped, `Escape` cancels) are keyboard-operable |

## 7. Route, refresh, and deep-link behaviour

Location: `tests/e2e/routing/*.spec.ts`.

| Test name | Asserts |
|---|---|
| `routing.spec.ts › all 10 shell routes load directly via URL (no client-side-only navigation dependency)` | Navigating directly to each of the 10 global routes (not via in-app link click) renders the correct page, not a blank/404 |
| `routing.spec.ts › refreshing mid-workspace preserves or gracefully resets state per its persistence contract` | A hard reload on a workspace with persisted state (e.g. trial table) restores it from localStorage; a workspace with session-only state resets cleanly with no console error |
| `routing.spec.ts › generated teacher deep link reproduces exact workspace state` | Loading a `teacher.deep-link-generator` output URL in a fresh browser context reproduces the exact control values encoded, verified control-by-control |
| `routing.spec.ts › unknown route falls back to a real 404 page, never a blank screen` | Navigating to `/does-not-exist` renders `shell.route-404` content with a working link home |
| `routing.spec.ts › deferred routes (e.g. cultural-sound) are absent from navigation and return 404, not a placeholder` | `/cultural-sound-investigation` (or equivalent) is not linked from any nav and returns the 404 route, confirming the "never ship placeholder" rule |
| `routing.spec.ts › browser back/forward preserves scroll and focus sensibly` | Using browser back after opening a disclosure panel returns to the prior route without a focus trap or lost skip-link target |

## 8. Responsive tests at exactly 320, 375, 768, 1024, 1440 px

Location: `tests/e2e/responsive/*.spec.ts`, parametrised over the five widths (heights fixed at
a representative 800px, then re-run once at each width's common device height).

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

Location: `playwright.config.ts` projects `chromium`, `webkit` (Safari engine proxy — true
Safari is a human pass, see below), and `msedge` (Chromium-based, via Playwright's `channel:
'msedge'`).

| Test name | Asserts |
|---|---|
| `cross-browser.spec.ts › smoke suite passes on chromium` | Home route loads, one control from each workspace operates, no console errors |
| `cross-browser.spec.ts › smoke suite passes on webkit` | as above — WebKit is the closest automatable proxy for Safari; Web Audio and Canvas API differences are specifically checked here since WebKit has historically diverged |
| `cross-browser.spec.ts › smoke suite passes on msedge` | as above |
| Human sign-off (not automated) | Manual smoke pass on real Chrome, Edge, and Safari on laptop and tablet per the shared spec's Human quality gates, recorded in the Stage 7 evidence pack |

## 10. Offline operation (service worker, first-load cache, update flow)

Location: `tests/e2e/offline/*.spec.ts`.

| Test name | Asserts |
|---|---|
| `offline.spec.ts › service worker registers and caches the app shell on first load` | After first visit, `navigator.serviceWorker.getRegistration()` resolves and the Cache Storage API contains the shell's precache manifest entries |
| `offline.spec.ts › app shell loads with network disabled after first visit` | With `context.setOffline(true)`, reloading the home route and the wave-lab route still renders (Playwright network interception simulates offline) |
| `offline.spec.ts › offline attempt to reach a not-yet-cached workspace shows a clear offline message, not a broken fetch` | Navigating offline to a route never visited online shows an explicit "This page needs an internet connection the first time" message |
| `offline.spec.ts › service worker update flow prompts before activating a new version` | Deploying a new build (simulated by bumping the SW version string) surfaces an update-available UI control rather than silently swapping content mid-session |
| `offline.spec.ts › offline shell has no unexpected network calls` | Network log during an offline session contains zero failed non-cache requests beyond the expected offline-check ping (if any) |

## 11. Degraded-capability fallbacks

Location: `tests/e2e/fallbacks/*.spec.ts`, using Playwright's ability to strip/override browser
APIs via `page.addInitScript` before each test.

| Test name | Asserts |
|---|---|
| `fallbacks.spec.ts › Canvas unavailable: [route] falls back to text/table equivalent` (parametrised over every Canvas-bearing route) | With `HTMLCanvasElement.prototype.getContext` stubbed to return `null`, the route renders its documented text/table alternative instead of a blank/broken canvas, and every numeric readout still matches the engine output |
| `fallbacks.spec.ts › WebGL unavailable: astronomy/optics 3D extension views degrade to the 2D/SVG equivalent` | With `WebGLRenderingContext` stubbed unavailable, any optional 3D view auto-switches to the mandatory 2D/SVG view with a visible notice, never a blank pane |
| `fallbacks.spec.ts › Web Audio denied: sound-lab and doppler run in visual-only mode automatically` | With `AudioContext` construction throwing, `sound-lab.visual-only-mode-toggle` auto-enables and locks, `global.enable-sound-button` shows "Sound unavailable — visual mode only", and every audio-paired readout (oscilloscope, spectrum, detected-frequency graph) still renders correctly |
| `fallbacks.spec.ts › localStorage full: progress save fails gracefully with a message, not a crash` | With `localStorage.setItem` stubbed to throw `QuotaExceededError`, saving progress shows "Couldn't save progress — storage is full" and the in-session state remains usable |
| `fallbacks.spec.ts › localStorage denied (private browsing): app runs session-only with a visible notice` | With `localStorage` access throwing on read, a one-time banner explains progress won't persist, and no console error is thrown on any subsequent read/write attempt |
| `fallbacks.spec.ts › service worker unsupported: app still functions online without offline support` | With `navigator.serviceWorker` undefined, the app loads and every control functions identically; only the offline-availability claim is absent, with no console error |

## 12. Safe and optional audio with equivalent visual information

Location: `tests/e2e/audio-safety.spec.ts` (also cross-referenced from §11 and CONTROL_INVENTORY §1, §4).

| Test name | Asserts |
|---|---|
| `audio-safety.spec.ts › audio never plays before global.enable-sound-button is activated` | On first load of `sound-lab` and the Doppler view, no `AudioContext` is constructed and no sound plays until the gesture fires |
| `audio-safety.spec.ts › audio defaults muted and to a safe low gain` | Immediately after `enable-sound-button` activation, `global.mute-button` state is muted and `sound-lab.amplitude-output-slider` reads its documented safe default (20%), never defaulting to maximum |
| `audio-safety.spec.ts › gain is hard-capped regardless of input` | Attempting to set gain above the documented ceiling via `sound-lab.amplitude-output-slider` (including scripted/out-of-band values) never exceeds the cap |
| `audio-safety.spec.ts › every audio-bearing control has a simultaneous, equivalent visual representation` | For `sound-lab.frequency-slider`, `sound-lab.oscilloscope-timescale-slider`, `sound-lab.doppler-pitch-audio-toggle`, and `hearing.frequency-location-slider`, the visual waveform/graph/oscilloscope updates identically whether or not audio is playing or muted |
| `audio-safety.spec.ts › headphone warning is shown once per session before first audio-capable interaction` | `sound-lab.headphone-warning-ack` blocks `frequency-slider`/`amplitude-output-slider` on first entry to the module, and is not re-shown after acknowledgement within the same session |

## 13. Console errors and unhandled rejections on every route

Location: `tests/e2e/console-errors.spec.ts`, parametrised over all shipped routes.

| Test name | Asserts |
|---|---|
| `console-errors.spec.ts › [route] produces zero console errors on load and after exercising every visible control` (one parametrised test per shipped route) | Playwright's `page.on('console')` and `page.on('pageerror')` listeners capture zero `error`-level messages and zero uncaught exceptions across page load plus one full pass of every control on that route (driven from the `CONTROL_INVENTORY.md` list for that route) |
| `console-errors.spec.ts › no unhandled promise rejections during async operations` | Progress import/export, service-worker update checks, and preset loading (all async) never leave an unhandled rejection, verified via `page.on('pageerror')` plus a `window.addEventListener('unhandledrejection', ...)` bridge injected before navigation |

## 14. Every visible control exercised (generated control-inventory test)

Location: `tests/e2e/control-inventory.spec.ts` — this is the shared spec's required
"generated control-inventory test confirming that every exposed control is wired, uniquely
labelled, keyboard reachable, and covered by at least one browser test."

| Test name | Asserts |
|---|---|
| `control-inventory.spec.ts › every ID in CONTROL_INVENTORY.md resolves to exactly one rendered element on its route` | A generator script parses `CONTROL_INVENTORY.md`'s tables into a manifest (`tests/fixtures/control-manifest.json`, regenerated by a `predev`/CI script), and this test asserts each non-deferred ID resolves via its accessible name to exactly one element on its documented route |
| `control-inventory.spec.ts › every control has a real, observable effect on activation` | For each control, the test performs its documented interaction and asserts at least one observable DOM/state change occurred (value text changed, class/attribute changed, or a network-free state read changed) — this is the automated backstop for "no dead control" |
| `control-inventory.spec.ts › every control ID appears in at least one other named test elsewhere in this suite` | Cross-references every ID in the manifest against the test titles in this document (via a lightweight text-search over `tests/e2e/**/*.spec.ts` and `tests/unit/**/*.test.ts`) and fails the build if any control is untested |
| `control-inventory.spec.ts › no two controls on the same route share an accessible name` | Duplicate-name detector at the manifest level (regression pairing with §5's per-route runtime check) |
| `control-inventory.spec.ts › deferred controls (cultural-sound.*) are absent from any rendered route` | Confirms the 6 deferred `cultural-sound.*` IDs resolve to zero elements anywhere in the shipped build, keeping the "never ship placeholder" rule enforced automatically |

This manifest-driven test is the mechanism that keeps `CONTROL_INVENTORY.md` honest — a control
added to a component without a matching inventory row (or vice versa) fails CI.

## 15. Deterministic simulations and seeded-noise reproducibility

Location: `tests/unit/determinism/*.test.ts` and `tests/e2e/determinism.spec.ts`.

| Test name | Asserts |
|---|---|
| `determinism.test.ts › ideal-mode engines produce bit-identical output for identical input across repeated runs` | Running `waveEngine`, `soundEngine`, `opticsEngine`, `motionEngine`, and `forceEngine` (ideal mode) twice with identical inputs and identical elapsed-time steps produces bit-identical output arrays | `waveEngine.simulate({f:2,amp:0.5}, steps:100)` run twice → arrays `Array.isArray` deep-equal |
| `determinism.test.ts › seeded measurement-noise mode (forces.noise-mode-toggle) is reproducible for a fixed seed` | Two runs with the same seed value produce identical noisy trial data; two runs with different seeds produce different data | `seed=4471 twice → identical trial[]; seed=4471 vs seed=9001 → different trial[]` |
| `determinism.e2e.spec.ts › UI-driven noise-mode run is reproducible when the seed is fixed via a teacher deep link` | Loading the same `teacher.deep-link-generator` URL with a fixed seed twice in fresh browser contexts produces the same displayed trial table |

## 16. Performance and memory/animation-lifecycle checks

Location: `tests/e2e/performance/*.spec.ts`.

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
| 14. Every visible control exercised | 5 (manifest-driven, covers all 180 inventory rows) |
| 15. Deterministic + seeded reproducibility | 3 |
| 16. Performance / memory | 8 |
| **Fixed-count total (excl. per-route/per-control parametrisation)** | **~116 named test cases**, expanding to several hundred concrete assertions once parametrised over every shipped route, breakpoint, and the full 180-row control manifest |
