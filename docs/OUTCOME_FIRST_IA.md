# WaveMotion Studio — Outcome-first Information Architecture

**Status:** binding companion to `docs/PRODUCT_VISION.md`  
**Effective:** 2026-07-22

This architecture replaces the workspace learning map, mandatory learning-phase
routes and large primary navigation wherever they conflict with the corrected
simulator-first direction. Existing routes and scientific engines are preserved
non-destructively during the prototype, but they do not define the new learner
experience.

## 1. Canonical route model

| Route | Learner purpose | Requirement |
|---|---|---|
| `/` | Outcome simulator gallery | One launchable card per active outcome |
| `/simulators/:outcomeCode` | Direct outcome simulator | One canonical route per active code |
| `/progress` | Optional local progress | Secondary utility, never a prerequisite |
| `/glossary` | Optional reference | Secondary utility or outcome drawer |
| `/teacher` | Optional teacher layer | Outside primary student navigation |
| `/about` | Sources, accessibility, privacy and product information | Secondary utility |

The active route parameter must match a code in `src/content/outcomes.ts` and the
active release registry. A deferred or unknown code must not render a simulated
placeholder. It must resolve to the honest not-found/deferred handling without a
learner launcher.

Sandbox and challenge states should be modes inside the same canonical outcome
route, not separate course-phase destinations. A deep link may serialise a safe
mode or teacher preset, but the base route must always open a usable simulator.

## 2. Outcome simulator gallery

The gallery is the primary and default student destination.

- It must render exactly 24 launchable cards while 7.2.5 remains deferred.
- Outcome 7.2.5 must be absent from the learner gallery, search/filter results,
  challenges and generated assets. Its deferral remains documented in teacher
  coverage and repository records only.
- Each card must represent exactly one outcome and show:
  - the outcome code;
  - the exact syllabus wording from `outcomeMap`;
  - one concise invitation describing what the student can manipulate; and
  - one unambiguous launch action.
- Cards may be grouped or filtered by strand, but a strand or workspace must not
  replace the outcome card as the launch unit.
- Availability, status, progress or mastery may be shown only when they do not
  obscure the outcome identity or imply a required sequence.
- The gallery must not contain unlaunchable “in development” cards. Incomplete or
  deferred outcomes stay out of learner release surfaces.

Gallery acceptance is governed by **PV-02**, **PV-03**, **PV-04**, **PV-08** and
**A11Y-07**.

## 3. Minimal student navigation

The persistent student shell must prioritise:

1. the WaveMotion Studio identity/back-to-gallery action;
2. the current outcome code and context when inside a simulator; and
3. settings and optional help.

Progress, Glossary, About and Teacher may remain in a clearly secondary utility
menu or teacher surface. They must not recreate the current 17-link primary
navigation. Workspace hubs, Mastery, Learn, Investigate, Check, Explain and
Connect must not appear as primary learner destinations.

Navigating between outcomes should return to the gallery or use a compact outcome
picker. It must not require traversal through strand hubs or course phases.

## 4. Canonical simulator page

Each `/simulators/:outcomeCode` page uses this order:

1. **Compact outcome header** — back to gallery, code, exact wording, Settings and
   optional Help.
2. **Interactive scientific world** — dominant stage, immediate primary action,
   live state and feedback.
3. **Compact control and challenge layer** — scientifically meaningful controls,
   objective, progress/score and reset/replay.
4. **Optional support drawers** — short onboarding, How it works, data/text
   alternative, model limitations, sources and teacher resources.

The header and support layers must not crowd the stage. On desktop/tablet, the
world is the largest region above the fold. On mobile, the world and primary
action precede long text or evidence controls. Optional drawers must preserve
focus, keyboard order and reduced-motion behaviour.

The page must satisfy **PV-06**, **SIM-01** through **SIM-08**, **A11Y-01** through
**A11Y-08**, and **VIS-01** through **VIS-05**.

## 5. Shared engines and outcome adapters

Shared engines remain valid and desirable. The canonical page must bind a shared
engine through an outcome adapter or configuration that defines:

- the exact active outcome;
- initial scientific state;
- exposed causal controls;
- outcome-specific visual framing;
- challenge objective, success conditions and variants;
- feedback and misconception guardrails;
- relevant invariants and model limitations; and
- accessible text/data representation.

Two outcomes may use the same underlying engine, but they must not share one
ambiguous canonical route or indistinguishable challenge. This is required by
**PV-05** and **SCI-02**.

## 6. Legacy route migration

Legacy code must not be deleted destructively during the 7.1.1 prototype.

| Legacy surface | Prototype treatment | Later migration decision |
|---|---|---|
| `/waves/medium` | Preserve; hide from primary navigation | Redirect to `/simulators/7.1.1` after parity review |
| Workspace hubs such as `/waves`, `/sound`, `/light`, `/motion`, `/forces` | Preserve; bypass from the new gallery | Redirect to gallery/filter or retain as teacher-only reference |
| Multi-outcome routes such as `/waves/measure`, `/spectrum` and `/motion/graphs` | Preserve without claiming canonical coverage | Split into distinct outcome modes/routes before redirecting |
| `/check`, `/explain`, `/connect` routes | Preserve temporarily; remove from primary learner navigation | Re-home useful content in optional outcome or teacher layers |
| `/mastery`, `/progress`, `/teacher`, `/glossary`, `/about` | Keep functional | Present as secondary utilities only |

A legacy redirect must not be introduced when it would conceal an unresolved
multi-outcome mapping. Existing tests and science logic should be reused, but old
route counts and stage completion claims are historical evidence rather than proof
of compliance with the new product contract.

