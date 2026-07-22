# Implementation Status

> Reset 2026-07-17 after audit (`docs/AUDIT_2026-07-17.md`). The previous status file
> claimed outcomes were implemented; verification showed prototype-depth code only.
> An outcome is recorded as anything beyond `not built` only when it passes the stage
> gates in `docs/plans/stage-gates.md` with evidence.

Status values: `not built` · `prototype — not verified` · `in build` · `verified (builder)` · `verified` · `deferred`

> Stage 1 note (2026-07-17): the shared shell (routes `/`, `/glossary`,
> `/progress`, `/teacher`, `/about` + 404), design tokens, accessibility
> primitives, settings/progress stores and offline PWA are built and
> builder-verified. Prototype simulation code now lives in
> `src/_prototype_archive/` (excluded from build/lint/typecheck) — outcome
> rows below still describe those archived prototypes; no outcome content
> ships in Stage 1.

> Stage 2 note (2026-07-18): the wave-foundations vertical slice (`/waves` +
> medium/energy/types/measure/check/explain/connect) is built on a new pure
> engine (`src/science/waves.ts`, `equations.ts`, `pulse.ts`, `constants.ts`,
> `rng.ts`) replacing the prototype `waveEngine.ts`. Builder-run
> `npm run verify` is green: oxlint 0 errors, tsc clean, 108 unit tests,
> 217 e2e passed / 1 skipped (chromium-only offline sim on WebKit) across
> Chromium + WebKit. It passed independent review and is tagged `stage-2`.

> Stage 3 note (2026-07-20): the sound workspace (`/sound` + compression,
> pitch/loudness, Doppler, Check, Explain and Connect) is built from tested
> sound/Doppler engines with accessible non-audio equivalents. Web Audio is
> strictly opt-in, muted by default and capped. Builder-run `npm run verify`
> is green: oxlint 0 errors, tsc clean, 138 unit tests, 295 e2e passed / 1
> skipped across Chromium + WebKit. Exact gate evidence is in
> `docs/evidence/stage-3-evidence.md`. `verified (builder)` awaits independent
> review before it may become plain `verified`.

> Stage 4 note (2026-07-20): the light/vision workspace (`/light`, `/vision`,
> properties, applications, Check, Explain and Connect) is built from tested
> optics and explicitly relative eye-response engines. Builder-run
> `npm run verify` is green: oxlint 0 errors, tsc clean, 152 unit tests, 367
> e2e passed / 1 expected skip across Chromium + WebKit. Exact gate evidence
> is in `docs/evidence/stage-4-evidence.md`. `verified (builder)` awaits
> independent review before it may become plain `verified`.

> Stage 5 note (2026-07-20): the motion and forces workspaces (`/motion` and
> `/forces`, each with seven-phase activity routes) are built from tested pure
> kinematics, force and equation engines. Builder-run `npm run verify` is green:
> oxlint 0 errors, TypeScript clean, 187 unit tests, 481 e2e passed / 1 expected
> skip across Chromium + WebKit. Exact gate evidence is in
> `docs/evidence/stage-5-evidence.md`. `verified (builder)` awaits independent
> review before it may become plain `verified`.

> Stage 6 note (2026-07-20): the completion routes (`/spectrum`, `/hearing`,
> `/ultrasound`, `/astronomy`, `/society`, `/mastery`) and cross-cutting
> teacher/progress/offline work are built. Progress schema v2 derives levels
> from evidence and requires two distinct successful evidence points for
> `secure`; anonymous outputs contain no free text, IDs or timestamps. The
> mastery bank has 101 validated questions across all 24 active outcomes, 48
> of them constructed-response. Outcome 7.2.5 is explicitly deferred and has
> no route/nav/card/question. Exact final suite counts are recorded in
> `docs/evidence/stage-6-evidence.md`. Builder-run `npm run verify` is green:
> oxlint 0 errors, TypeScript clean, 202 unit tests, 536 browser tests passed
> and 2 expected WebKit offline-emulation skips across Chromium + WebKit.

