# Outcome Coverage Map — WaveMotion Studio

Canonical outcome wording lives in `src/content/outcomes.ts` (extracted verbatim from
the NSW Junior Science Syllabus, focus area 7 "Waves and motion", 2026-07-17 — see
`docs/OUTCOME_EXTRACTION_REPORT.md`). This map assigns each outcome to its route,
teaching content, interaction, representation, student task, assessable evidence,
misconception addressed, model limitation, and build stage.

**Status legend:** `not built` · `in build` · `verified (builder)` (builder gate-checks green; orchestrator re-run pending) · `verified` (passed its stage gate with evidence) · `deferred`.
Prototype code from the pre-audit build does **not** count as coverage — every row starts
`not built` until it passes `docs/plans/stage-gates.md`.

> Corrected-direction note (2026-07-22): `docs/PRODUCT_VISION.md` and
> `docs/OUTCOME_FIRST_IA.md` supersede the workspace/course architecture. Legacy
> status below remains historical science and technical coverage. Outcomes
> 7.1.1–7.1.4 have completed the new canonical simulator-first gate; the
> remaining active outcomes are explicit transitional launchers, not
> corrected-direction completion.

## 7.1 Common properties of waves — Stage 2 (wave lab) + Stage 6 (spectrum)

| Code | Route | Teaching content | Interaction / simulation | Representation | Student task | Assessable evidence | Misconception addressed | Model limitation | Stage | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.1.1 | `/simulators/7.1.1` (canonical); `/waves/medium` (legacy preserved) | Mechanical waves need a medium; EM waves don't | One-launch material / vacuum / EM comparison with causal controls, live detectors and a scored replayable challenge | Engine-driven Canvas world + always-present detector table and fallback | Predict which signals transmit, launch the same disturbance and check against simulated evidence | 300-point state-based mastery result + replay | "No waves travel in space"; "the source cannot move in a vacuum"; amplitude changes speed | Display speeds/scales are illustrative; EM vectors are field representation, not particles | Prototype gate | verified (builder; user approval pending) |
| 7.1.2 | `/simulators/7.1.2` (canonical); `/waves/energy` (legacy preserved) | Energy transfers without net particle transfer | Launch one travelling pulse; capture an assigned particle near peak and after it returns home; verify energy at the receiver | Engine-driven Canvas world + always-present particle/receiver table and fallback | Complete a particle passport from two valid model states | State-scored 100-point result proving receiver energy with final particle displacement below 1% of amplitude | "Particles travel along with the wave" | Uniform, linear, non-dispersive and lossless medium; fixed display speed is illustrative | Outcome-first gate | verified (builder; user approval pending) |
| 7.1.3 | `/simulators/7.1.3` (canonical); `/waves/types` (legacy preserved) | Transverse vs longitudinal features | One engine state drives linked rope and spring views; movable probe locks live crest/trough and compression/rarefaction positions | Engine-driven dual Canvas world + always-present comparison table and fallback | Lock one feature in each model, compare displacement direction and reject the graph-as-particle-path trap | Four state/reasoning checks worth 100 points with deterministic feature replay | "A pressure graph shows particles moving up and down"; crests and compressions are interchangeable | Ideal 1D rope/spring; longitudinal spacing display-scaled without changing engine state; water-surface waves not perfectly transverse | Outcome-first gate | verified (builder; user approval pending) |
| 7.1.4 | `/simulators/7.1.4` (canonical); `/spectrum` (legacy preserved) | Compare wave forms of the electromagnetic spectrum | Continuous log-scale tuning with linked wavelength/frequency, region jumps, A/B pins and a three-mission calibration | Engine-driven Canvas field model + semantic spectrum band, table and fallback | Tune a target, compare two pinned wave forms and select every valid region at an overlapping boundary | Three state/reasoning missions worth 300 points with deterministic replay | "A spectrum boundary has one exact label"; higher frequency alone determines risk | Region boundaries approximate/overlapping; displayed field cycles normalised and not on one distance scale | Outcome-first gate | verified (builder; user approval pending) |
| 7.1.5 | `/waves/measure` | Amplitude, frequency, speed, wavelength | Placeable rulers/timers/probes across wave types | Canvas + measurement tools | Measure each feature across presets | Completed measurement record | Amplitude ≠ frequency ≠ speed conflation | Linear non-dispersive model | 2 | verified |
| 7.1.6 | `/waves/measure` | λ = v/f relationship | v=fλ calculator + rearrangements + unit conversion | MathML equation + linked graph | Calculate λ, v, f; convert units; graph λ vs 1/f | Correct calculations + graph interpretation | Triangle-mnemonic without meaning; amplitude changes speed | Fixed medium speed in basic model | 2 | verified |
| 7.1.7 | `/spectrum` | Compare EM uses from properties (secondary data) | Curated, source/review-dated dataset activity | Data table + evidence disclosures | Select property, cite data, justify use | Saved evidence-based justification | "All EM waves are the same but coloured differently" | Curated dataset, review-dated | 6 | verified (builder) |

