# Outcome Coverage Map — WaveMotion Studio

Canonical outcome wording lives in `src/content/outcomes.ts` (extracted verbatim from
the NSW Junior Science Syllabus, focus area 7 "Waves and motion", 2026-07-17 — see
`docs/OUTCOME_EXTRACTION_REPORT.md`). This map assigns each outcome to its route,
teaching content, interaction, representation, student task, assessable evidence,
misconception addressed, model limitation, and build stage.

**Status legend:** `not built` · `in build` · `verified (builder)` (builder gate-checks green; orchestrator re-run pending) · `verified` (passed its stage gate with evidence) · `deferred`.
Prototype code from the pre-audit build does **not** count as coverage — every row starts
`not built` until it passes `docs/plans/stage-gates.md`.

## 7.1 Common properties of waves — Stage 2 (wave lab) + Stage 6 (spectrum)

| Code | Route | Teaching content | Interaction / simulation | Representation | Student task | Assessable evidence | Misconception addressed | Model limitation | Stage | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.1.1 | `/waves/medium` | Mechanical waves need a medium; EM waves don't | Synchronised medium / vacuum / EM-field chambers, trigger disturbance | Canvas particle field + field-vector view | Compare propagation in each chamber; explain | CER: why sound fails in vacuum but light doesn't | "Space is empty so no waves travel" | EM field vectors are a representation, not particles in space | 2 | verified |
| 7.1.2 | `/waves/energy` | Energy transfers without net particle transfer | Tag particles during pulse; energy marker travels, particles oscillate | Canvas + tagged-particle table | Track a tagged particle over whole cycles | Explanation: net displacement ≈ 0 | "Particles travel along with the wave" | Ideal lossless medium; ≈0 net displacement | 2 | verified |
| 7.1.3 | `/waves/types` | Transverse vs longitudinal features | Linked transverse + longitudinal views, one wave state | Canvas dual view + labelled SVG | Identify crest/trough/compression/rarefaction, displacement vs propagation direction | Labelled comparison + representation-trap check | "A pressure graph shows particles moving up and down" | Water waves not perfectly transverse | 2 | verified |
| 7.1.4 | `/spectrum` | EM spectrum wave forms compared | Continuous zoomable spectrum | SVG log axes + data cards | Compare wavelength/frequency/energy/sources/uses | Comparison table with citations | "Higher frequency is always more dangerous"; "all radiation is radioactive" | Band boundaries approximate/overlapping | 6 | not built |
| 7.1.5 | `/waves/measure` | Amplitude, frequency, speed, wavelength | Placeable rulers/timers/probes across wave types | Canvas + measurement tools | Measure each feature across presets | Completed measurement record | Amplitude ≠ frequency ≠ speed conflation | Linear non-dispersive model | 2 | verified |
| 7.1.6 | `/waves/measure` | λ = v/f relationship | v=fλ calculator + rearrangements + unit conversion | MathML equation + linked graph | Calculate λ, v, f; convert units; graph λ vs 1/f | Correct calculations + graph interpretation | Triangle-mnemonic without meaning; amplitude changes speed | Fixed medium speed in basic model | 2 | verified |
| 7.1.7 | `/spectrum` | Compare EM uses from properties (secondary data) | Curated dataset activity | Data table + evidence cards | Select property, cite data, justify use | Evidence-based justification | "All EM waves are the same but coloured differently" | Curated dataset, review-dated | 6 | not built |

## 7.2 Sound waves — Stage 3 + Stage 6

| Code | Route | Teaching content | Interaction / simulation | Representation | Student task | Assessable evidence | Misconception addressed | Model limitation | Stage | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.2.1 | `/sound/compression` | Sound as compressions/rarefactions | Vibrating source → particle displacement → pressure bands → mic trace (4 linked reps) | Canvas + pressure–time SVG graph + tabular particle alternative | Tag particles; relate density bands to pressure trace | Explanation of oscillation vs energy direction | "Sound particles fly from source to ear" | 343 m/s dry air 20 °C reference; fixed 3.12 m viewport; particle positions use relative units | 3 | verified (builder) |
| 7.2.2 | `/sound/pitch-loudness` | Amplitude→loudness, frequency→pitch | Opt-in capped Web Audio + oscilloscope/spectrum, pulse equivalent, visual-only mode | Waveform SVG + tabular/visual equivalents + optional audio | Vary amplitude & frequency independently in controlled trials | Trial table/graph/export, interpretation and limitation evidence | "Amplitude changes pitch"; "volume = loudness" | Not calibrated SPL; hearing non-linear | 3 | verified (builder) |
| 7.2.3 | `/sound/doppler` | Doppler effect | 1D moving source/observer, emitted wavefronts, arrival-timed detected-frequency graph | Canvas wavefronts + SVG graph + accessible readouts + optional audio | Set motion presets, compare source and detected frequency | Explanation of arrival-timing cause | "The source changes its frequency" | 1D subsonic model; wave speed fixed vs medium; no sonic boom | 3 | verified (builder) |
| 7.2.4 | `/hearing` | Ear responds to sound | Trace outer→middle→inner ear pathway | Precise SVG cutaway | Order the transduction pathway | Mechanical→fluid→electrical explanation | "The eardrum sends signals to the brain directly" | Simplified cochlear frequency mapping | 6 | not built |
| 7.2.5 | `/sound/materials` | Material choice & sound transfer in Aboriginal and/or Torres Strait Islander instruments | Material-property investigation (community-specific, sourced) | SVG + data table | Compare sound transfer by material | Investigation with attributed sources | Pan-Indigenous generalisation | Synthesised acoustics are a model, not a recording | 6 | **deferred** (needs Irvin-approved community sources) |
| 7.2.6 | `/ultrasound` | Sound in medical diagnosis | Pulse-echo on synthetic tissue phantom | Canvas B-mode + depth calc | Send pulses, interpret echo timing/depth | Depth-from-echo reasoning | "Ultrasound photographs the body" | Synthetic phantom; not clinical | 6 | not built |