> Stage 7 note (2026-07-20): fresh-context Terra and Luna audits found and then
> passed the closed runtime/documentation findings. Final builder-run
> `npm run verify` is green at `e9f0cec`: oxlint 0 errors, TypeScript clean,
> 202 unit tests, 640 browser tests passed and 2 expected WebKit offline-emulation
> skips. The deployable `dist/` and review ZIP are ready. Exact evidence and
> human-only promotion gates are in `docs/evidence/stage-7-evidence.md`.

> Corrected product-direction note (2026-07-22): the binding product contract is
> now `docs/PRODUCT_VISION.md` with the route model in
> `docs/OUTCOME_FIRST_IA.md`. The learner home is an outcome gallery with 24
> active cards and no 7.2.5 card; the primary shell exposes only All simulators.
> Outcomes 7.1.1–7.1.4 are canonical outcome-first simulators at their
> `/simulators/<code>` routes. Remaining cards are labelled Existing model and
> retain a non-destructive legacy destination. Bulk conversion beyond 7.1.4
> remains stopped pending user review under PV-09. The 7.1.1–7.1.4 release gate
> is green: oxlint 0 errors, TypeScript clean, 254 unit tests, 761 browser tests
> passed and 3 expected WebKit capability skips across Chromium + WebKit.

## Outcomes

| Code | Status | Notes |
|---|---|---|
| 7.1.1 | verified (builder; corrected-direction prototype) | `/simulators/7.1.1` outcome-specific Transmission Lab: immediate three-bay causal comparison, deterministic engine, state-based 300-point challenge, replay, optional tour, Canvas/text equivalence and reduced-motion stepping. Legacy `/waves/medium` preserved. Evidence: `docs/evidence/7.1.1-prototype-evidence.md`; user approval pending |
| 7.1.2 | verified (builder; canonical) | `/simulators/7.1.2` Energy Relay: one-pulse particle passport with an immutable-home engine, peak/return capture, receiver-energy evidence, deterministic replay, Canvas/text equivalence and reduced-motion stepping. Legacy `/waves/energy` preserved. Evidence: `docs/evidence/7.1.2-evidence.md`; user approval pending |
| 7.1.3 | verified (builder; canonical) | `/simulators/7.1.3` Twin Wave Observatory: one scalar engine state drives linked transverse/longitudinal views, safe ordered spring particles, live feature-probe locks, direction comparison, graph-representation trap and deterministic replay. Legacy `/waves/types` preserved. Evidence: `docs/evidence/7.1.3-evidence.md`; user approval pending |
| 7.1.4 | verified (builder; canonical) | `/simulators/7.1.4` Spectrum Tuner: continuous log-scale model with invariant-linked f/λ values, approximate/overlapping region candidates, A/B pins, three deterministic 100-point calibration missions, replay and Canvas/text equivalence. Legacy `/spectrum` preserved. Evidence: `docs/evidence/7.1.4-evidence.md`; user approval pending |
| 7.1.5 | verified | `/waves/measure` ruler/timer/probe tools, presets (rope/water/sound/EM), seeded-noise mode, limitation prompt. Audited speed-cap bug is structurally gone (presets fix speed; λ derived) |
| 7.1.6 | verified | v=fλ calculator (all rearrangements, unit-aware, division-guarded, inconsistent-triple rejection), λ vs 1/f trials table + graph + CSV/JSON export, interpretation prompt |
| 7.1.7 | verified (builder) | `/spectrum` review-dated secondary-source table, property comparison and required citation evidence |
| 7.2.1 | verified (builder) | `/sound/compression` links source motion, particle displacement, compression/rarefaction density, pressure and microphone trace; fixed physical viewport; tagged-particle table and evidence capture |
| 7.2.2 | verified (builder) | `/sound/pitch-loudness` independently controls frequency/amplitude; safe opt-in audio plus visual pulse equivalent; controlled trials, graph, CSV/JSON export, interpretation and limitations |
| 7.2.3 | verified (builder) | `/sound/doppler` uses emitted wavefront arrival timing for moving source/observer presets; source frequency remains fixed; graph/readouts and optional safely gated pitch |
| 7.2.4 | verified (builder) | `/hearing` eight-structure mechanical→fluid→electrical pathway, simplified frequency-place map and non-diagnostic saved explanation |
| 7.2.5 | deferred | Cultural sound investigation — blocked on Irvin-approved sources |
| 7.2.6 | verified (builder) | `/ultrasound` three synthetic phantoms, exact depth = speed × round-trip time ÷ 2, qualitative frequency trade-off and evidence limitation |
| 7.3.1 | verified (builder) | `/vision` relative brightness/pupil, distance/image-size and accommodation/focus model; labelled optical/neural pathway; non-diagnostic extension and saved explanation |
| 7.3.2 | verified (builder) | `/light/properties` reflection equality, Snell refraction/TIR, fixed boundary frequency, normalised T/R/A ledger, qualitative scattering; full controlled investigation/graph/export/print/evidence |
| 7.3.3 | verified (builder) | `/light/applications` mirror, qualitative lens, optical-fibre and conditional surface/application reasoning with required justification and limitation evidence |
| 7.3.4 | verified (builder) | `/astronomy` curated multiwavelength evidence, catalogued H/He/Na lines, honest no-match identification and signed red/blueshift inference |
| 7.4.1 | verified (builder) | `/motion/track` signed 1D position, distance, displacement, speed and average velocity with changeable origin, exact step history and reversal handling |
| 7.4.2 | verified (builder) | `/motion/diagrams` 2–8-dot motion diagrams with independently changeable interval, spacing-pattern validation and reversal-specific feedback |
| 7.4.3 | verified (builder) | `/motion/graphs` position–time and velocity–time representations, exact slope/area readouts, controlled investigation, graph/table/export and graph-as-path misconception check |
| 7.4.4 | verified (builder) | `/forces/cart` F–m–a cart investigation with applied force, mass, capped 0.5 N friction, deterministic measurement noise, two fair-test sweeps, tables/graphs/export/evidence |
| 7.4.5 | verified (builder) | `/forces/applications` six contextual Newton-law cases; third-law pairs name distinct objects and only the reviewed walking fixture uses a numeric force |
| 7.4.6 | verified (builder) | `/forces/vectors` up-to-six-force 1D vector builder with exact signed sum, coordinate-sign convention and accessible force table |
| 7.4.7 | verified (builder) | `/forces/calculations` unit-aware F=ma rearrangements plus motion average/slope/area calculations with zero-division and invalid-mass guards |
| 7.5.1 | verified (builder) | `/society` six sourced evidence packs, contention/criteria/evidence/CER/counterclaim/proportional conclusion/bibliography validation and export |