## 7.2 Sound waves — Stage 3 + Stage 6

| Code | Route | Teaching content | Interaction / simulation | Representation | Student task | Assessable evidence | Misconception addressed | Model limitation | Stage | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.2.1 | `/sound/compression` | Sound as compressions/rarefactions | Vibrating source → particle displacement → pressure bands → mic trace (4 linked reps) | Canvas + pressure–time SVG graph + tabular particle alternative | Tag particles; relate density bands to pressure trace | Explanation of oscillation vs energy direction | "Sound particles fly from source to ear" | 343 m/s dry air 20 °C reference; fixed 3.12 m viewport; particle positions use relative units | 3 | verified (builder) |
| 7.2.2 | `/sound/pitch-loudness` | Amplitude→loudness, frequency→pitch | Opt-in capped Web Audio + oscilloscope/spectrum, pulse equivalent, visual-only mode | Waveform SVG + tabular/visual equivalents + optional audio | Vary amplitude & frequency independently in controlled trials | Trial table/graph/export, interpretation and limitation evidence | "Amplitude changes pitch"; "volume = loudness" | Not calibrated SPL; hearing non-linear | 3 | verified (builder) |
| 7.2.3 | `/sound/doppler` | Doppler effect | 1D moving source/observer, emitted wavefronts, arrival-timed detected-frequency graph | Canvas wavefronts + SVG graph + accessible readouts + optional audio | Set motion presets, compare source and detected frequency | Explanation of arrival-timing cause | "The source changes its frequency" | 1D subsonic model; wave speed fixed vs medium; no sonic boom | 3 | verified (builder) |
| 7.2.4 | `/hearing` | Ear responds to sound | Trace eight outer→middle→inner ear structures and a frequency-place trend | Semantic button pathway + ordered text ladder | Order and explain the transduction pathway | Saved mechanical→fluid→electrical explanation | "The eardrum sends signals to the brain directly" | Simplified cochlear frequency mapping; non-diagnostic | 6 | verified (builder) |
| 7.2.5 | — | Material choice & sound transfer in Aboriginal and/or Torres Strait Islander instruments | Not shipped without attributable, community-approved sources | None | None in this release | None in this release | Pan-Indigenous generalisation is avoided by deferral | No generic substitute is scientifically or culturally acceptable | 6 | **deferred** (needs Irvin-approved community sources) |
| 7.2.6 | `/ultrasound` | Sound in medical diagnosis | Pulse-echo on three synthetic tissue phantoms | CSS B-mode + always-present echo/depth table | Send pulses, interpret echo timing/depth and limitation | Saved depth-from-echo reasoning | "Ultrasound photographs the body" | Synthetic constant-1540 m/s phantom; not clinical | 6 | verified (builder) |

## 7.3 Light waves — Stage 4 + Stage 6

| Code | Route | Teaching content | Interaction / simulation | Representation | Student task | Assessable evidence | Misconception addressed | Model limitation | Stage | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.3.1 | `/vision` | Eye responds to light | Object distance/brightness, relative pupil/accommodation, retinal image/focus, guided blind-spot activity | Precise SVG eye + labelled optical/neural text pathway | Adjust conditions; distinguish optical image formation from neural interpretation | Saved optical-versus-neural explanation + validated Check evidence | "The brain just flips the image"; "pupil focuses" | Relative non-biometric model; not medical advice/diagnosis | 4 | verified (builder) |
| 7.3.2 | `/light/properties` | Absorption, reflection, refraction, scattering | Keyboard/pointer ray bench; two media; protractor readout; TIR; normalised energy ledger; qualitative scattering | Precise SVG rays + angle/readout/table/graph equivalents | Hypothesise; record two reflection points plus refraction/energy trials; graph, interpret, conclude, limit, export/print | Complete saved investigation + CER + validated Check evidence | "Light bends to take the shortest path"; frequency changes; angles measured from surface | Ideal ray model; f constant at stationary boundary; response fractions are teaching fixtures | 4 | verified (builder) |
| 7.3.3 | `/light/applications` | Everyday applications | Mirror challenge; qualitative lens; fibre/TIR; conditional surface/UV/remote-sensing scenarios | SVG/text models + stated evidence/guardrail cards | Select application; justify with property evidence and state assumption/limitation | Saved design justification + validated Check evidence | "Black objects always heat fastest" | Stated illuminant/model assumptions; no temperature or fabricated focal length | 4 | verified (builder) |
| 7.3.4 | `/astronomy` | EM spectrum to learn about stars | Multiwavelength, curated line and signed shift explorer | Catalogued rest/shifted line table + text evidence | Infer temperature trend/composition/motion | Saved evidence-based inference | "Stars are just white points" | Curated line positions; non-relativistic ±300 km/s shift; no decorative art | 6 | verified (builder) |

## 7.4 Motion — Stage 5