## 7.3 Light waves — Stage 4 + Stage 6

| Code | Route | Teaching content | Interaction / simulation | Representation | Student task | Assessable evidence | Misconception addressed | Model limitation | Stage | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.3.1 | `/vision` | Eye responds to light | Object distance/brightness, pupil, accommodation, retinal image | Precise SVG eye + ray model | Adjust conditions, observe pupil/focus/image | Optical vs neural separation explanation | "The brain just flips the image" | Optical formation only; not medical | 4 | not built |
| 7.3.2 | `/light/properties` | Absorption, reflection, refraction, scattering | Draggable ray bench, media, protractor | Precise SVG rays + angle readout | Measure angles; observe bending & scattering | Law of reflection; refraction behaviour | "Light bends to take the shortest path" | Ray model; f constant at boundary | 4 | not built |
| 7.3.3 | `/light/applications` | Everyday applications | Mirror/lens/fibre/surface challenges | SVG bench + scenarios | Solve applied optics tasks | Design justifications | "Black objects always heat fastest" | Stated illuminant/assumptions | 4 | not built |
| 7.3.4 | `/astronomy` | EM spectrum to learn about stars | Multiwavelength observatory, spectra | SVG spectra + line data | Infer temperature/composition/motion | Evidence-based inference | "Stars are just white points" | Curated real line positions; decorative art ≠ data | 6 | not built |

## 7.4 Motion — Stage 5

| Code | Route | Teaching content | Interaction / simulation | Representation | Student task | Assessable evidence | Misconception addressed | Model limitation | Stage | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.4.1 | `/motion/track` | Distance/time/speed vs displacement/velocity | 1D track, signed direction, readouts | Canvas track + SVG vectors | Compare scalar vs vector quantities | Distance-vs-displacement analysis | "Distance and displacement are the same" | 1D signed convention | 5 | not built |
| 7.4.2 | `/motion/diagrams` | Motion diagrams | Strobe-dot editor, equal time intervals | SVG dots + optional vectors | Construct/interpret constant v, accel, rest, reversal | Correct motion diagram | "Dots and velocity arrows are the same overlay" | Dots = equal-time positions | 5 | not built |
| 7.4.3 | `/motion/graphs` | Distance–time line graph & speed | Timed trials, table, graph, slope | SVG graph + data table | Collect trials, plot, read slope | Distance–time graph + slope=speed | "A d–t graph is a picture of the path" | Straight-line = constant speed | 5 | not built |
| 7.4.4 | `/forces/cart` | Force, mass, acceleration relationships | Low-friction cart, sensors, graphs | Canvas + SVG graphs + table | Test a∝F and a∝1/m | Fair-test investigation with graphs | "Heavier always accelerates more" | Deterministic ideal; optional seeded noise | 5 | not built |
| 7.4.5 | `/forces/applications` | Newton's laws applications | Short case scenarios | SVG free-body + animation | Explain seatbelt, walking, propulsion cases | Newton's-law explanations | "Constant velocity needs a net force"; "3rd-law pairs cancel" | Idealised friction/air | 5 | not built |
| 7.4.6 | `/forces/vectors` | Net force in 1D (vector analysis) | Force-arrow builder on one object | SVG vectors + net-force readout | Add forces, compute net force | Correct net-force determination | "Forces on different objects cancel on one FBD" | 1D only; forces on one object | 5 | not built |
| 7.4.7 | `/forces/calculations` | F=ma, v_av=Δs/Δt, a=Δv/Δt (quantitative) | Calculation workspace + graphs | MathML + graphs + table | Solve quantitative problems, interpret graphs | Correct multi-step calculations | Unit/dimension errors accepted as correct | Ideal-run values | 5 | not built |

## 7.5 Waves and motion in context — Stage 6

| Code | Route | Teaching content | Interaction / simulation | Representation | Student task | Assessable evidence | Misconception addressed | Model limitation | Stage | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.5.1 | `/society` | Argument: how waves & motion changed society | Case-study argument studio, evidence packs | Evidence table + CER builder | Build contention, evidence, counterclaim, conclusion | Structured evidence-based argument | "Technology is purely good/bad" | No single prescribed conclusion | 6 | not built |

## Deferrals (explicit)

- **7.2.5 cultural sound-material investigation** — built only when Irvin supplies/approves
  attributable, community-specific Aboriginal and/or Torres Strait Islander sources.
  Until then it is absent from release navigation (not an "under construction" tease).
  This is the honest fallback; cultural content is never generated.

## Builder-verified classroom release (Stages 0–3)

Included and navigable: shell + learning map, wave-foundations workspace (7.1.1–7.1.6),
v=fλ calculator + conversions, linked graphs, and the complete sound workspace for
compression, pitch/loudness and Doppler effect (7.2.1–7.2.3), with Check, Explain,
Connect and progress/evidence capture. Stage 3 is awaiting independent gate review;
everything marked Stage 4+ is deferred and hidden until built.