## Stages

| Stage | Status |
|---|---|
| 0 — Scope and evidence contract | complete (tagged `stage-0`) |
| 1 — Shared shell and foundations | verified — tagged `stage-1` |
| 2 — Wave laboratory vertical slice | verified — tagged `stage-2` (108 unit, 217 e2e passed / 1 skipped across Chromium+WebKit at its gate) |
| 3 — Sound module group | built — builder verification green (138 unit, 295 e2e passed / 1 skipped across Chromium+WebKit); evidence in `docs/evidence/stage-3-evidence.md`; awaiting independent review |
| 4 — Light and vision module group | built — builder verification green (152 unit, 367 e2e passed / 1 skipped across Chromium+WebKit); evidence in `docs/evidence/stage-4-evidence.md`; awaiting independent review |
| 5 — Motion and force module group | built — builder verification green (187 unit, 481 e2e passed / 1 expected skip across Chromium+WebKit); evidence in `docs/evidence/stage-5-evidence.md`; awaiting independent review |
| 6 — Spectrum/hearing/ultrasound/astronomy/society/mastery/teacher/progress/offline | built — builder verification green (202 unit, 536 browser tests passed / 2 expected WebKit offline-emulation skips across Chromium+WebKit); evidence in `docs/evidence/stage-6-evidence.md`; awaiting independent release audit |
| 7 — Independent release audit | technical audit complete; human science/browser/device approval and `v1.0.0` tag pending |
