# WaveMotion Studio — Binding Product Vision

**Status:** binding product contract  
**Effective:** 2026-07-22  
**Authority:** this document records the corrected product direction. Where it
conflicts with `docs/HANDOVER_CODEX.md`, the old stage plans, stage gates,
`IMPLEMENTATION_PLAN.md`, the suite shared specification, or the topic app plan,
this document and `docs/OUTCOME_FIRST_IA.md` take precedence. Scientific,
accessibility, cultural-integrity, privacy, offline, performance and verification
requirements from those documents remain binding unless explicitly changed here.

The words **must**, **must not** and **required** define release-blocking
requirements. **Should** records a strong default that needs a documented reason
to vary.

## 1. Product purpose

WaveMotion Studio exists so that every active NSW Year 10 Waves and Motion
syllabus dot point has an outstanding interactive simulator through which
students can see, manipulate, test and understand the science behind that dot
point.

It is not primarily a holistic learning website, digital workbook, guided lesson
sequence, worksheet platform or learning-management system. Written learning
activities may support a simulator, but they must not define the student
architecture or delay experimentation.

The canonical curriculum source is `src/content/outcomes.ts`. It contains 25 dot
points. Outcome 7.2.5 remains culturally deferred until attributable,
community-specific sources are supplied or approved and the resulting content
receives appropriate cultural review. It must remain absent from learner routes,
launcher cards, challenges and generated assets while deferred. The current
student release therefore has 24 active outcomes.

## 2. One outcome, one direct simulator

- Every active outcome must have exactly one canonical learner launcher card and
  one canonical direct route: `/simulators/:outcomeCode`.
- Every launcher must show the outcome code and exact syllabus wording.
- Opening a launcher must enter that outcome's simulator directly, not a
  workspace hub, course phase, worksheet, assessment or evidence form.
- Shared scientific engines are encouraged internally, but each outcome must
  expose a purposeful outcome-specific mode, objective, challenge, feedback and
  entry state.
- A shared engine or legacy route does not count as outcome coverage unless the
  canonical route satisfies this contract independently.
- No learner must complete reading, a quiz, a worksheet, a CER response, an
  investigation table or another route before manipulating the simulator.

## 3. Genuine simulator definition

A genuine simulator must include all of the following:

1. a scientific state model rather than a predetermined reveal;
2. at least one student-controlled causal variable, condition or action that
   recomputes that state;
3. immediate, observable scientific cause and effect;
4. current values, units or qualitative state labels appropriate to the model;
5. reset and replay with predictable starting conditions;
6. an outcome-specific objective and meaningful state-based feedback;
7. an explicit, accessible statement of model scope and limitations; and
8. a complete keyboard and non-visual or text/data-equivalent path.

A static diagram, decorative animation, prose reveal, evidence table, filtered
dataset, quiz, CER form or collection of controls with no scientific state change
is not a simulator on its own. Assessment may inspect simulator understanding; it
must not substitute for the model.

## 4. Simulator-first experience

The interactive scientific world must dominate the student experience.

- The first view must contain the outcome identity, a one-sentence objective,
  the interactive world and an immediately available primary action.
- Desktop and tablet layouts must make the simulator stage the largest and most
  visually prominent region above the fold.
- On phone layouts, the simulator stage and its primary manipulation must appear
  before long instructions, evidence capture or reference content.
- Onboarding must be optional, dismissible and no longer than three short steps.
  Returning students must be able to skip it.
- Explanations, data alternatives, model limitations and teacher material must be
  available on demand without pushing the simulator below pages of instructions.
- Controls should feel part of one coherent scientific scene, not a generic wall
  of forms and cards.

## 5. Gamification

Every canonical simulator must provide a replayable challenge loop:

`clear objective → attempt → state-based feedback → score or mastery → satisfying completion → replay or variant`

Scoring must reward scientifically meaningful decisions, predictions,
measurements or explanations. It must not reward mere clicking, reading speed or
animation speed. Challenge logic must reject impossible, malformed and
out-of-scope states. Completion rewards must avoid flashing, must not require
sound and must not disadvantage keyboard, reduced-motion or low-graphics users.
Persistent progress is optional; the complete challenge must work without it.

