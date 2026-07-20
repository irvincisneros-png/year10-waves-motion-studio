# Stage 6 implementation plan — completion and cross-cutting gate

Date: 2026-07-20 (Australia/Sydney)

Branch: `stage-6-wip`, based on merged Stage 5 main commit `945c99e`

Authority: `docs/plans/stage-gates.md`, `IMPLEMENTATION_PLAN.md` §11,
`SCIENCE_REVIEW.md`, `CONTROL_INVENTORY.md`, `TEST_PLAN.md` and the canonical
outcomes in `src/content/outcomes.ts`.

## Scope and honest deferral

Stage 6 closes the remaining buildable content outcomes:

- 7.1.4 and 7.1.7 — continuous EM spectrum comparison and secondary-source
  application analysis at `/spectrum`.
- 7.2.4 — non-diagnostic ear response pathway at `/hearing`.
- 7.2.6 — synthetic pulse-echo medical-ultrasound model at `/ultrasound`.
- 7.3.4 — curated multiwavelength and stellar-spectrum evidence at
  `/astronomy`.
- 7.5.1 — sourced waves-and-motion argument studio at `/society`.

Outcome 7.2.5 remains `deferred`: Irvin has not supplied or approved attributable,
community-specific sources. No cultural content, generic substitute, route or
navigation control will be generated. The deferral must be explicit in coverage,
the asset manifest and release limitations.

Stage 6 also closes the cross-cutting gate: ≥60-question tagged mastery bank with
≥1/3 constructed response, complete teacher tools, evidence-derived progress,
anonymous export/print, whole-app offline operation/update prompt testing and a
complete asset manifest.

## Foundation package — registry and evidence integrity

- [x] Add one typed release registry for active/deferred outcomes, routes and
  activities; use it for progress, mastery eligibility and teacher coverage.
- [x] Migrate progress to schema v2 before adding Stage 6 evidence producers.
  Store stable evidence keys/results, derive levels from evidence and prevent
  imports or direct setters from manufacturing `secure`.
- [x] Keep full local backups distinct from anonymous JSON/CSV/print summaries;
  anonymous artefacts contain no written text, generated IDs or timestamps.

## Package A — pure science and curated content

- [x] Add React-free EM spectrum, hearing, ultrasound and astronomy engines/data.
- [x] Preserve `c = 3.00 × 10⁸ m/s`; spectrum bands are continuous on a log axis,
  approximate/overlapping and never described as seven exact boxes.
- [x] Keep ionising distinct from radioactive and risk dependent on exposure,
  interaction and dose—not frequency alone.
- [x] Model ear response as mechanical → fluid → electrical signal with a
  simplified frequency-place map and no diagnosis.
- [x] Calculate pulse-echo depth as `speed × round-trip time / 2`; synthetic
  phantoms only; qualitative resolution/penetration trade-off.
- [x] Use only curated stellar lines already recorded in `SCIENCE_REVIEW.md`;
  line identification must fail honestly outside tolerance. Red/blueshift keeps
  sign and direction text paired.
- [x] Add ≥50-case deterministic invariant sweeps plus boundary/false-positive
  tests before UI integration.
- [x] Add typed, sourced society evidence packs with benefits, limitations,
  affected groups, historical change, quantitative evidence and competing
  considerations.

## Package B — learner routes and mastery

- [x] Implement `/spectrum`, `/hearing`, `/ultrasound`, `/astronomy` and
  `/society` with semantic SVG/CSS plus always-present text/table alternatives.
- [x] Inventory every as-built control with unique IDs and exercise each control
  in Chromium and WebKit. No autoplay, decorative simulation or dead control.
- [x] Provide non-empty evidence capture for each outcome; society export needs a
  contention, criterion, sourced evidence, CER, counterclaim, proportional
  conclusion and bibliography.
- [x] Expose the five routes in the learning map/nav only when real; keep the
  deferred cultural route absent and 404.
- [x] Expand the typed assessment model for constructed responses with explicit
  completeness/concept validation and no empty/malformed false positives.
- [x] Build `/mastery` over a schema-validated bank of at least 60 questions,
  tagged by outcome/concept/difficulty/representation/misconception, assessing
  only implemented outcomes; at least one third are constructed response.
- [x] Mastery provides three progressive hints, retry, keyboard-complete answer
  paths and records attempts as evidence without claiming secure from one point.

## Package C — teacher, progress, offline and assets

- [x] Derive `not attempted`/`developing`/`secure` from evidence: secure requires
  multiple distinct evidence points. Imports cannot manufacture secure status
  without supporting evidence.
- [x] Progress provides anonymous JSON and CSV export, a print view, evidence
  counts/sources and sanitised versioned import/reset.
- [x] Teacher tools provide presentation mode, effective show/hide layers,
  student-data-free deep-link presets, an outcome coverage view, misconception
  prompts, suggested questions and printable investigation/report sheets.
- [x] Teacher reset-module and reset-all paths are confirmed, scoped and tested;
  export/import delegates to the same safe progress schema.
- [x] Whole production app is available offline after first load; every shipped
  route reloads without network in Chromium. WebKit's service-worker exclusion
  remains an explicit expected skip, not a hidden pass.
- [x] Test the visible service-worker update prompt (refresh/defer actions) and
  confirm no unexpected external runtime requests.
- [x] Complete `ASSET_MANIFEST.md` for PWA icons and every informative/decorative
  code-native visual, with provenance, alt decision and review state.

## Stage gate and evidence

- [x] Shared axe, console, keyboard, responsive and route matrices include every
  new route at 320, 375, 768, 1024 and 1440 px in Chromium and WebKit.
- [x] `npm run verify` exits 0 after all earlier-stage regressions.
- [x] Production build succeeds and deployable `dist/` is inspected.
- [x] Update `COVERAGE.md`, `IMPLEMENTATION_STATUS.md`, `CONTROL_INVENTORY.md`,
  `SCIENCE_REVIEW.md`, `TEST_PLAN.md`, `ASSET_MANIFEST.md` and README/status text.
- [x] Write `docs/evidence/stage-6-evidence.md` with exact counts, gate mapping,
  divergences, source/deferral statement and known limitations.
- [ ] Merge `stage-6-wip` to `main` only after the complete gate is green. Do not
  tag or push; those remain human review actions.

Stage 7 begins only after Stage 6 has a clean merge and evidence pack.
