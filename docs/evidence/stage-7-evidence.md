# Stage 7 release-audit evidence

Date: 2026-07-20 (Australia/Sydney)  
Builder/orchestrator: Sol  
Audited branch: `main`
Final technical commit before this evidence update: `2b7b33bb6283ee585c6bbe6571ad18e08fbc2086`

## Verdict

The builder release candidate is technically complete and the automated release gate is green.
The original release-audit findings and the subsequent targeted control, fallback, lifecycle and
performance gaps are closed by executable evidence. Release promotion is still waiting on the
explicitly human-only science, real-device/browser and tag approvals listed below. No `v1.0.0`
tag was created and nothing was pushed.

## Final automated gate

`npm run verify` completed successfully after technical commit `2b7b33b` and the evidence-plan
reconciliation:

- oxlint: 0 errors; four existing non-blocking React/Fast Refresh warnings;
- TypeScript project build: clean;
- Vitest: 21 files, **206/206 tests passed**;
- Playwright: **663 passed, 3 expected skips** from 666 cases across bundled Chromium and
  WebKit (Chromium 333 passed; WebKit 330 passed and 3 expected skips: two service-worker
  offline-emulation cases and the Chromium-protocol-only forced-GC heap sample);
- production build: successful, with the known main-chunk size advisory.

A supplemental full run against the installed branded Google Chrome completed all **333/333**
cases successfully. The channel runner did not self-terminate after completing its dots, so it
was interrupted after the result summary appeared; the clean-exit default Chromium/WebKit
`npm run verify` result above remains the authoritative aggregate gate.

The WebKit service-worker-registration notice assertion exposed a listener-attachment race on an
earlier full run. Commit `e9f0cec` changed the deterministic test to retry the event until the
listener is ready. The changed case then passed **10/10** repeated WebKit runs before the final
full green gate.

## Fresh-audit closure

| Finding | Closure evidence |
|---|---|
| Global Enable sound preference was not a real master control | Persisted master opt-out now prevents activity audio, immediately mutes enabled audio, and preserves visual equivalents; Chromium and WebKit tests pass. |
| Teacher coverage was ambiguous/incomplete | Typed release registry separates release scope, verification state, activity and all implementation routes; registry unit tests and Teacher Coverage UI checks pass. |
| Mastery omitted active outcomes | The session contains exactly 24 questions, one per active outcome, covers all six strands, alternates objective/constructed modes and excludes deferred 7.2.5. |
| Deferred content remained learner-facing | Home, Progress, About and Mastery omit the deferral; the route is absent; only Teacher Coverage and project documentation retain the audit record. |
| Teacher particle/trail layers were coupled | Canvas scenes carry a single semantic particles/vectors/trails tag; all seven layers independently affect real activity content and Canvas alternatives remain visible. |
| Native controls could fall below 44 px | Text inputs, selects and textareas have a 44 px minimum; every released route is swept at 320 px, alongside representative slider/button checks. |
| Inventory and test plan overclaimed coverage | Runtime IDs are swept across all 48 released routes in both engines; documentation now points only to real specs and states the precise scope of automated assertions. |
| Some button/form controls could escape the inventory through missing IDs | The parity test now rejects any button, input, select, textarea or summary without an inventoried ID or ancestor group; all 49 route/deferred checks pass in both engines. |
| Storage denial and first-load OS reduced motion were not directly tested | `settings.spec.ts` forces localStorage quota/permission failures and proves the visible memory-only fallback; a separate first-load reduced-motion case proves no autoplay, manual stepping and the persisted override. |
| Print and destructive confirmation invocation coverage was incomplete | `release-controls.spec.ts` verifies all six print surfaces across the release (five there plus optics), cancel/accept behavior for motion/force resets, and exact-scope Teacher module/all resets. |
| Tablet touch coverage was viewport-only | Touch-enabled portrait and landscape tablet contexts tap representative learning and settings controls and assert their observable effects without horizontal clipping. |
| Performance, heap and animation lifecycle had no executable release budget | The production payload, useful-interaction, frame-rate, forced-GC route-churn and high-DPR Canvas budgets pass; unit lifecycle tests prove animation/listener/observer cleanup across repeated mounts. |
| Offline/update failure coverage was partial | Chromium reloads every released route offline after one production first load; update actions and visible registration-failure fallback are deterministic tests. |
| Release identity/deployment paths were stale | Package/app version is 1.0.0; Vite assets, PWA scope and start URL are relative for subdirectory/static deployment. |
| Learner/release copy was stale | About, privacy, audio, mastery, collision and README copy now match shipped behavior and scope. |