## 6. Visual quality, 3D and generated assets

The visual target is a premium, memorable interactive science experience with a
coherent world, clear hierarchy, deliberate typography, depth, responsive
composition, meaningful transitions, polished loading/reset/completion states
and strong control feel. Visual polish must clarify the model rather than cover a
text-led activity.

### 3D

3D should be used only where spatial depth materially improves scientific
understanding. Each use requires a short design note stating what becomes clearer
than in 2D. Graphs, equations and comparisons that are clearer in precise 2D must
remain 2D. Core meaning and operation must never depend on 3D alone; a keyboard-
operable 2D/text/data equivalent and tested WebGL fallback are required. 3D must
respect reduced-motion, low-graphics and performance budgets.

### Image generation

Purpose-made raster assets may strengthen atmosphere, equipment, environments,
textures and visual storytelling. They must be generated at build time from an
approved brief, reviewed, optimised and stored locally. They must never replace
an interactive model or act as authority for wave or field behaviour, anatomy,
graphs, data, equations, exact apparatus, spectra, forces, measurements or
cultural content.

Every generated asset must be recorded in `ASSET_MANIFEST.md` with its ID,
filename, purpose, route, complete prompt, model/version, generation date,
dimensions and aspect ratio, decorative/informative decision, alt decision,
science/cultural review, optimisation outputs and provenance/licence notes.
Review must cover scientific errors, artefacts, cropping, bias and consistency.
Responsive AVIF/WebP outputs with a conventional fallback should be used; no
runtime generative-model call is permitted.

## 7. Science and model integrity

- Exact syllabus wording must come from `src/content/outcomes.ts`.
- `SCIENCE_REVIEW.md` remains the authority for definitions, constants, sources,
  model boundaries, misconceptions, safety and numerical tolerances.
- Scientific engines must remain deterministic, React-free and tested wherever
  practical. Rendering and low-graphics choices must not change results.
- A visible control must map to a real scientific variable, condition or model
  action and have a tested effect.
- Important causal relationships and invariants must have named automated tests.
- Simplifications, illustrative scales and representation limits must be easy to
  find without obstructing immediate exploration.
- Generated imagery, completion effects and scores must never contradict the
  underlying engine state.

## 8. Accessibility and reduced motion

WCAG 2.2 AA remains the minimum target. Every simulator must provide full
keyboard operation, visible focus, logical order, semantic names, approximately
44 by 44 CSS pixel targets, accessible state announcements, 200% zoom support and
responsive operation from 320 to 1440 pixels without hidden overflow defects.

No meaning may depend on colour, sound, animation, hover, pointer precision or 3D
alone. Canvas/WebGL scenes require an adjacent text/data/table equivalent; audio
requires a visual equivalent and explicit opt-in. Capability denial must produce
a usable fallback rather than an empty stage or dead control.

Reduced motion must disable autoplay and non-essential continuous or reward
animation, provide static or manual-step equivalents, and preserve identical
scientific results, challenge conditions and scoring. Low graphics may reduce
rendering detail only.

## 9. Optional secondary layers

Worksheets, teacher tools, written explanations, evidence tables, CER prompts,
glossary, progress, mastery banks and exports may remain as separable secondary
layers. They must not:

- appear as prerequisites to experimentation;
- dominate the first viewport;
- define the primary student navigation;
- be required to prove that a simulator exists; or
- turn the gallery into a course or learning map.

Teacher and worksheet material should live behind a secondary utility surface or
an outcome-specific optional drawer and remain removable from the student path.

## 10. Stable acceptance criteria

### Product direction

- **PV-01 Authority:** product and IA decisions follow this document where old
  plans conflict.
- **PV-02 Cardinality:** the learner gallery contains exactly one launchable card
  for every active outcome and none for deferred outcomes.
- **PV-03 Direct launch:** every active card opens its canonical
  `/simulators/:outcomeCode` route and exposes a primary manipulation without an
  intervening route or required task.
- **PV-04 Exact identity:** every card and simulator shows its code and exact
  `outcomeMap` wording.
- **PV-05 Outcome specificity:** shared engines expose distinct outcome modes,
  objectives, challenges and entry states.