The old technical release status must therefore be read as “legacy technical and
science coverage”. An outcome becomes corrected-direction compliant only when its
canonical route passes the applicable stable acceptance criteria.

## 7. 7.1.1 gold-standard outcome

### Exact outcome

**7.1.1 — “Demonstrate that a mechanical wave requires a medium to travel
through, while an electromagnetic (EM) wave does not”**

This is the reference experience for every later simulator. It must be reviewed
and approved before bulk conversion begins (**PV-09**).

### Required experience

- A dedicated gallery card opens `/simulators/7.1.1` directly.
- The exact outcome wording and a concise challenge objective are visible.
- A coherent interactive scene makes the material-medium, vacuum and EM cases
  immediately comparable.
- The student can trigger or manipulate a disturbance immediately; no worksheet,
  explanation or saved response is required first.
- The existing scientifically useful pulse/chamber logic may be retained, but the
  scene, controls, feedback and completion must form one polished visual world.
- Optional onboarding is no longer than three dismissible steps.
- An outcome-specific challenge asks the student to use the scientific model to
  achieve a clear goal, for example selecting a wave type and conditions that can
  transmit a signal through material and vacuum scenarios.
- The challenge provides state-based feedback, scoring or mastery, a satisfying
  non-flashing completion state and replayable variants.
- “How it works”, accessible data/text, model limits and teacher material are
  optional drawers rather than prerequisites.

### Scientific acceptance

- **SCI-711-01 Mechanical medium:** a mechanical disturbance propagates only when
  a material medium is present.
- **SCI-711-02 Vacuum:** a mechanical source may move in the evacuated case, but no
  mechanical disturbance is transmitted across the vacuum.
- **SCI-711-03 Electromagnetic wave:** an EM disturbance propagates without a
  material medium.
- **SCI-711-04 Representation honesty:** medium particles oscillate locally rather
  than travelling with the disturbance; EM vectors are identified as a field
  representation, not particles in space.
- **SCI-711-05 Amplitude independence:** changing amplitude alone does not change
  source frequency or propagation speed in the basic linear model.
- **SCI-711-06 Scale honesty:** illustrative chamber speeds and scales are labelled
  as such; the model does not imply that mechanical and EM waves have comparable
  real speeds.
- **SCI-711-07 Replay:** reset restores the documented initial state and identical
  inputs reproduce identical scientific results and challenge scoring.

These criteria extend, rather than weaken, the existing `SCIENCE_REVIEW.md`
contracts and unit tolerances.

### Interaction and challenge acceptance

- **SIM-711-01 Immediate manipulation:** the primary disturbance action is usable
  on first entry and visibly changes the model.
- **SIM-711-02 Causal comparison:** material, vacuum and EM results arise from the
  engine state, not predetermined explanatory prose.
- **SIM-711-03 Scientific challenge:** success requires correct use of the
  mechanical-medium/EM distinction; arbitrary clicking cannot complete it.
- **SIM-711-04 Feedback:** feedback identifies the relevant scientific cause and
  provides a useful next action after an unsuccessful attempt.
- **SIM-711-05 Completion and replay:** completion records the result locally only
  if enabled, offers replay/variant and does not require a written response.

### Accessibility and responsive acceptance

- **A11Y-711-01 Keyboard completion:** a student can enter, manipulate, complete
  and replay the entire challenge with the keyboard alone.
- **A11Y-711-02 Reduced motion:** reduced-motion first load does not autoplay;
  manual stepping/static state gives identical outcomes and scoring.
- **A11Y-711-03 Canvas fallback:** Canvas denial retains a complete text/data
  comparison and operable challenge path rather than only an explanatory notice.
- **A11Y-711-04 Equivalent meaning:** particle movement, vacuum failure, EM
  propagation, feedback and completion never depend on animation, colour or sound
  alone.
- **A11Y-711-05 Reflow:** default, active, completion, drawers and fallback states
  work at 320, 375, 768, 1024 and 1440 pixels and at 200% zoom.

### Visual acceptance

- **VIS-711-01 Stage dominance:** the comparison scene and primary action dominate
  the initial desktop/tablet view and precede long support content on mobile.
- **VIS-711-02 Coherent world:** scene, controls, challenge status and feedback feel
  integrated rather than like stacked form panels.
- **VIS-711-03 State quality:** first-use, active, paused, incorrect, success,
  replay, reduced-motion and fallback states receive intentional visual treatment.
- **VIS-711-04 Asset discipline:** any generated bitmap strengthens atmosphere or
  storytelling only, follows the approved art direction and passes manifest and
  human review; wave and field behaviour remains engine-rendered.

## 8. Verification and evidence gate

The 7.1.1 evidence pack must contain:

1. the tested acceptance-ID matrix for all applicable `PV`, `SIM`, `SCI`, `A11Y`
   and `VIS` criteria;
2. gallery-card and direct-route cardinality evidence;
3. named unit tests for `SCI-711-01` through `SCI-711-07` where automatable;
4. browser evidence for first manipulation, complete challenge, feedback,
   completion and replay;
5. keyboard-only, reduced-motion, Canvas-denial, 200% zoom and axe results;
6. screenshots at 320, 375, 768, 1024 and 1440 pixels covering initial,
   manipulated and completion states, plus representative reduced-motion and
   fallback states;
7. exact verification commands, test counts, browser projects, console/network
   results and performance budgets;
8. generated-asset manifest and visual/science review, if assets are used;
9. known limitations, unmet criteria and divergences stated plainly; and
10. confirmation that no bulk outcome conversion, tag or push was performed.

Passing legacy tests is necessary but not sufficient. Corrected-direction
completion requires evidence against these stable IDs and explicit user review of
the gold-standard prototype.