Final closure record:

- Terra and Luna independently returned **PASS** on the original release audit at `4ff0f38`;
- commit `e9f0cec` then changed only the flaky WebKit event assertion described above;
- later targeted audits identified the additional test-evidence gaps listed above; technical
  commit `2b7b33b` and this evidence reconciliation close them without changing curriculum scope.

## Completion matrix against `COVERAGE.md`

| Outcome | Release state | Shipped route(s) / disposition |
|---|---|---|
| 7.1.1 | active, complete | `/waves/medium` |
| 7.1.2 | active, complete | `/waves/energy` |
| 7.1.3 | active, complete | `/waves/types` |
| 7.1.4 | active, complete | `/spectrum` |
| 7.1.5 | active, complete | `/waves/measure` |
| 7.1.6 | active, complete | `/waves/measure` |
| 7.1.7 | active, complete | `/spectrum` |
| 7.2.1 | active, complete | `/sound/compression` |
| 7.2.2 | active, complete | `/sound/pitch-loudness` |
| 7.2.3 | active, complete | `/sound/doppler` |
| 7.2.4 | active, complete | `/hearing` |
| 7.2.5 | deferred, not shipped | No learner route, navigation, card or mastery item; teacher/docs audit record only. |
| 7.2.6 | active, complete | `/ultrasound` |
| 7.3.1 | active, complete | `/vision` |
| 7.3.2 | active, complete | `/light/properties` |
| 7.3.3 | active, complete | `/light/applications` |
| 7.3.4 | active, complete | `/astronomy` |
| 7.4.1 | active, complete | `/motion/track`, `/motion/graphs` |
| 7.4.2 | active, complete | `/motion/diagrams` |
| 7.4.3 | active, complete | `/motion/graphs` |
| 7.4.4 | active, complete | `/forces/cart` |
| 7.4.5 | active, complete | `/forces/applications` |
| 7.4.6 | active, complete | `/forces/vectors` |
| 7.4.7 | active, complete | `/forces/calculations`, `/forces/cart`, `/motion/graphs` |
| 7.5.1 | active, complete | `/society` |

Technical completion assertion: Sol, 2026-07-20. The 24 active outcomes are shipped; the sole
incomplete outcome is explicitly deferred and hidden from learner release surfaces.

## Production artefacts

- `dist/`: 10 deployable files after removing regenerable AppleDouble metadata; relative asset
  paths, manifest `start_url` and manifest `scope` verified.
- Largest files: main JS 693,603 bytes; CSS 35,174 bytes; Workbox runtime 15,026 bytes.
- Review archive: `release/wavemotion-studio-v1.0.0-review.zip`, 11 ZIP entries including the
  assets directory, 756,900 uncompressed bytes, AppleDouble excluded.
- SHA-256: `50fdc068bb513885cbc773bb6a162be55bfce43d7c4bce1dd5ecf1ef7521449f`.

The archive is a builder review artefact, not a tagged release.

## Human-only promotion gates and known limitations

- Irvin must complete and sign the scientific-content checklist in `SCIENCE_REVIEW.md`.
- Exhaustive manual every-control walkthrough on real Chrome, Edge and Safari, including a
  physical laptop and tablet, remains pending. Chrome and Safari received representative GUI
  smoke checks; Microsoft Edge was not installed on the audit machine.
- Installed-PWA two-build update behavior, physical audio output/headphone safety, browser-native
  print/confirmation dialog appearance/focus and physical touch behavior still require human
  sampling. Their application-side invocation and cancel/accept effects are automated.
- The human/orchestrator must decide whether to create `v1.0.0`; the builder did not tag or push.
- WebKit cannot use Playwright's Chromium network-offline emulation, so its two service-worker
  offline cases remain explicit expected skips; the rest of the WebKit suite is green.
- Production payload, sampled interaction/frame-rate, Chromium heap-growth and repeated-mount
  lifecycle budgets are automated. Physical low-end-device thermal throttling and installed-PWA
  multi-hour soak behavior remain manual follow-up items.
- Vite reports a non-failing main-chunk size advisory (693,603-byte minified JS). Code splitting
  is a future optimisation, not a correctness blocker for this static offline release.