- **PV-06 Simulator dominance:** the simulator stage and primary action precede
  long-form instruction and secondary evidence surfaces at every target viewport.
- **PV-07 Optional support:** progress, worksheets, CER, teacher tools and exports
  can be ignored without reducing simulator or challenge functionality.
- **PV-08 Anti-course drift:** no workspace hub or Orient/Learn/Investigate/Check/
  Explain/Connect route appears in primary learner navigation.
- **PV-09 Prototype gate:** the old stage sequence, release packaging and bulk
  outcome conversion must not resume until the 7.1.1 gold-standard experience
  has been reviewed and approved by the user.

### Simulator integrity

- **SIM-01 Real state:** the experience is driven by a scientific state model.
- **SIM-02 Causal manipulation:** at least one student action recomputes state and
  produces immediate observable cause and effect.
- **SIM-03 Honest controls:** every visible control has a meaningful, inventoried
  and browser-tested effect.
- **SIM-04 Reset and replay:** reset restores a documented deterministic baseline;
  the outcome can be replayed without reloading the app.
- **SIM-05 Challenge loop:** objective, attempt, state-based feedback, score or
  mastery, completion and replay/variant are all present.
- **SIM-06 Scientific scoring:** success follows engine state and scientifically
  valid decisions, never syntax, clicks or elapsed animation alone.
- **SIM-07 Model boundary:** scope, simplifications and illustrative scale are
  available in the simulator.
- **SIM-08 No substitute:** static content, questions and evidence forms do not
  count as the simulator.

### Scientific integrity

- **SCI-01 Canonical content:** outcome text, definitions, constants and sources
  come from the canonical repository contracts.
- **SCI-02 Causal fidelity:** controls and feedback represent the documented causal
  model and do not introduce a misconception.
- **SCI-03 Invariants:** each important outcome-specific invariant has a named unit
  or integration test with the documented tolerance.
- **SCI-04 Determinism:** reset/replay is reproducible; seeded variation changes
  measurement presentation, not underlying scientific truth.
- **SCI-05 Representation honesty:** visual metaphors, generated art, 3D and reward
  effects are distinguished from measured or simulated scientific entities.
- **SCI-06 Limits and safety:** assumptions, model limitations and safety notes are
  accurate, accessible and proportionate.

### Accessibility

- **A11Y-01 Keyboard:** a student can enter, manipulate, complete and replay the
  simulator challenge using only the keyboard.
- **A11Y-02 Semantics:** controls, landmarks, headings, errors and state changes have
  correct semantic names and announcements.
- **A11Y-03 Non-visual equivalence:** Canvas/WebGL/audio state has a complete
  text/data/visual equivalent that supports the same learning goal.
- **A11Y-04 Reduced motion:** first load does not autoplay when reduced motion is
  requested; manual stepping/static states retain equal results and scoring.
- **A11Y-05 Capability fallback:** Canvas, WebGL, audio and storage failure paths
  remain usable and expose no dead controls.
- **A11Y-06 Perception:** meaning and correctness never depend on colour, sound,
  animation, hover or 3D alone.
- **A11Y-07 Reflow:** 200% zoom and 320/375/768/1024/1440 pixel layouts have no lost,
  clipped or horizontally masked content.
- **A11Y-08 Targets and focus:** focus is visible and interactive targets meet the
  established size requirement.

### Visual and experience quality

- **VIS-01 Hierarchy:** the scientific world is the largest, clearest element in
  the initial desktop/tablet view and precedes long support content on mobile.
- **VIS-02 Coherence:** scene, controls, feedback and challenge HUD read as one
  intentional world rather than unrelated cards or forms.
- **VIS-03 State polish:** loading, first-use, active, paused, success, replay,
  reduced-motion and degraded-capability states are designed and reviewed.
- **VIS-04 Asset integrity:** every generated asset is manifested, optimised,
  consistently art-directed and human-reviewed.
- **VIS-05 Performance:** useful first interaction, animation, memory, pixel-ratio
  and low-graphics budgets from the existing test plan remain satisfied.

Failure of any applicable acceptance criterion is a release blocker. Evidence
must identify the criterion by ID; visual appearance or a generic “working” claim
is not sufficient.
