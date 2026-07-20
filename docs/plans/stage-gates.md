# Stage acceptance gates

Pass/fail criteria per stage. A stage closes only when every criterion has evidence
(test output, browser walkthrough, or artefact) — never on narration. Orchestrator
independently re-runs `npm run verify` and browser-checks before accepting.

## Stage 1 — Shared shell and foundations

Functional:
- [ ] All shell routes render: `/`, `/glossary`, `/progress`, `/teacher`, `/about` (others absent from nav)
- [ ] Deep link to every route works cold (direct URL), warm (client nav), and on refresh
- [ ] Unknown URL → helpful not-found page with navigation
- [ ] Error boundary catches a thrown route error and offers recovery without full reload
- [ ] Settings persist across reload (audio, reduced motion, low graphics)
- [ ] Progress store: versioned save/load, export JSON, import with sanitisation + size cap, reset-all with confirmation
- [ ] Offline: after first load, kill network → shell + loaded routes still work; SW update prompt appears on new deploy

Accessibility:
- [ ] Keyboard-only: reach and operate every control in the shell; skip link works; focus visible everywhere; focus moves to main heading on route change
- [ ] Landmarks/headings pass axe on every route with zero violations
- [ ] `prefers-reduced-motion` honoured globally; manual toggle overrides
- [ ] 200% zoom usable, no content loss

Responsive: layouts correct at exactly 320, 375, 768, 1024, 1440 px — no horizontal page scroll, no `overflow-x: hidden` masking, no clipped content.

Quality: `npm run verify` green (oxlint, tsc, Vitest, Playwright incl. smoke e2e per route); zero console errors/warnings and zero unhandled rejections on every route; design tokens in place (cyan/violet on navy/off-white, AA contrast).

## Stage 2 — Reference wave-laboratory vertical slice

Learning rhythm — all seven present and functional for the wave concept:
- [ ] Orient (phenomenon + question + learning intention)
- [ ] Learn (concise explanation + worked representation)
- [ ] Explore (manipulate model + "what do you notice" capture)
- [ ] Investigate (variables, trials, table, graph, interpretation, limitations)
- [ ] Check (questions with misconception-specific feedback + progressive hints; invalid/empty/malformed input never scored correct)
- [ ] Explain (claim–evidence–reasoning scaffold, saved as evidence)
- [ ] Connect (application context)

Scientific:
- [ ] Real engine state (no decorative animation): linked transverse + longitudinal views driven by one wave state
- [ ] Tagged particles oscillate about equilibrium; zero net transport over whole cycles (unit-tested invariant + visible check)
- [ ] Measurable amplitude, wavelength, frequency, period, speed with placeable tools
- [ ] v = fλ calculator with all rearrangements + unit conversion (Hz/kHz/MHz/GHz, m/cm/mm/µm/nm); rounding per SCIENCE_REVIEW.md
- [ ] Linked displacement–position and displacement–time graphs, synchronised with animation
- [ ] Amplitude change alters nothing but amplitude (invariant test)
- [ ] Controlled-variable investigation: λ vs 1/f at fixed v, with table, graph, export (CSV/JSON), and limitation prompts
- [ ] Model-limitation notes visible

Teacher/UX:
- [ ] Pause, step, slow-motion, reset, scenario presets; presentation mode enlarges sim + equation
- [ ] Evidence capture lands in progress store; export works

Accessibility:
- [ ] Complete keyboard operation of the whole slice including measurement tools
- [ ] Reduced-motion mode gives static/stepped equivalent; Canvas has live tabular alternative
- [ ] Correctness never colour-only

Quality: every visible control in CONTROL_INVENTORY.md (S2 rows) exercised by a Playwright test; `npm run verify` green; zero console errors; 320–1440 px pass; graceful failure when Canvas/storage unavailable.

## Stages 3–5 — module-group gates (apply to each group)

- [ ] Engine + invariant tests written and green BEFORE UI integration
- [ ] Every new control inventoried and Playwright-exercised; no dead controls
- [ ] Misconception-specific feedback for the group's Check activities; false-positive regression tests
- [ ] Keyboard, reduced-motion, tabular alternatives, fallbacks as per Stage 2 standard
- [ ] Stage-specific science invariants green (see TEST_PLAN.md per group)
- [ ] Full regression: all previous stages' tests still green; zero new console errors
- [ ] COVERAGE.md and IMPLEMENTATION_STATUS.md updated in the same stage
- [ ] Sound group only: Web Audio strictly opt-in, capped, muted default, visual equivalents, denial fallback

## Stage 6 — cross-cutting completion gate

- [x] Mastery bank ≥ 60 validated questions, tagged (outcome/concept/difficulty/representation/misconception), ≥ 1/3 constructed-response; assesses only implemented content
- [x] Teacher tools complete (presentation, show/hide layers, deep-link presets, coverage view, print sheets)
- [x] Progress per outcome (`not attempted`/`developing`/`secure`) from multiple evidence points; anonymous export/print
- [x] Offline hardening: full app usable offline after first load; update flow tested
- [x] ASSET_MANIFEST.md complete; deferred items (7.2.5 cultural module) recorded, absent from nav

## Stage 7 — release audit gate

- [ ] Fresh-context auditor (no build history) runs full suite + manual walkthrough of every control, all viewports, Chrome/Edge/Safari(WebKit)
- [x] All technical release-blocking findings closed with artefacts; known-limitations list written
- [x] Builder/auditor completion matrix signed against COVERAGE.md; anything incomplete removed/hidden
- [ ] Release archive tagged `v1.0.0` + deployable `dist/`

Builder release evidence: `docs/evidence/stage-7-evidence.md`. The unchecked rows
contain human-only real-browser/device walkthrough and tagging work; `dist/` and
an untagged review archive are ready.
