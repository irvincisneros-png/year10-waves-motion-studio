# WaveMotion Studio — Orchestrated Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver WaveMotion Studio — the NSW Year 10 Waves & Motion learning application — through the shared-spec staged protocol, with Fable 5 as orchestrator/architect and Opus/Sonnet subagents as builders.

**Architecture:** Static-first PWA. TypeScript strict + React 19 + Vite + Zustand, deterministic science engines fully separated from render state, SVG/Canvas for exact diagrams, Web Audio opt-in only, Vitest unit/invariant tests + Playwright browser tests, service-worker offline shell. One orchestrator owns architecture and integration; each stage is a fresh bounded builder task.

**Tech Stack:** TypeScript (strict), React 19, Vite 8, react-router-dom 7, Zustand 5, Vitest 4, Playwright 1.61, vite-plugin-pwa, oxlint. No runtime CDNs. Australian English throughout.

## Global Constraints (verbatim from specs)

- "Scientific accuracy, student learning, accessibility, and verified interaction take priority over visual spectacle."
- "Never leave a visible button, link, slider, input, checkbox, tab, drag target, or menu item without a tested effect."
- "Do not ship 'under construction' routes." Deferred routes must not appear at all.
- "Do not show medium particles travelling with a wave when the model intends local oscillation."
- "Do not imply that changing amplitude changes frequency or wave speed in the basic linear model."
- "Do not accept malformed, empty, dimensionally invalid, or out-of-scope answers as correct." No silent coercion.
- "Do not communicate correctness through colour alone."
- "Audio must be optional, safely limited, and accompanied by equivalent visual information." Default muted.
- "Do not hide responsive defects with `overflow-x: hidden`."
- "Test through a local HTTP server, not only by opening a `file://` page."
- "Preserve Australian English."
- WCAG 2.2 AA; full keyboard operation; `prefers-reduced-motion` honoured; 44×44 px targets; 320–1440 px responsive.
- Privacy: no login, no analytics, no student data; versioned localStorage/IndexedDB only; no `eval`.
- Design accent: "electric cyan + spectral violet" on deep navy/charcoal + warm off-white foundation.
- Curriculum authority: `/Users/irvincisneros/Library/Mobile Documents/com~apple~CloudDocs/Claude/Teaching - Subjects/Year 9 Materials/NSW Junior Science Syllabus.docx` — exact outcome wording, never paraphrased where exact wording is required.
- Workspace: `/Volumes/Irvin SSD/1. Data/Teaching - Subjects/Science Simulators/year10-waves-motion-studio` (existing dir retained; handover's proposed `year-10-waves-motion` superseded — see Audit Findings).
- Aboriginal and Torres Strait Islander content (outcome 7.2.5): sources must be supplied/approved by Irvin; agents must never generate cultural content, names, designs, or stories.

---

## Part A — Audit findings (2026-07-17, pre-plan inspection)

The workspace already contains `year10-waves-motion-studio` (React/Vite scaffold + prototype sims + a built `dist/`). Verified state:

| Claim (existing docs) | Verified reality |
|---|---|
| IMPLEMENTATION_STATUS.md: ~19 outcomes `implemented` | 23 source files, 2,564 lines total for a 10-workspace app — prototype depth only |
| Same file: Phase 1 `in progress`, Phase 2+ `not started` | Internally contradicts the outcome claims above |
| COVERAGE.md maps outcomes | Uses outcome numbers (7.3.5, 7.5.2, 7.5.3) that do not exist in YEAR_10_WAVES_MOTION_APP_PLAN.md; exact syllabus wording never extracted |
| Test suite | 8 unit tests, **1 failing** (units.test.ts floating-point `500e-9` equality); `tests/e2e/` is **empty** despite Playwright installed |
| README.md | Untouched Vite template boilerplate (spec requires real README) |
| Version control | **No git repo** |
| Component quality (sampled WaveMeasurementLab.tsx) | Real Canvas render + `v=fλ` + trial table, but: preset "Sound (Water)" sets 1500 m/s on a slider capped at 1000 (broken control); no keyboard access to measurement; no unit conversion; no learning rhythm (Orient→Connect); no assessment; no reduced-motion; no fallbacks |

**Verdict:** the existing build is a useful *prototype/scaffold*, not a partially-complete product. Its completion claims must be discarded.

**Salvage decision (recommended):** keep the repository directory, tooling config (package.json, tsconfig, vite/PWA config, oxlint), and route skeleton. Treat every existing simulation component as an untrusted prototype to be replaced stage-by-stage. Rewrite the status/coverage docs from scratch with honest values. Git-init immediately so all subsequent work is commit-tracked.

## Part B — Improvements to the handover proposal (adopted)

1. **Brownfield, not greenfield.** The handover assumes an empty workspace. Stage 0 now begins with reconciling the false status claims and formally demoting the existing code to prototype status (Task 1).
2. **Subagent orchestration model made explicit** (reconciles the handover's "no large-scale parallel write delegation" with Irvin's instruction to build with Opus/Sonnet subagents):
   - **Fable (orchestrator, this session):** architecture, task specs, integration, science sign-off review, independent verification, stage evidence packs, final audit. Retains sole architectural ownership per the shared spec.
   - **Opus builders:** one fresh bounded task per stage (or per module within Stages 3–6): science engines, vertical slice, complex integration. Maps to the spec's "Sol/Terra" roles.
   - **Sonnet workers:** tightly specified supporting tasks — content/data schemas, question-bank entry from approved templates, control-inventory generation, test-case expansion, accessibility attribute scans, docx outcome extraction. Maps to "Luna" (never sole owner of a stage or scientific sign-off).
   - **Write-parallelism rule:** at most one builder writes app code at a time per file area; parallel dispatch only for disjoint deliverables (e.g. content JSON vs engine code vs docs). Orchestrator merges and reviews everything.
3. **Trust-but-verify gate.** The previous build failed because narration was trusted. Every builder must return the shared-spec evidence pack, and the orchestrator independently re-runs `npm run verify` AND exercises the app in a real browser (local HTTP server via the Browser pane) before accepting any stage. No stage closes on agent narration.
4. **Single verification command.** Add `npm run verify` = oxlint + `tsc -b` + `vitest run` + `playwright test`. Builders run it before reporting; orchestrator re-runs it after merging.
5. **Git from day one.** Init repo, commit per task, tag per stage gate (`stage-0`, `stage-1`, …). The handover never mentions version control; without it, subagent handoffs and rollback are unsafe.
6. **Canonical outcomes file.** Extract exact syllabus wording from the .docx **once** into `src/content/outcomes.ts` (+ human-readable copy in COVERAGE.md). Subagents never re-parse the docx, eliminating drift and paraphrase risk.
7. **Stage splitting for context limits.** Stages 3–6 are too large for one subagent context. Each is split into 2–3 bounded work packages (engine+tests first, then UI+integration, then content/assessment), each with its own mini-gate, while the stage-level exit gate stays as specified.
8. **Image generation deferred.** The shared spec's Gemini image endpoints/Antigravity are not available in this environment. Adopt an SVG-first art direction for launch; generated raster heroes become an optional post-release enhancement with the spec's asset-manifest rules. Nothing scientific was ever allowed to be raster anyway.
9. **Cultural module (7.2.5) explicitly gated on Irvin.** Scheduled in Stage 6, and blocked until Irvin supplies/approves attributable community-specific sources. A deferral note in COVERAGE.md is the honest fallback if sources aren't ready — better than agent-invented cultural content, which is prohibited.
10. **Per-stage detailed plans.** This document fixes the roadmap, orchestration rules, and Stage 0 tasks in full detail. At each stage boundary the orchestrator writes the next stage's detailed TDD plan (bite-sized tasks with code) as `docs/plans/stage-N-plan.md`, informed by what the previous stage actually produced — matching the spec's "start a fresh, bounded implementation task for each approved stage".
11. **Knowledge vault runbook.** The vault's Science Simulators note describes the older iCloud "Sim Hub", not this SSD suite. Create a dedicated `Subjects - WaveMotion Studio` runbook after Stage 1 and keep it updated per vault conventions.

## Part C — Stage roadmap and model allocation

| Stage | Content | Builder | Gate (summary) |
|---|---|---|---|
| 0 | Scope + evidence contract (docs, outcomes, contracts, gates) | Fable + Sonnet (docx extraction, inventories) | Irvin approves scope, deferrals, decisions |
| 1 | Shell + foundations (nav, tokens, a11y primitives, persistence, offline, test harness) | Opus | Keyboard, deep-links, 320–1440 px, offline shell, smoke tests pass; verified by Fable in browser |
| 2 | Reference wave-laboratory vertical slice (full Orient→Connect rhythm) | Opus | All slice gates incl. science invariants, keyboard-only run, reduced motion, evidence export |
| 3 | Sound group (compression/rarefaction, pitch/loudness, Doppler, Web Audio safety) | Opus (engine) + Sonnet (content/questions) | Stage gate + regression of slice |
| 4 | Light & vision group (reflection, refraction, absorption/scattering, eye) | Opus + Sonnet | Stage gate + regression |
| 5 | Motion & force group (track lab, motion diagrams, graphs, force studio, cart investigation) | Opus + Sonnet | Stage gate + regression |
| 6 | Astronomy, ear/ultrasound, cultural (gated on Irvin's sources), society argument studio, mastery, teacher tools, progress/export, offline hardening | Opus + Sonnet, split into 3 packages | Stage gate; cultural review by Irvin |
| 7 | Independent release audit | Fresh Opus auditor (no prior context) + Fable | All release-blocking findings closed with artefacts |

**Pause for Irvin's approval after every stage** (per handover). Initial classroom release target = Stages 0–2 plus the sound-introduction portion of Stage 3, exactly as the handover's §3 recommends; everything else is explicitly deferred and hidden from navigation until built.

---

## Part D — Stage 0 tasks (next work package, on approval)

### Task 1: Git baseline and honest status reset

**Files:**
- Create: `.git` (init), `README.md` (rewrite), `docs/AUDIT_2026-07-17.md`
- Modify: `IMPLEMENTATION_STATUS.md` (all outcome rows → `prototype — not verified`; phases reset)

- [ ] **Step 1:** `git init && git add -A && git commit -m "chore: baseline — pre-existing prototype state as found"` (commit BEFORE any edits so the found-state is preserved; ensure `.gitignore` covers `node_modules/`, `dist/`, `._*` AppleDouble files)
- [ ] **Step 2:** Write `docs/AUDIT_2026-07-17.md` containing the Part A findings table verbatim.
- [ ] **Step 3:** Reset `IMPLEMENTATION_STATUS.md`: every outcome → `prototype — not verified`; Phase 1 `in progress`; add header note pointing to the audit.
- [ ] **Step 4:** Replace boilerplate `README.md` with real setup/scripts/browsers/privacy sections (spec deliverable 3).
- [ ] **Step 5:** Fix the failing unit test using `toBeCloseTo`/epsilon comparison so the suite is green before any new work: in `tests/unit/units.test.ts` replace exact equality on `toMeters(500, 'nm')` with `expect(toMeters(500, 'nm')).toBeCloseTo(500e-9, 15)`.
- [ ] **Step 6:** `npx vitest run` → expect 8/8 pass. Commit.

### Task 2: Canonical outcome extraction (Sonnet)

**Files:**
- Create: `src/content/outcomes.ts`, scratch extraction notes
- Consumes: NSW Junior Science Syllabus.docx (path in Global Constraints)
- Produces: `export const outcomeMap: Record<string, {code: string; text: string; strand: string}>` — exact syllabus wording for every Year 10 Waves & Motion outcome (7.1.1–7.5.1 per the app plan numbering)

- [ ] **Step 1:** Extract the Waves & Motion outcome statements verbatim from the .docx (python-docx or pandoc; no paraphrase).
- [ ] **Step 2:** Reconcile numbering against `YEAR_10_WAVES_MOTION_APP_PLAN.md` §3 (the existing COVERAGE.md invented numbers — flag every mismatch rather than silently renumbering).
- [ ] **Step 3:** Write `src/content/outcomes.ts` with the verbatim text + a Vitest schema test asserting every plan-matrix outcome code exists exactly once.
- [ ] **Step 4:** Orchestrator spot-checks 5 outcomes against the docx directly. Commit.

### Task 3: Rebuild COVERAGE.md (coverage map)

**Files:** Rewrite `COVERAGE.md`

- [ ] Map every outcome → route/workspace, teaching content, interaction/simulation, representation (data/diagram/equation/graph), student task, assessable evidence, misconception addressed, model limitation, implementation stage — per handover §2. Status column starts `not built` for all (prototype code doesn't count until verified). Commit.

### Task 4: SCIENCE_REVIEW.md (scientific contracts)

**Files:** Rewrite `SCIENCE_REVIEW.md`

- [ ] Document every contract listed in handover §4: definitions/units, `v = fλ` + rearrangements, conversion/rounding rules, displacement conventions, oscillation-vs-propagation distinction, medium presets (343 m/s dry air ≈20 °C reference), invariants, refraction constant-frequency boundary rule, sound/pitch/loudness/Doppler/ultrasound boundaries, Web Audio safety, ray/wave model limits, eye/spectra boundaries, kinematics sign conventions + gradient/area rules, force/Newtonian assumptions, deterministic ideal mode + seeded noise mode, input ranges, edge cases, misconceptions, safety notes, accessibility alternatives, Canvas/WebGL/WebAudio/storage fallbacks. Include sources + review dates for all constants. Commit.

### Task 5: IMPLEMENTATION_PLAN.md, CONTROL_INVENTORY.md, TEST_PLAN.md

**Files:** Create all three in project root (per handover §5)

- [ ] **IMPLEMENTATION_PLAN.md:** stack rationale (keep current stack — matches shared-spec recommendation), modular structure (existing `src/` layout matches spec's suggested tree), route structure (only the 10 shared global routes + workspaces actually planned for release), state/persistence design (Zustand + versioned localStorage schema), science-engine boundaries (pure TS modules in `src/science/`, no React imports), unit/equation/graph/vector contracts, SVG/Canvas/WebAudio responsibilities + fallbacks, accessibility architecture, offline strategy, SVG-first asset strategy, build/deploy, stage order, risks.
- [ ] **CONTROL_INVENTORY.md:** every planned control for release scope with effect, accessible name, keyboard behaviour, units/value display, reset, error handling, fallback, browser-test requirement.
- [ ] **TEST_PLAN.md:** every category from handover §5 (invariants, rearrangements, malformed inputs, a11y, keyboard-only, routes/deep-links, 320/375/768/1024/1440 px, Chrome/Edge/Safari, offline, degraded-capability fallbacks, console errors, every visible control, false-positive assessment regression, deterministic + seeded reproducibility, performance/memory).
- [ ] Add `verify` script to package.json: `"verify": "oxlint && tsc -b && vitest run && playwright test"`. Commit.

### Task 6: Stage 1 & Stage 2 acceptance gates + evidence pack

- [ ] Write `docs/plans/stage-gates.md` with precise, checkable Stage 1 and Stage 2 acceptance criteria (handover §6 list verbatim, expanded into pass/fail checks).
- [ ] Assemble the Stage 0 evidence pack (handover's 11-point list) and present to Irvin for approval. **STOP — do not begin Stage 1 without explicit approval.**

---

## Part E — Decisions requiring Irvin's approval

1. **Salvage the existing repo as scaffold** (recommended) vs. greenfield rebuild.
2. **Initial release scope** = handover §3 list (shell, learning map, wave laboratory, `v=fλ` + conversions, linked graphs, intro sound, basic progress/evidence); everything else deferred and hidden.
3. **SVG-first art, generated raster heroes deferred** (recommended — no image endpoint available).
4. **Cultural module 7.2.5** built only when Irvin supplies approved sources; otherwise shipped as a documented deferral.
5. **Approve Stage 0 execution** with the orchestration model in Part B.