| Code | Route | Teaching content | Interaction / simulation | Representation | Student task | Assessable evidence | Misconception addressed | Model limitation | Stage | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.4.1 | `/motion/track`, `/motion/graphs` | Distance/time/speed vs position/displacement/velocity; instantaneous vs average | Exact discrete 1D commands; movable origin; selectable sign; timed trials | CSS track + static signed readouts + semantic tables | Complete a return-trip comparison and motion investigation | Saved track comparison + full graph investigation + Check/CER evidence | "Distance and displacement are the same" | −20…+20 m deterministic teaching track; 1D only | 5 | verified (builder) |
| 7.4.2 | `/motion/diagrams` | Equal-time motion diagrams | Numeric strobe editor, four intervals, vector overlays, five pattern checks | CSS/SVG-like dot track + editable semantic table | Construct/interpret constant velocity, acceleration, deceleration, reversal and rest | Saved checked diagram + explanation + Check evidence | Negative acceleration always means slowing; dots are velocity arrows | 2–8 dots; stated tolerance fixtures | 5 | verified (builder) |
| 7.4.3 | `/motion/graphs` | Distance–time/displacement–time line graphs and slope | Controlled timed trials, graph type, two-point slope, piecewise story | SVG graph + always-present data table | Record ≥3 trials, calculate slope, interpret and export | Full aim/hypothesis/table/graph/comparison/conclusion/limitation evidence | "A motion graph is a literal hill/path" | Exact constant-speed trials; real timing uncertainty discussed | 5 | verified (builder) |
| 7.4.4 | `/forces/cart` | Force, mass, acceleration relationships | Separate force and mass sweeps; friction; ideal/seeded measurement modes | SVG graphs + units-bearing semantic table/readouts | Test a∝Fnet and a∝1/m with controlled variables/repeats | Saved two-series fair test + CSV/JSON/print + Check/CER | "Greater mass gives greater/same acceleration under the same force" | 1D point-cart; 0.5 N friction teaching fixture | 5 | verified (builder) |
| 7.4.5 | `/forces/applications` | Newton's laws applications | Six named action/outcome cases with force-pair reveal | Text outcome and explicit different-object pair display | Explain seatbelt, carts, walking, balloon, collision or spacecraft | Saved case explanation + Check evidence | Constant velocity needs net force; third-law pairs cancel | Qualitative cases; only walking has authorised 400 N fixture | 5 | verified (builder) |
| 7.4.6 | `/forces/vectors` | Net force in 1D vector analysis | Context-gated, max-six force builder; physical direction separate from coordinate sign | CSS arrows + signed semantic force table/readout | Build one-object FBD, flip convention, determine signed net | Saved vector configuration/explanation + Check evidence | Forces on different objects cancel on one FBD | 1D, one selected object, 3-s.f. display | 5 | verified (builder) |
| 7.4.7 | `/forces/calculations`, `/forces/cart`, `/motion/graphs` | F=ma, v_av=Δs/Δt, a=Δv/Δt and graph interpretation | Nine guarded rearrangements; ideal sensor verification; unit-aware Check | Formula text, SVG graphs, units-bearing tables | Solve/rearrange, verify Fnet=ma and Δv/Δt, interpret sign/units | Saved calculation + cart verification + Check/CER evidence | Unit/dimension errors accepted; negative acceleration always slowing | SI teaching model; zero/nonphysical divisors rejected | 5 | verified (builder) |

## 7.5 Waves and motion in context — Stage 6

| Code | Route | Teaching content | Interaction / simulation | Representation | Student task | Assessable evidence | Misconception addressed | Model limitation | Stage | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.5.1 | `/society` | Argument: how waves & motion changed society | Six sourced case-study evidence packs and argument studio | Evidence table + criteria/CER/counterclaim/bibliography builders | Build contention, evidence, counterclaim, proportional conclusion | Saved/exported structured evidence-based argument | "Technology is purely good/bad" | Curated evidence packs; no single prescribed conclusion | 6 | verified (builder) |

## Deferrals (explicit)

- **7.2.5 cultural sound-material investigation** — built only when Irvin supplies/approves
  attributable, community-specific Aboriginal and/or Torres Strait Islander sources.
  Until then it is absent from release navigation (not an "under construction" tease).
  This is the honest fallback; cultural content is never generated.

## Builder-verified classroom release (Stages 0–6)

Included and navigable: shell + learning map, wave-foundations workspace (7.1.1–7.1.6),
v=fλ calculator + conversions, linked graphs, and the complete sound workspace for
compression, pitch/loudness and Doppler effect (7.2.1–7.2.3), plus vision and
light properties/applications (7.3.1–7.3.3), plus the complete motion and forces
groups (7.4.1–7.4.7), plus spectrum, hearing, synthetic ultrasound, astronomy,
society, mastery and the cross-cutting teacher/progress tools. The active release
denominator is 24 outcomes. Stages 3–6 passed the fresh-context Stage 7 technical
audit; human science/browser/device approval and release tagging remain pending.
Outcome 7.2.5 is the sole deferral and remains absent from learner navigation,
learning cards and mastery.
