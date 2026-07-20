# WaveMotion Studio — Codex builder handover

> Historical handover completed through the Stage 7 technical audit on 2026-07-20.
> Current release evidence and remaining human-only gates are recorded in
> `docs/evidence/stage-7-evidence.md`; the original instructions below are retained
> as the build-history contract.

You are taking over as the implementation builder for **WaveMotion Studio**, a NSW Year 10
Waves & Motion learning PWA for real classrooms. The project is mid-build under a staged,
gate-driven protocol. Previous stages were built by Claude agents under a Fable 5
orchestrator; you are continuing the same contract. Do not restart or re-architect —
continue the established patterns.

## Project

- **Repo:** `/Volumes/Irvin SSD/1. Data/Teaching - Subjects/Science Simulators/year10-waves-motion-studio`
- **Stack:** React 19 + TypeScript strict + Vite 8 + react-router-dom 7 (HashRouter) +
  Zustand 5 · Vitest + Playwright (Chromium + WebKit, port 4611) + @axe-core/playwright ·
  vite-plugin-pwa. No runtime CDNs, no eval, no analytics, no student data.
- **Gate command:** `npm run verify` (oxlint → tsc -b → vitest → playwright). Must be
  green before any stage is claimed complete. Playwright browsers are already installed.
- **Git:** work on branch `stage-3-wip` (current); merge to `main` only when verify is
  green. `main` is releasable at every commit; stage gates are tagged (`stage-0/1/2` done).
  Commit in logical chunks. Do NOT create tags and do NOT push — the human/orchestrator
  tags gates after independent review.

## Read these before writing any code (they are binding contracts)

1. `docs/plans/stage-gates.md` — per-stage acceptance criteria (definition of done).
2. `SCIENCE_REVIEW.md` — scientific contract: definitions, constants (sourced +
   review-dated), invariants with tolerances, model boundaries, misconception table,
   Web Audio safety contract (§12.5), input ranges. Never invent constants.
3. `IMPLEMENTATION_PLAN.md` — architecture, source structure, engine boundaries
   (`src/science/` is pure TS, React-free), rendering/fallback rules, a11y architecture.
4. `COVERAGE.md` + `CONTROL_INVENTORY.md` + `TEST_PLAN.md` — outcome map, control specs
   (IDs, accessible names, keyboard behaviour), named test cases.
5. `../YEAR_10_WAVES_MOTION_APP_PLAN.md` + `../SCIENCE_SIMULATOR_SUITE_SHARED_SPEC.md`
   — functional and platform specs.
6. Reference implementation: `src/simulations/wave-foundations/` + `src/components/sim/`
   + `src/assessment/` + `src/investigations/` — the verified Stage 2 vertical slice.
   **Match its patterns and quality bar exactly. Reuse its primitives; do not fork them.**

## Current state (verified honest, 2026-07-19)

| Stage | Status |
|---|---|
| 0 — Scope/contracts | ✅ verified, tagged `stage-0` |
| 1 — Shell, tokens, stores, offline PWA, e2e harness | ✅ verified, tagged `stage-1` |
| 2 — Wave-laboratory vertical slice (`/waves`, outcomes 7.1.1/2/3/5/6) | ✅ verified, tagged `stage-2` (108 unit + 217 e2e green, both engines) |
| 3 — Sound group (7.2.1/7.2.2/7.2.3) | 🔶 **WIP on `stage-3-wip` (your first task)** |
| 4 — Light & vision (7.3.1/2/3) | not started |
| 5 — Motion & forces (7.4.1–7.4.7) | not started |
| 6 — Spectrum (7.1.4/7.1.7), hearing (7.2.4), ultrasound (7.2.6), astronomy (7.3.4), society (7.5.1), mastery bank (≥60 q), teacher tools, progress polish, offline hardening | not started |
| 7 — Independent release audit | not started |

