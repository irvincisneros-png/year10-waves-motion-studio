# Implementation Status

> Reset 2026-07-17 after audit (`docs/AUDIT_2026-07-17.md`). The previous status file
> claimed outcomes were implemented; verification showed prototype-depth code only.
> An outcome is recorded as anything beyond `not built` only when it passes the stage
> gates in `docs/plans/stage-gates.md` with evidence.

Status values: `not built` · `prototype — not verified` · `in build` · `verified` · `deferred`

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
> Chromium + WebKit. "verified" below means exactly that — the
> orchestrator's independent gate re-run is still to come before the rows
> flip to plain `verified`.

## Outcomes

| Code | Status | Notes |
|---|---|---|
| 7.1.1 | verified | `/waves/medium` three synchronised chambers; trigger/pause/step/reset; accessible alternatives; evidence capture. Stage 2 suite green |
| 7.1.2 | verified | `/waves/energy` tagged particles + energy marker; net-displacement ≈ 0 table (invariant 20.2 unit-tested + visible) |
| 7.1.3 | verified | `/waves/types` linked transverse+longitudinal views of one state; probe; mark-period; label toggles; representation trap w/ false-positive regression |
| 7.1.4 | prototype — not verified | EMSpectrumExplorer.tsx exists; unaudited |
| 7.1.5 | verified | `/waves/measure` ruler/timer/probe tools, presets (rope/water/sound/EM), seeded-noise mode, limitation prompt. Audited speed-cap bug is structurally gone (presets fix speed; λ derived) |
| 7.1.6 | verified | v=fλ calculator (all rearrangements, unit-aware, division-guarded, inconsistent-triple rejection), λ vs 1/f trials table + graph + CSV/JSON export, interpretation prompt |
| 7.1.7 | not built | |
| 7.2.1 | prototype — not verified | SoundWaveSimulator.tsx exists; unaudited |
| 7.2.2 | prototype — not verified | SoundPropertiesSimulator.tsx exists; unaudited |
| 7.2.3 | not built | Doppler |
| 7.2.4 | not built | Ear explorer |
| 7.2.5 | deferred | Cultural sound investigation — blocked on Irvin-approved sources |
| 7.2.6 | not built | Ultrasound lab |
| 7.3.1 | not built | Plan matrix: eye pathway (previous COVERAGE.md misnumbered optics here) |
| 7.3.2 | prototype — not verified | Reflection/refraction/absorption/scattering prototypes exist |
| 7.3.3 | prototype — not verified | OpticsLab.tsx exists; unaudited |
| 7.3.4 | not built | Multiwavelength astronomy |
| 7.4.1 | prototype — not verified | KinematicsLab.tsx exists; unaudited |
| 7.4.2 | not built | Motion diagrams |
| 7.4.3 | prototype — not verified | |
| 7.4.4 | not built | Cart investigation (F–m–a) |
| 7.4.5 | prototype — not verified | NewtonsLawsLab.tsx exists; unaudited |
| 7.4.6 | not built | 1D force-vector builder |
| 7.4.7 | not built | Calculations and graphs |
| 7.5.1 | not built | Society argument studio |

## Stages

| Stage | Status |
|---|---|
| 0 — Scope and evidence contract | complete (tagged `stage-0`) |
| 1 — Shared shell and foundations | built — `npm run verify` green (oxlint, tsc, 37 unit, 83 e2e across Chromium+WebKit); awaiting orchestrator gate review |
| 2 — Wave laboratory vertical slice | built — `npm run verify` green (oxlint 0 errors, tsc, 108 unit, 217 e2e passed / 1 skipped across Chromium+WebKit); awaiting orchestrator gate review |
| 3 — Sound module group | not started |
| 4 — Light and vision module group | not started |
| 5 — Motion and force module group | not started |
| 6 — Astronomy/mastery/teacher/progress/offline | not started |
| 7 — Independent release audit | not started |