**Deferred permanently until the teacher supplies sources:** outcome 7.2.5 (Aboriginal
and/or Torres Strait Islander sound-material investigation). NEVER generate cultural
content; it stays absent from navigation with the deferral recorded in COVERAGE.md.

### Stage 3 WIP — exact state (commit `4011c04`)

Done (uncommitted work now committed on `stage-3-wip`):
- `src/science/sound.ts`, `src/science/doppler.ts` — engines; `src/science/constants.ts` extended
- `tests/unit/invariants/sound.test.ts`, `doppler.test.ts` — invariant tests
- `src/assessment/soundQuestions.ts` — sound question bank
- `src/simulations/sound/` — partial UI pages

**Known broken (fix first):**
- `src/simulations/sound/DopplerPage.tsx:23` imports non-existent `./constants` → the
  constant belongs in `src/science/sound.ts` or `src/science/constants.ts` (that was the
  in-flight fix when the previous builder was interrupted)
- `src/simulations/sound/DopplerPage.tsx:20` unused `observerStart` (tsc error under strict)

**Remaining for Stage 3:** finish the `/sound` workspace UI (compression/rarefaction
four-linked-representations page, pitch/loudness investigation with opt-in capped Web
Audio per SCIENCE_REVIEW §12.5, Doppler page), Check/Explain/Connect phases wired to the
assessment framework + progress store, learning-map card un-badged + `/sound` in nav,
`tests/e2e/sound.spec.ts` + extension of a11y/console/responsive/keyboard suites to the
new routes, CONTROL_INVENTORY as-built notes, honest COVERAGE/IMPLEMENTATION_STATUS
updates, full regression, `npm run verify` green. Then merge `stage-3-wip` → `main`.

## Working method (per stage)

1. Engine + invariant tests first, UI second, content/assessment third, e2e last.
2. One stage at a time. After each stage: update COVERAGE.md, IMPLEMENTATION_STATUS.md,
   CONTROL_INVENTORY.md honestly (use status "verified (builder)" — plain "verified" is
   applied after independent review); write a stage evidence pack (files changed, exact
   verify counts, each gate checkbox with how verified, divergences stated plainly);
   pause for human review before the next stage.
3. Full regression every stage: all previous tests stay green.

## Non-negotiable rules (from the specs — the previous failed build ignored these)

- Australian English. **Light theme** (the teacher dislikes dark mode) using existing tokens.
- No dead controls, no placeholders, no "under construction" routes, no decorative
  animation labelled as simulation. Unbuilt workspaces stay as non-interactive
  "In development" cards on the learning map.
- Particles never travel with the wave; amplitude never changes f or v; source frequency
  never changes because it moves; invalid/empty/malformed input never scores correct.
- No colour-only meaning; full keyboard operation (SimControl pattern: arrows fine,
  PageUp/Down coarse, Home/End bounds); every Canvas scene has a live text alternative +
  canvas-unsupported fallback; reduced-motion = stepped frames, no autoplay.
- Web Audio: only after explicit "Enable sound" click, capped gain, muted default,
  headphone warning, visual equivalents, graceful denial fallback.
- No `overflow-x: hidden` masking; responsive 320/375/768/1024/1440 with no horizontal
  document scroll.
- Never claim a stage complete from appearance — evidence (test output) over narration.

## Environment notes

- The repo lives on an external SSD: check `/Volumes/Irvin SSD` is mounted. macOS
  creates `._*` AppleDouble sidecar files there — vitest/playwright configs already
  ignore them; never treat them as sources.
- E2e runs against the production build on port **4611** (`playwright.config.ts`);
  don't change the port (other Vite projects use 4173 on this machine).
- Commit messages end with a `Co-Authored-By:` trailer identifying the generating agent.

## First actions

1. `cd` into the repo, confirm branch `stage-3-wip`, run `npx tsc --noEmit -p tsconfig.app.json`
   to see the two known errors; fix them.
2. Read the contract docs above.
3. Complete Stage 3 as specified; verify green; merge to main; produce the evidence pack;
   stop for human review before Stage 4.
