# SCIENCE_REVIEW.md — WaveMotion Studio (NSW Year 10 Waves & Motion)

**Scientific contract document.** This file is the single source of truth for the
scientific definitions, units, constants, models, simplifications, invariants, and
teaching boundaries used in WaveMotion Studio. It implements the *Scientific
simulation standards*, *Assessment contract*, and *Investigation contract* of
`SCIENCE_SIMULATOR_SUITE_SHARED_SPEC.md` and the invariants of
`YEAR_10_WAVES_MOTION_APP_PLAN.md` (§14–§15).

- **Audience:** NSW Year 10. No university formalism (no calculus, no phasors, no
  wave equation, no tensor forces, no relativistic corrections). Where the real
  physics is more subtle, the model is stated as a deliberate simplification.
- **Language:** Australian English throughout.
- **Constants rule:** no physical constant, medium speed, refractive index, or
  spectral-line value appears anywhere in the app without a source and a review
  date recorded in this document. **Review date for all entries below: 2026-07-17.**
- **Verification note for constants:** the values below are curated from standard
  authoritative references named in each source column. Before release, a human
  reviewer must confirm each value against the cited source on the review date and
  tick the sign-off checklist at the end. Values are stored *exactly* as given in
  the engine's constants module; the figures shown here are the display-rounded
  forms.

Scope note: **momentum is deliberately excluded** from this topic (not an NSW Year
10 requirement here). Do not add momentum, impulse, or collision-momentum content
to any module or question.

---

## 1. Quantities: definitions and units

All quantities use SI units. Units are **mandatory and visible** on every control,
readout, table column, and graph axis (shared spec: *Scientific simulation
standards*). Symbols follow NSW syllabus notation where it exists.

### 1.1 Amplitude
- **Meaning (Year 10):** the maximum displacement of a particle (or field) from its
  rest/equilibrium position. It measures how "big" the oscillation is, not how fast
  or how long it is.
- **Symbol:** A. **SI unit:** metre (m). For a pressure representation of sound the
  app may also show a pressure amplitude in pascal (Pa), clearly labelled as a
  *model* pressure, not a calibrated measurement (see §12, §14).
- **Sign:** amplitude is a magnitude and is always ≥ 0. Displacement (§1.7) carries
  the sign; amplitude does not.

### 1.2 Wavelength
- **Meaning:** the distance over which the wave pattern repeats once — e.g. crest to
  next crest, or compression to next compression.
- **Symbol:** λ (lambda). **SI unit:** metre (m). Display may use cm, mm, µm, nm for
  short wavelengths (see §3).

### 1.3 Frequency
- **Meaning:** the number of complete oscillations (or complete waves passing a
  point) each second.
- **Symbol:** f. **SI unit:** hertz (Hz), where 1 Hz = 1 cycle per second = 1 s⁻¹.
  Display may use kHz, MHz, GHz (see §3).

### 1.4 Period
- **Meaning:** the time for one complete oscillation (or for one whole wave to pass a
  point). The period is the "time twin" of frequency.
- **Symbol:** T. **SI unit:** second (s). Display may use ms.
- **Relationship (used internally and taught):** `T = 1 / f` and `f = 1 / T`
  (exact, dimensionless-reciprocal; tolerance per §3.4).

### 1.5 Wave speed
- **Meaning:** how fast the wave pattern / the energy front moves through the medium.
  This is the speed of the *wave*, not the speed of a particle.
- **Symbol:** v. **SI unit:** metre per second (m/s). See §2 for the defining
  relationship and §6 for medium presets.

### 1.6 Displacement
- **Meaning:** the change in position of an object measured in a straight line from
  start to finish, **with direction**. In waves, the displacement of a particle is
  its signed distance from equilibrium at an instant.
- **Symbol:** s (motion contexts, NSW notation) or y (transverse wave displacement).
  **SI unit:** metre (m).
- **Vector/scalar:** displacement is a directed (signed, 1D) quantity (see §16).

### 1.7 Distance
- **Meaning:** the total length of path actually travelled, ignoring direction.
- **Symbol:** d (or "distance" column in tables). **SI unit:** metre (m).
- **Vector/scalar:** distance is a scalar and is always ≥ 0. Distance ≥ |displacement|
  always (invariant, §20).

### 1.8 Velocity
- **Meaning:** rate of change of displacement — how fast position changes **and in
  which direction**. Average velocity `v_av = Δs / Δt`.
- **Symbol:** v. **SI unit:** metre per second (m/s).
- **Vector/scalar:** velocity is a directed (signed, 1D) quantity. Distinguish from
  *speed* (scalar magnitude of velocity; average speed = total distance / total time).

### 1.9 Acceleration
- **Meaning:** rate of change of velocity — how quickly velocity changes, and in
  which direction. `a = Δv / Δt`.
- **Symbol:** a. **SI unit:** metre per second squared (m/s²).
- **Vector/scalar:** directed (signed, 1D). A negative value means acceleration in
  the negative direction, **not** necessarily "slowing down" (see §16, §20).

### 1.10 Force
- **Meaning:** a push or pull on an object; the cause of a change in motion
  (acceleration) of that object.
- **Symbol:** F. **SI unit:** newton (N), where 1 N = 1 kg·m/s².
- **Vector/scalar:** directed (signed, 1D in this app). Net (resultant) force
  `F_net = ΣF` (signed sum along the chosen positive direction, §17).

### 1.11 Mass
- **Meaning:** the amount of matter in an object; its resistance to being
  accelerated (inertia). Mass does not change with location.
- **Symbol:** m. **SI unit:** kilogram (kg). Display may use gram (g) for small
  carts; internal value stays in kg.
- **Not weight:** mass (kg) is distinct from weight (a force, N). The app does not
  require weight except where a vertical support context is explicitly chosen (§17);
  gravitational field strength, if used, is a labelled constant (§6.4).

### 1.12 Energy representations
- **Meaning (Year 10):** waves transfer **energy** from place to place without
  transferring matter. The app represents energy *qualitatively and relatively*, not
  as a precise joule calculation.
- **Unit:** joule (J) only where an explicit numeric energy is shown; otherwise
  energy is shown as a **relative** indicator (e.g. a labelled "energy marker",
  a brightness/level bar, or an arrow showing direction of energy transfer).
- **Representations used:**
  - *energy marker / pulse front* — a moving indicator showing where the energy of a
    pulse currently is (Wave foundations §4.1);
  - *relative intensity bar* — larger amplitude ⇒ more energy carried, shown as a
    relative bar, **not** a calibrated intensity (sound §12; EM §5);
  - *energy ledger* for optics — transmitted + reflected + absorbed fractions sum to
    1 (§10.3, invariant §20);
  - *photon-energy trend* across the EM spectrum — qualitative "lower ↔ higher",
    not numeric electronvolts at Year 10 (§5, §11).
- **Simplification stated:** the app does **not** claim to compute the absolute
  energy of a wave. Amplitude relates to energy carried, shown relatively only.

---

## 2. The wave equation v = fλ

### 2.1 The relationship
`v = f λ` — wave speed equals frequency multiplied by wavelength. This is the
central quantitative relationship of the wave modules and is enforced as an
invariant (§20).

### 2.2 Supported rearrangements
The equation engine supports and tests all three forms with identical exact
internal values:
- `v = f λ` (find speed);
- `λ = v / f` (find wavelength; syllabus outcome 7.1.6);
- `f = v / λ` (find frequency).

Triangle mnemonics are **not** used without conceptual explanation (app plan §4.3):
the engine and teaching text always present the physical meaning (speed = how many
waves per second × how long each wave is), and any triangle aid is offered only
alongside that reasoning.

### 2.3 Guard on division
`f = v/λ` and `λ = v/f` must guard against division by zero. If f = 0 or λ = 0 the
engine returns an explicit "not defined for a stationary/zero input" state, never a
silent 0 or ∞, and answer-checking never marks such input correct (shared spec:
*Interaction-integrity contract* — no false positives).

### 2.4 Default causal model (which variable is independent)
In the default linear model (app plan §4.3, invariant list §15):
- the **source** sets the **frequency** f;
- the **medium** sets the **wave speed** v;
- **wavelength λ is the dependent quantity**: λ = v/f, adjusting so that v = fλ holds;
- **amplitude A is independent** and adjustable within a linear range; it does **not**
  appear in v = fλ and changes neither v, f nor λ (§7, §20).

---

## 3. Units, conversions, and rounding

### 3.1 Length conversions (exact)
Stored internally in metres. Display conversions:

| Unit | Symbol | Metres | Typical use |
|---|---|---|---|
| metre | m | 1 | rope, water, sound wavelengths |
| centimetre | cm | 1 × 10⁻² | ripple tank, short rope |
| millimetre | mm | 1 × 10⁻³ | microwaves, ultrasound |
| micrometre | µm | 1 × 10⁻⁶ | infrared, visible (≈0.4–0.7 µm) |
| nanometre | nm | 1 × 10⁻⁹ | visible (≈400–700 nm), UV, X-ray |

### 3.2 Frequency conversions (exact)
Stored internally in hertz.

| Unit | Symbol | Hertz |
|---|---|---|
| hertz | Hz | 1 |
| kilohertz | kHz | 1 × 10³ |
| megahertz | MHz | 1 × 10⁶ |
| gigahertz | GHz | 1 × 10⁹ |

### 3.3 Time conversions (exact)
Stored internally in seconds. millisecond (ms) = 1 × 10⁻³ s.

### 3.4 Rounding and significant figures
- **Exact internal values.** All calculations use full floating-point precision.
  Rounding is applied **only at the display layer** (shared spec: *Store exact
  internal values and round only for display*). A "low graphics" or reduced-motion
  setting never changes a computed result.
- **Default display precision:** **3 significant figures**. Example: 343.2 m/s shown
  as "343 m/s"; 486.133 nm shown as "486 nm".
- **Very large / very small values** use scientific notation with 3 sig figs, e.g.
  `3.00 × 10⁸ m/s`, `5.00 × 10¹⁴ Hz`.
- **Whole-count quantities** (e.g. number of trials, dots) are shown as integers.
- Trailing zeros are preserved to show precision (e.g. "3.00 × 10⁸", not "3 × 10⁸").

### 3.5 Answer-checking tolerance
Answer checking compares the student's value to the exact internal value, **not** to
the display-rounded value, then applies tolerance:
- **Default numeric tolerance:** ±1% of the exact value, **or** ±1 in the last shown
  significant figure, **whichever is larger**. This absorbs legitimate rounding by
  students working to 3 sig figs.
- **Angles:** ±1° (protractor-readable).
- **Unit-only errors are never silently accepted.** A right number with the wrong or
  missing unit is marked incomplete with targeted feedback (shared spec: *Accept
  scientifically equivalent answers within stated rounding/format rules*, and
  *Positive feedback must validate the intended scientific answer*).
- **Out-of-scope, empty, malformed, or physically impossible answers** (e.g. negative
  distance, frequency 0 into f=v/λ, refracted angle > 90°) are never coerced into a
  pass; they return specific error feedback.
- Scientifically equivalent forms are accepted (e.g. `0.5 m` = `50 cm` = `500 mm`)
  once unit conversion is applied.

---

## 4. Transverse and longitudinal displacement conventions

- **Transverse wave:** particle displacement is **perpendicular** to the direction of
  wave propagation. Convention: propagation is drawn left→right (+x); particle
  displacement y is **vertical**, positive **upward**. Crest = maximum +y, trough =
  maximum −y, equilibrium = y 0. Amplitude = |max y|. Wavelength = crest-to-crest.
- **Longitudinal wave:** particle displacement is **parallel** to propagation.
  Convention: propagation +x (left→right); particle displacement is horizontal,
  **positive in the +x (forward) direction**, negative backward. A **compression** is
  where particles bunch closer than equilibrium spacing; a **rarefaction** is where
  they spread further apart. Wavelength = compression-to-compression.
- **Water-surface waves are not described as perfectly transverse** (app plan §4.1):
  the app labels them a special surface case (particles move in near-circular paths)
  and does not use them as the clean transverse exemplar.
- **Representation honesty:** the drawn sinusoidal curve for a longitudinal wave is a
  *graph of displacement (or pressure) versus position*, **not** the physical
  up-and-down path of the particles. This is enforced by the "representation trap"
  challenge (§4.2 of the plan) with feedback stating exactly this.

---

## 5. Particle oscillation vs wave propagation vs energy transfer

Three distinct ideas, kept visually and conceptually separate in every wave module:
1. **Particle oscillation** — individual medium particles vibrate *locally* about a
   fixed equilibrium position.
2. **Wave propagation** — the *pattern* (the shape / the phase) travels through the
   medium at wave speed v.
3. **Energy transfer** — energy is carried in the direction of propagation; **matter
   is not** carried with it.

Teaching guardrails (app plan §4.1, invariants §15/§20):
- Tagged particles oscillate and return to (approximately) their starting position
  after whole cycles: **net particle displacement ≈ 0** after an integer number of
  cycles in the ideal model (invariant, §20).
- The travelling **energy marker** must not be read as a travelling material object.
- The medium-particle view and the drawn wave curve are **different representations**
  of the same event, never the same thing.

---

## 6. Wave-medium assumptions and medium presets

### 6.1 General medium assumptions (stated simplifications)
- The medium is **uniform, non-dispersive, and lossless** unless damping/absorption
  is explicitly switched on. In the basic model wave speed does not depend on
  frequency (no dispersion) — a deliberate Year 10 simplification.
- Wave speed is a property of the **medium** (and its stated conditions), not of the
  source. Changing the source frequency does not change v.
- Amplitudes are kept within a **linear** range so that speed and shape are
  amplitude-independent (real large-amplitude/shock behaviour is out of scope, §12).

### 6.2 Mechanical-wave / sound medium presets
Speeds stored exactly; displayed to 3 sig figs. Each is a **labelled reference
approximation** at the stated conditions.

| Preset | Speed (m/s) | Reference conditions | Source | Review date |
|---|---|---|---|---|
| Sound in dry air | 343 | dry air, 20 °C, 1 atm (from v = 331.3·√(1+T/273.15)) | NIST / standard acoustics reference; ISO 9613-1 reference conditions | 2026-07-17 |
| Sound in fresh water | 1480 | fresh water, ≈20 °C | NIST / standard acoustics reference (fresh water ~1480 m/s at 20 °C) | 2026-07-17 |
| Sound in seawater | 1500 | seawater, ≈20 °C, typical salinity (nominal teaching value) | Standard oceanographic acoustics reference | 2026-07-17 |
| Sound in steel | 5960 | longitudinal (bar/bulk) wave in mild steel, ~20 °C | Standard engineering-materials acoustics reference | 2026-07-17 |
| Light/EM in vacuum | 3.00 × 10⁸ | vacuum; exact defined c = 299 792 458 m/s, rounded for teaching | CODATA / SI defining constant (exact by definition) | 2026-07-17 |

Notes:
- **Air temperature dependence** is offered as an optional preset using
  `v = 331.3 × √(1 + T/273.15) m/s` (T in °C), labelled a model; it is not used to
  claim calibrated measurement.
- Speed of sound in steel is quoted as the **longitudinal** value; the app does not
  teach separate shear-wave speeds (out of scope).
- Light speed is stored **exactly** (299 792 458 m/s) and displayed as
  3.00 × 10⁸ m/s. The vacuum value is used for EM in air too at Year 10 (air ≈ vacuum
  for speed); refractive index handles the small difference in optics (§9).

### 6.3 Invariants when a medium or wave property changes
Enforced and tested (app plan §15; expanded numeric tolerances in §20):
- **Amplitude changes nothing but amplitude** in the linear model — v, f and λ are
  unchanged (tolerance: |Δv|, |Δf|, |Δλ| < 0.1% of value).
- **Source sets frequency** — changing the source changes f (and therefore λ = v/f)
  but not v.
- **Medium sets speed** — changing the medium changes v (and therefore λ = v/f at
  fixed source f) but not f.
- **Wavelength always adjusts** so that v = fλ holds (tolerance: |v − fλ| /
  v < 0.5%).

### 6.4 Motion-context constant (reference only)
Where a vertical/weight context is chosen in the forces module, gravitational field
strength near Earth's surface is a labelled constant:

| Constant | Value | Conditions | Source | Review date |
|---|---|---|---|---|
| Gravitational field strength g | 9.8 N/kg (≈9.8 m/s²) | near Earth's surface, nominal | Standard NSW Year 10 teaching value | 2026-07-17 |

Kinematics modules are primarily horizontal 1D and do **not** require g.

---

## 7. Amplitude / frequency / wavelength / medium invariants (summary)

Consolidated statement of the linear-model invariants (tested per §20):
- Amplitude ⟂ everything else: amplitude changes amplitude (and relative energy)
  only.
- Source → frequency: f is set by the source.
- Medium → speed: v is set by the medium and its conditions.
- Wavelength is dependent: λ = v/f, keeping v = fλ true at all times.
- In sound specifically: the pitch representation follows f; the loudness/level
  representation follows amplitude; changing amplitude does not change pitch, and
  changing frequency does not change the amplitude control (§12, invariant §20).

---

## 8. Displacement–position vs displacement–time graphs

Both graph types look sinusoidal but mean different things; the app labels axes
unambiguously and never lets one stand in for the other.

- **Displacement–position (a "snapshot"):** displacement of every particle at **one
  instant**, plotted against position x. The horizontal repeat distance is the
  **wavelength λ**. Reading a wavelength requires this graph.
- **Displacement–time (a "single particle history"):** displacement of **one chosen
  particle** plotted against time t. The horizontal repeat distance is the **period
  T** (and f = 1/T). Reading a period/frequency requires this graph.
- **Mapping used by the point-probe tool:** a probe fixed at a position produces a
  displacement–time trace (→ T, f); a "freeze frame" ruler across the wave produces a
  displacement–position trace (→ λ). The two are linked by v = λ/T = fλ.
- **Common error addressed:** reading a period off a displacement–position graph (or
  a wavelength off a displacement–time graph). Feedback names which axis is which
  (misconception table §21).

---

## 9. Reflection, refraction, absorption, scattering, boundaries

### 9.1 Boundary model assumptions
- Boundaries are **flat and stationary** unless a curved-mirror/lens preset is chosen.
- Rays are drawn in the **ray model** (light as straight-line rays); the **wave
  model** (wavefronts) is available where it explains a phenomenon better.
- All angles are measured **from the normal** (the line perpendicular to the surface
  at the point of incidence), never from the surface. This is stated on every
  protractor readout.

### 9.2 Reflection
- **Law of reflection:** angle of reflection = angle of incidence (both from the
  normal). Enforced as an invariant (θ_r = θ_i within ±0.5°, §20).
- Presets: plane mirror (core); concave and convex mirrors as a **scaffolded
  extension** (image formation is qualitative at Year 10 — a mirror equation is not
  required).

### 9.3 Refraction — assumptions and invariants
- Refraction occurs because the wave **changes speed** when it crosses into a medium
  with a different optical density. The teaching model is *speed change → wavefront
  bend*, **not** "light tries to take the shortest path" (explicitly corrected, app
  plan §8.2, misconception table §21).
- **Frequency is constant** across a stationary boundary (the source still emits the
  same number of waves per second). Therefore **speed and wavelength change together**
  (v = fλ with f fixed): entering a denser medium ⇒ v down, λ down, f unchanged.
  Enforced as an invariant (§20).
- Light bends **toward** the normal entering a denser (higher-index) medium, and
  **away** from the normal entering a less dense one.
- **Snell's law is an optional extension** only: `n₁ sin θ₁ = n₂ sin θ₂`. When used,
  the engine computes with exact indices and checks answers to the §3.5 tolerance.
- **Total internal reflection (TIR):** occurs beyond the critical angle when going to
  a less dense medium; the critical angle satisfies `sin θ_c = n₂/n₁`. Used for the
  optical-fibre application. If the requested refraction is beyond θ_c, the engine
  returns TIR (no fictitious refracted ray — no false positive).

### 9.4 Absorption and scattering
- **Energy ledger:** for a surface/material interaction, transmitted + reflected +
  absorbed fractions **sum to 1** (invariant §20, tolerance 0.5%). Scattering is
  treated as redirected (not destroyed) energy within this ledger.
- **Scattering (atmosphere):** a conceptual particle-size model (shorter wavelengths
  scattered more → blue sky, red sunsets) presented qualitatively, labelled a model.
- **Stated caution:** the app does **not** claim "black objects always heat fastest
  under all conditions" — absorption/heating depends on the illuminant, surface, and
  surroundings; assumptions are shown (app plan §8.3, misconception table §21).

### 9.5 Curated refractive indices (Snell's law extension)
Refractive index n = c/v (ratio, dimensionless), for the sodium D-line (~589 nm)
unless noted. Stored exactly; displayed to 3 sig figs.

| Medium | n (≈589 nm) | Notes | Source | Review date |
|---|---|---|---|---|
| Vacuum | 1.000 | exact by definition | SI definition | 2026-07-17 |
| Air | 1.000 3 | ~0 °C–20 °C, 1 atm; treated as 1.00 in most Year 10 work | CRC Handbook of Chemistry and Physics | 2026-07-17 |
| Water | 1.33 | 20 °C | CRC Handbook | 2026-07-17 |
| Ice | 1.31 | ~0 °C | CRC Handbook | 2026-07-17 |
| Ethanol | 1.36 | 20 °C | CRC Handbook | 2026-07-17 |
| Acrylic (Perspex/PMMA) | 1.49 | typical | Manufacturer/optical-materials reference | 2026-07-17 |
| Crown glass | 1.52 | typical optical crown | CRC Handbook / Schott optical glass data | 2026-07-17 |
| Flint glass | 1.62 | typical dense flint | CRC Handbook / Schott optical glass data | 2026-07-17 |
| Diamond | 2.42 | 589 nm | CRC Handbook | 2026-07-17 |

Note: dispersion (n varying with wavelength) is not taught; a single index per
medium is used at Year 10, labelled as an approximation at ~589 nm.

### 9.6 Stage 4 surface-response teaching fixtures

The absorption/scattering investigation uses a **normalised teaching ledger**, not
measured spectrophotometer data. Only the conservation relationship
`transmitted + reflected + absorbed = 1` is a physical invariant. The response
fractions below are deliberately separated from curated constants: they are
modelled fixtures chosen to make controlled comparisons visible, are labelled
“model” everywhere in-app, and must never be quoted as a property of real glass,
paint, skin, sunscreen, or a named product.

| Surface model | Illuminant model | Transmitted | Reflected | Absorbed |
|---|---:|---:|---:|---:|
| Clear glass | Daylight | 0.90 | 0.08 | 0.02 |
| Smoked glass | Daylight | 0.10 | 0.08 | 0.82 |
| White matte | Daylight | 0.02 | 0.78 | 0.20 |
| Black matte | Daylight | 0.01 | 0.06 | 0.93 |
| UV-screen | Daylight | 0.62 | 0.12 | 0.26 |

Warm-LED and UV-rich variants remain modelled comparisons defined in
`src/science/optics.ts`; every row is unit-tested to sum to 1. Their purpose is
to show that the result depends on both surface and illuminant. Heating rate is
**not** computed: convection, heat capacity, geometry, exposure and surroundings
are outside this model. “D65” is not claimed because the app does not implement a
calibrated colour-matching or spectral-power-distribution calculation.

---

## 10. Optical energy and ray/wave model limits

- **Ray model** treats light as straight rays; it explains reflection, refraction,
  image position, mirrors, lenses, fibres. It **cannot** explain colour-by-wavelength,
  scattering, or spectra by itself.
- **Wave model** treats light as wavefronts of a given wavelength; it explains
  refraction as speed change, dispersion/colour, scattering, and spectra. Diffraction
  and interference are **out of scope** (not required; not modelled) — stated as a
  limitation.
- Neither model uses photons quantitatively at Year 10; "photon energy" appears only
  as a **qualitative trend** across the EM spectrum (§5, §11).
- **Energy fractions** (transmitted/reflected/absorbed) sum to 1 (§9.4 invariant).

---

## 11. Electromagnetic spectrum model boundaries

- A **continuous, zoomable** spectrum (not seven separate boxes). Region boundaries
  (radio, microwave, infrared, visible, ultraviolet, X-ray, gamma) are labelled
  **approximate and overlapping** (app plan §5).
- For any selected point the app shows wavelength, frequency, and a **qualitative**
  photon-energy trend, sources/detectors, interactions with matter/tissue/atmosphere,
  uses, and whether it is **ionising in the app's stated teaching classification**
  (UV high end, X-ray, gamma treated as ionising; radio–visible non-ionising).
- Guardrails (misconception table §21): avoid "higher frequency is always more
  dangerous"; avoid "all radiation is radioactive". Ionising ≠ radioactive.
- Visible light reference band used by the app: **≈400 nm (violet) to ≈700 nm (red)**.

| Reference edge | Value | Source | Review date |
|---|---|---|---|
| Visible short edge (violet) | ≈400 nm | Standard optics reference (visible ~380–400 nm lower edge) | 2026-07-17 |
| Visible long edge (red) | ≈700 nm | Standard optics reference (visible ~700–750 nm upper edge) | 2026-07-17 |

EM region band edges are stored as **approximate** ranges with the same "standard
optics/physics reference, 2026-07-17" provenance and are labelled approximate in-app.

### 11.1 Stage 6 EM fixtures (as built)

`src/science/emSpectrum.ts` stores a continuous logarithmic teaching span from
10³ m to 10⁻¹² m. The named-region edges are approximate, overlap in real
classification systems and are navigation/classification aids—not seven distinct
physical wave types. The representative wavelengths used to jump to regions are
1 m, 10⁻² m, 10 µm, 550 nm, 200 nm, 0.1 nm and 0.001 nm. Every selected position
uses the exact stored `c = 299 792 458 m/s` relationship; display rounds only at
the UI boundary.

The Stage 6 region dataset records a qualitative energy trend, common source,
detector, interactions, applications and risk control with review date. The app
treats ultraviolet, X-ray and gamma as ionising in its explicit Year 10 teaching
classification while stating that boundary conventions and UV energy vary. It
never equates ionising with radioactive or treats “non-ionising” as “harmless”.

---

## 12. Sound: pitch, loudness, intensity, hearing, Doppler, ultrasound

### 12.1 Pitch, loudness, intensity/amplitude
- **Frequency → perceived pitch** (higher f ⇒ higher pitch). **Amplitude/intensity →
  perceived loudness.** These are kept on separate controls and separate readouts.
- **"Volume" is a control setting; "loudness" is a perception.** The app never claims
  to measure calibrated sound-pressure level (dB SPL) — no hardware calibration
  exists (app plan §6.2). Any level shown is a **relative model level**.
- Hearing response is **not linear**: equal-amplitude tones at different frequencies
  may not sound equally loud (stated; not quantified with equal-loudness contours at
  Year 10).
- Invariants (§20): changing amplitude does not change the pitch representation;
  changing frequency does not change the amplitude control.

### 12.2 Hearing / ear model boundary
- The ear cutaway is an **SVG data-driven diagram**, not generated anatomy. It shows
  the pathway outer ear → canal → eardrum → ossicles → oval window → cochlear fluid →
  hair cells → auditory nerve → brain, with a simplified frequency-place map in the
  cochlea.
- Boundary: **no medical diagnosis**; hearing-protection context only. **Optical
  image formation of the ear is not relevant**; the "mechanical → fluid → electrical"
  transduction ladder is the model.

### 12.3 Doppler model boundary
- **1D arrival-timing model** first (optional 2D view). The observed frequency change
  arises from **wavefront arrival timing**, not from any change in the source.
- Guardrails (invariants §20): the **source frequency never changes** merely because
  the source moves; **wave speed stays fixed relative to the medium**; **sonic boom /
  supersonic shock is out of scope** and must not be conflated with ordinary Doppler
  shift (app plan §6.3).
- Detected interval and detected-frequency graph are computed from the configured
  source speed, observer speed, and medium wave speed; Doppler arrival intervals must
  match that kinematics model (invariant §20).

### 12.4 Ultrasound model boundary
- A **synthetic tissue phantom** only. Students send pulses and interpret return
  time/amplitude to locate boundaries; depth ≈ (speed × echo-time) / 2 (pulse-echo
  concept, qualitative).
- Trade-off taught qualitatively: higher frequency → better resolution but less
  penetration; coupling gel reduces reflection at the skin.
- Boundary: **no real patient data, no medical diagnosis, no claim of clinical
  accuracy** (app plan §7.3).

Stage 6 uses a clearly labelled synthetic teaching fixture. The assumed soft-
tissue sound speed is **1540 m/s**, consistent with US FDA device summaries that
describe diagnostic systems estimating ultrasound propagation in tissue at
1540 m/s (FDA 510(k) K102901; reviewed 2026-07-20). The three synthetic phantoms
contain authored boundary depths from 20–95 mm and relative echo strengths from
0.25–0.80; these are not measurements or patient data. Probe frequency is limited
to 2–12 MHz and teaches only the qualitative resolution/penetration trade-off.
Probe angle is −45° to +45° and applies a labelled `cos²(angle)` relative echo-
visibility fixture; it does not model refraction, beam shape or clinical settings.
Depth is calculated exactly from round-trip time: `depth = speed × time / 2`.

### 12.5 Web Audio safety contract
Mandatory (shared spec: *Privacy, security, and safety*; app plan §6.2):
- **User-initiated only** — sound starts solely after an explicit "Enable sound"
  action; **no autoplay**.
- **Default muted**, and starts at a **safe low level**.
- **Capped gain** — a hard maximum on output so a slider cannot reach a harmful level.
- **Headphone warning** shown before enabling.
- **Always an equivalent visual representation** (oscilloscope/level/spectrum) so the
  activity is fully usable with sound off (visual-only mode) and for deaf/hard-of-
  hearing students.
- Fallback if Web Audio is unavailable: the module runs in visual-only mode with a
  clear notice (§22).

---

## 13. Light: ray-model and wave-model limitations
Covered in §10 (ray vs wave scope, no diffraction/interference, qualitative photon
energy only, energy-fraction invariant). Additional statement: mirror/lens image
formation is **qualitative** at Year 10 — the app may show image position and
upright/inverted, enlarged/reduced, real/virtual, but does not require the
mirror/lens equation (offered only as an extension if at all).

---

## 14. Eye, image formation, perception, and stellar spectra

### 14.1 Eye and image-formation boundary
- The eye is an **SVG data-driven model** (cornea, aqueous humour, iris, pupil, lens,
  ciliary muscles, vitreous humour, retina, fovea, optic nerve). It models pupil
  response, accommodation (lens focus), and retinal image formation.
- **Optical image formation is kept separate from neural perception.** The app does
  **not** state "the brain simply flips the image" as a complete explanation (app
  plan §9.1); it presents image formation (optics) and interpretation (neural)
  as two linked but distinct stages.
- Focusing problems are optional extension, **not medical advice**.
- Stage 4 uses only **relative teaching outputs** for pupil opening, accommodation,
  retinal-image size and focus error. It does not display a pupil diameter in
  millimetres or claim an individual physiological response. Brightness 0–100%
  maps monotonically to a relative pupil opening of 100–25%; this is a visible
  teaching interpolation, not a biometric equation. Accommodation demand is a
  normalised inverse-distance model over the supported 10 cm–10 m range. A
  ±5 percentage-point focus band is a UI classification threshold, not a clinical
  tolerance. These equations are stored in `src/science/vision.ts` and labelled
  “relative model” in-app.

### 14.2 Stellar-spectrum boundary
- A virtual **multiwavelength observatory** with curated datasets. Continuous spectra
  → temperature/colour trend; absorption/emission lines → composition; red/blueshift
  → motion evidence; atmospheric windows → reason for space telescopes.
- **Real spectral-line positions** are used for identification and are curated with
  sources. Generated nebula/star imagery is **decorative only**, never measurement
  data (shared spec image-generation rules).

### 14.3 Curated spectral lines (H, He, Na)
Wavelengths in air, visible range, stored exactly; displayed to 4 sig figs where the
teaching activity distinguishes nearby lines (e.g. the Na doublet), else 3 sig figs.

| Element | Line | Wavelength (nm) | Source | Review date |
|---|---|---|---|---|
| Hydrogen | H-alpha (Balmer) | 656.3 | NIST Atomic Spectra Database | 2026-07-17 |
| Hydrogen | H-beta (Balmer) | 486.1 | NIST Atomic Spectra Database | 2026-07-17 |
| Hydrogen | H-gamma (Balmer) | 434.0 | NIST Atomic Spectra Database | 2026-07-17 |
| Hydrogen | H-delta (Balmer) | 410.2 | NIST Atomic Spectra Database | 2026-07-17 |
| Helium | yellow (D₃) | 587.6 | NIST Atomic Spectra Database | 2026-07-17 |
| Helium | green | 501.6 | NIST Atomic Spectra Database | 2026-07-17 |
| Helium | blue | 447.1 | NIST Atomic Spectra Database | 2026-07-17 |
| Sodium | D₂ | 589.0 | NIST Atomic Spectra Database | 2026-07-17 |
| Sodium | D₁ | 589.6 | NIST Atomic Spectra Database | 2026-07-17 |

Note: values are air wavelengths; a human reviewer must confirm each against the
NIST Atomic Spectra Database on the review date before release.

### 14.4 Stage 6 astronomy fixtures (as built)

The observatory offers three explicitly curated examples: the Sun as a teaching
reference, a generic hot blue-star model and a generic cool red-star model. The
latter two are labelled models, never represented as measured individual-star
spectra. Each example uses only a subset of the NIST line list above and links
every composition claim to that table.

The signed radial-velocity teaching control is limited to −300…+300 km/s. For
this small fraction of `c`, the app uses the labelled non-relativistic
approximation `λ_observed = λ_rest(1 + v/c)`: negative is approaching/blueshift,
positive is receding/redshift and zero preserves the rest wavelength. The line
inspector identifies a catalogue line only within ±0.25 nm; otherwise it reports
“No catalogued line here”. The activity does not infer abundance, exact stellar
temperature or velocity from decorative imagery.

---

## 15. Kinematics sign conventions and graph rules

### 15.1 Sign convention
- **One-dimensional, signed convention.** The **positive direction is
  student-selectable** (the track laboratory lets the student choose which way is +).
  Once chosen, displacement, velocity, and acceleration all take signs relative to it.
- **Distance and speed are scalars (≥ 0)**; **displacement and velocity are signed**;
  **acceleration is signed**. A negative acceleration means "directed the negative
  way", which only means "slowing down" when velocity is positive (§16, §20).

### 15.2 Graph gradient and area rules (taught at Year 10)
- **Gradient (slope) of a distance–time graph = speed.** A straight line ⇒ constant
  speed; steeper ⇒ faster; horizontal ⇒ at rest.
- **Gradient of a displacement–time graph = velocity** (sign included).
- **Gradient of a velocity–time graph = acceleration.**
- **Area under a velocity–time graph = displacement** (offered as an extension; kept
  to simple rectangles/triangles — no integration).
- A distance–time or velocity–time graph is **not** a literal picture of the path /
  a hill (misconception table §21).
- Notation: `v_av = Δs/Δt` aligned to syllabus notation; the app clarifies whether s
  denotes displacement (signed) or distance in the chosen convention, and also shows
  `average speed = total distance / total time` when distance is used (app plan §10.3).

### 15.3 Stage 5 teaching-model fixtures (as built)

These values make the deterministic classroom model readable; they are not empirical
constants.

- The physical track is `−20 m … +20 m`. The coordinate origin can be placed from
  `−10 m … +10 m` and defaults to `0 m`; physical right is the internal axis and
  the student-selected positive direction derives displayed signs.
- **Position** is relative to the selected coordinate origin. **Displacement** is
  relative to the run start. They are deliberately not aliases.
- Move/step commands advance the exact constant-velocity model by `1.0 s`. The
  default move speed is `2.0 m/s`; speed controls are limited to `0 … 10 m/s`.
  Pause, turn, speed-up and slow-down alter state without advancing time. There is
  no frame-rate integration or autoplay, so keyboard stepping is the canonical
  model and is also the reduced-motion equivalent.
- Motion diagrams allow `2 … 8` equal-time positions at `0.1`, `0.2`, `0.5` or
  `1.0 s` intervals (default `0.2 s`). Changing interval relabels existing dots
  without moving them. Pattern checks use `0.1 m` rest/constant-gap absolute
  tolerance, `15%` relative constant-gap tolerance, and `0.05 m` monotonic-gap
  separation for acceleration/deceleration.
- The graph investigation records exact timed distance trials with speed
  `0.5 … 5.0 m/s` and duration `1 … 10 s`. SVG plots always have a semantic table
  equivalent; slope uses two distinct stored points.

---

## 16. (reserved — see §15 for sign conventions)
Sign conventions are consolidated in §15; this section intentionally references
§15 to avoid duplication.

---

## 17. Forces, net force, Newton's laws, friction, cart

### 17.1 Force-vector and net-force model
- **1D signed forces** placed directly on **one selected object** (free-body
  diagram). Student chooses the positive direction; **net force `F_net = ΣF`** is the
  signed sum (invariant §20).
- Supported force types (only when contextually appropriate): applied/thrust,
  friction, drag, tension, normal/support, weight. Weight/normal appear only in a
  chosen vertical/support context (§6.4).

### 17.2 Newtonian assumptions
- `F_net = m a` in the ideal model (invariant §20). `a = Δv/Δt` from data (invariant).
- **No force is needed to maintain constant velocity** when net force is zero
  (Newton's first law) — explicitly taught and corrected (misconception §21).
- **Balanced forces may act on a moving object** (constant velocity).
- **Acceleration follows net force, not velocity direction.**
- **Newton's third-law pairs act on different objects** and therefore **do not cancel**
  on one free-body diagram (invariant §20: equal, opposite, attached to different
  objects).
- **Heavier objects do not automatically have greater acceleration** under the same
  net force (a = F_net/m).

### 17.3 Friction and the cart investigation
- Friction is modelled as an opposing force (toggleable). In **ideal mode** the cart
  is frictionless/deterministic; friction, when on, is a simple constant opposing
  force (no static-vs-kinetic distinction required at Year 10 — stated simplification).
- The cart investigation tests a ∝ F_net at fixed m, and a ∝ 1/m at fixed F_net, with
  controlled variables, repeat trials, tables, and graphs (§18, invariants §20).

### 17.4 Stage 5 force/cart/application fixtures (as built)

- Force diagrams contain one named object and at most six forces. Magnitude is
  structurally non-negative (`0 … 50 N` in the builder); physical left/right is
  stored separately from the selected coordinate sign. Normal is available only
  in the supported context; weight only in supported/vertical contexts.
- Cart applied force is `0 … 20 N` (default `2.0 N`) and mass is `0.1 … 10 kg`
  (default `1.0 kg`). Ideal frictionless/no-noise mode is the reset state.
- The optional friction fixture is a constant maximum `0.5 N` opposing the applied
  force. From rest it is capped at the applied force, so it can reduce net force to
  zero but never spontaneously propel the cart backwards. This is not a measured
  coefficient or a static/kinetic friction model.
- Each ideal sensor log contains velocity samples at `0, 1, 2, 3, 4 s`, calculated
  from exact acceleration. The two controlled series are acceleration against net
  force at fixed mass and acceleration against inverse mass at fixed force.
- The six Newton cases are seatbelt, pushing carts, walking, balloon, collision and
  spacecraft. Only walking carries an authorised numeric fixture: the foot–Earth
  interaction pair is `400 N` equal/opposite on different objects. Every other case
  is qualitative/modelled and displays no fabricated magnitude.

---

## 18. Deterministic mode and seeded measurement-noise mode

- **Ideal (deterministic) mode is the default.** Given the same inputs, results are
  bit-for-bit reproducible; all invariants (§20) are tested in this mode.
- **Optional seeded measurement-noise mode** adds realistic scatter to *measured*
  values (e.g. timing, sensor reads) using a **seeded pseudo-random number
  generator**. Same seed ⇒ same sequence ⇒ reproducible "experiment" (shared spec:
  *Use seeded pseudo-randomness where variation is pedagogically useful*; investigation
  contract: *deterministic seeded mode for reproducibility*).
- Noise is applied only to the **measurement layer**, never to the underlying
  scientific state; turning noise off restores exact ideal values. Random motion is
  **never** used as a substitute for a scientific model.
- Stage 5 cart noise uses default seed `4471` and a uniform deterministic offset of
  `±max(0.02 m/s², 3% of the ideal acceleration magnitude)`. The visible seed and
  repeat index reproduce the sequence bit-for-bit. Ideal acceleration and the
  velocity–time state are identical with noise on or off.

---

## 19. Supported data and input ranges

All controls are clamped to these ranges; out-of-range input is rejected with
feedback, never silently coerced (shared spec interaction-integrity). Ranges are
teaching-sensible, not the full physical extent.

| Domain | Control | Supported range | Notes |
|---|---|---|---|
| Waves | frequency f | 0.1 Hz – 20 kHz (general wave lab) | audible sound sub-range 20 Hz–20 kHz |
| Waves | wavelength λ | derived λ = v/f | dependent, not directly set in default model |
| Waves | amplitude A | 0 – A_max (linear range) | A_max chosen per module; stays linear |
| Waves | wave speed v | set by medium preset (§6.2) | not free unless "custom medium" chosen |
| Sound (Web Audio) | tone frequency | 20 Hz – ~16 kHz | safe audible range; capped |
| Sound | output level | 0 – capped max | relative, not calibrated dB |
| EM spectrum | wavelength | ~10³ m (radio) – ~10⁻¹² m (gamma) | logarithmic axis; approximate edges |
| Doppler | source/observer speed | 0 – < wave speed v | must stay subsonic (sonic boom out of scope) |
| Optics | angle of incidence | 0° – 90° from normal | 90° = grazing; TIR handled beyond θ_c |
| Optics | refractive index | 1.00 – 2.42 (curated set) | §9.5 media only, unless custom |
| Motion | position | −track length … +track length | origin student-set |
| Motion | velocity | signed, module-dependent (e.g. −10 … +10 m/s) | 1D signed |
| Motion | acceleration | signed, module-dependent | 1D signed |
| Motion | time | 0 – trial duration (s) | |
| Forces | cart mass m | 0.1 – 10 kg | default 1.0 kg; mass must be strictly positive |
| Forces | cart applied force | 0 – 20 N | default 2.0 N; net force is derived after friction |
| Forces | force-builder magnitude | 0 – 50 N plus separate direction | maximum six forces; 1D signed display |

Angles are always 0–90° measured from the normal (optics) or as track directions
(motion). Mass is strictly positive; a zero or negative mass is rejected (F=ma
undefined).

---

## 20. Scientific invariants and edge cases (with numeric tolerances)

Mirrors app plan §15, expanded with tolerances. Each is covered by an automated test.

| # | Invariant | Tolerance / edge handling |
|---|---|---|
| 20.1 | `v = fλ` holds | \|v − fλ\| / v < 0.5% |
| 20.2 | Tagged medium particles have ≈0 net displacement after whole cycles (ideal) | \|net displacement\| < 1% of amplitude after N whole cycles |
| 20.3 | Amplitude change alone does not change v or f (basic model) | \|Δv\|/v < 0.1%, \|Δf\|/f < 0.1% |
| 20.4 | Sound frequency control changes pitch representation, not amplitude | amplitude output unchanged to < 0.1%; pitch metric tracks f |
| 20.5 | Doppler arrival intervals match configured kinematics | detected interval matches model within < 0.5% |
| 20.6 | Reflection angle = incidence angle | \|θ_r − θ_i\| < 0.5° |
| 20.7 | Refraction satisfies chosen law; frequency constant at boundary | Snell residual < 0.5%; \|Δf\|/f < 0.1%; beyond θ_c ⇒ TIR (no refracted ray) |
| 20.8 | Optical energy fractions (T+R+A) sum to 1 | \|(T+R+A) − 1\| < 0.5% |
| 20.9 | Distance ≥ 0 and distance ≥ \|displacement\| | strict; violation is a hard test failure |
| 20.10 | Graph slopes match configured motion | slope vs configured value within < 1% |
| 20.11 | 1D vector forces sum correctly (F_net = ΣF) | exact within floating-point; display 3 s.f. |
| 20.12 | `F_net = m a` and `a = Δv/Δt` in ideal runs | residual < 0.5% in ideal mode |
| 20.13 | Third-law forces equal, opposite, on different objects | \|F_AB + F_BA\| / \|F_AB\| < 0.1%; object IDs differ |
| 20.14 | All displayed units and conversions dimensionally valid | unit-checker passes; no bare numbers on axes/readouts |
| 20.15 | `T = 1/f` consistency | \|T·f − 1\| < 0.1% |

**Edge cases explicitly handled:** f = 0 or λ = 0 into division (returns "undefined",
no ∞); mass ≤ 0 (rejected); refraction request beyond critical angle (returns TIR);
angle exactly 90° (grazing incidence, handled without NaN); observer/source speed ≥
wave speed (rejected as out of scope — sonic boom excluded); empty/malformed answer
strings (specific error, never a pass).

---

## 21. Common misconceptions

One consolidated table: misconception → correct statement → where the app addresses
it. Covers the misconceptions flagged across the app plan and shared spec (≥10).

| # | Misconception | Correct Year 10 statement | Where addressed |
|---|---|---|---|
| 1 | Particles travel along with the wave | Particles oscillate locally about equilibrium; only the pattern and energy travel | Wave foundations §4.1; tagged-particle view; invariant 20.2 |
| 2 | A pressure/displacement graph shows the physical path of particles | The graph is displacement/pressure vs position or time, not the particle's path | "Representation trap" §4.2; §8 graph mapping |
| 3 | Bigger amplitude means higher frequency/pitch or faster wave | Amplitude is independent; it changes energy/loudness only, not f, v or pitch | Wave lab §4.3; sound §6.2; invariants 20.3, 20.4 |
| 4 | "Volume" and "loudness" are the same measured thing | Volume is a control setting; loudness is perception; app shows relative level, not calibrated dB | Sound §12.1 |
| 5 | A moving sound source actually emits a different frequency (Doppler) | Source frequency is unchanged; observed change is from wavefront arrival timing | Doppler §12.3; invariant 20.5 |
| 6 | Higher-frequency EM is always more dangerous / all radiation is radioactive | Risk depends on ionising ability and dose; ionising ≠ radioactive | EM spectrum §11 |
| 7 | Light bends because it "takes the shortest path" | Light bends because its speed changes at the boundary; wavefronts turn | Refraction §9.3 |
| 8 | Frequency changes when light enters glass/water | Frequency is constant at a stationary boundary; speed and wavelength change | Refraction §9.3; invariant 20.7 |
| 9 | Black objects always heat up fastest in every situation | Absorption/heating depends on illuminant, surface and surroundings; state assumptions | Absorption/scattering §9.4 |
| 10 | The brain simply "flips" the retinal image (complete explanation) | Optical image formation and neural interpretation are separate, linked stages | Eye/vision §14.1 |
| 11 | A distance–time or velocity–time graph is a picture of the path/hill | The graph shows how a quantity changes over time; slope has meaning, shape is not the route | Graph lab §15.2 |
| 12 | Negative acceleration always means slowing down | Sign shows direction; it means slowing only when velocity is positive | Kinematics §15.1; invariant 20.10 |
| 13 | A moving object must have a force pushing it / needs force to keep constant velocity | Constant velocity needs zero net force (Newton's first law) | Newton's laws §17.2 |
| 14 | Newton's third-law pairs cancel out | The pair acts on different objects, so they never cancel on one free-body diagram | Force studio §17.2; invariant 20.13 |
| 15 | Heavier objects always accelerate more under the same push | a = F_net/m, so more mass gives less acceleration for the same net force | Cart investigation §17; invariant 20.12 |
| 16 | Distance and displacement (or speed and velocity) are the same | Distance/speed are scalars ≥ 0; displacement/velocity carry direction | Track lab §15; invariant 20.9 |

---

## 22. Safety notes

- **Audio levels:** all sound is user-initiated, default muted, starts low, gain is
  hard-capped below harmful levels, and a **headphone warning** is shown before
  enabling (§12.5). No autoplay. A visual equivalent is always available.
- **No flashing:** animations avoid content that could trigger photosensitive
  responses (shared spec accessibility: avoid flashing).
- **Virtual investigations never replace real practical work.** Every investigation
  states plainly that it does **not** replace supervised hands-on practical work,
  teacher supervision, PPE, local risk assessment, or approved school procedures
  (investigation contract). The app gives no instructions that enable unsafe
  electrical, chemical, laser/optical, or medical activity.
- **No medical use:** ear, eye, and ultrasound modules give **no diagnosis** and must
  not be presented as clinical tools (§12.2, §12.4, §14.1).

---

## 23. Accessibility alternatives per simulation category

Target WCAG 2.2 AA (shared spec). Every Canvas/WebGL/audio scene has a text/tabular
equivalent so no meaning depends on colour, sound, animation, hover, or 3D alone.

| Simulation category | Accessible alternative |
|---|---|
| Wave animations (transverse/longitudinal, medium/vacuum) | Data table of amplitude, wavelength, frequency, period, speed; text description of particle vs pattern motion; reduced-motion static frames |
| Wave measurement lab | Numeric readouts + results table (λ, f, v, T) usable without reading the animation; keyboard-set probes |
| EM spectrum explorer | Table of region, wavelength, frequency, energy trend, sources, uses, ionising flag; text for the selected point |
| Sound (pitch/loudness, oscilloscope, spectrum) | Visual-only mode; on-screen numeric frequency/level; text of pitch/loudness relationship; captions for any audio |
| Doppler | Detected-frequency table and text (approach/pass/recede); works fully with sound off |
| Ear / ultrasound | Labelled SVG with text pathway list; echo depth table; no audio required |
| Optics (reflection/refraction/absorption) | Angle and energy-fraction table; text statement of law used; keyboard angle entry |
| Eye / vision | Labelled structure list and text of image-formation vs perception stages |
| Stellar spectra | Table of line wavelength → element; text of temperature/composition/motion inference |
| Motion (track, diagrams, graphs) | Position/time/velocity/acceleration table; text motion story; described graph slopes |
| Forces (studio, cart) | Force list with signed values and net force; a–F and a–m data tables; text of Newton's-law reasoning |

All categories: full keyboard operation, visible focus, ≥44×44 px targets, semantic
labels/headings/tables, `prefers-reduced-motion` and low-graphics honoured (results
unchanged), 200% zoom and tablet landscape supported, accessible status
announcements for important state changes.

---

## 24. Canvas / WebGL / Web Audio / storage / service-worker fallback behaviour

Degraded-capability behaviour is mandatory and tested (shared spec quality gates:
*degraded-capability tests*).

| Capability | Failure / unavailable behaviour |
|---|---|
| **Canvas 2D** | If unavailable, the module shows its tabular/text equivalent (§23) and a clear notice; no blank "simulation canvas area" placeholder is shown. |
| **WebGL / 3D** | Optional 3D (e.g. ear orientation) degrades to the 2D SVG view automatically; all learning content remains via 2D/data. WebGL is never required for core learning. |
| **Web Audio** | Absent or blocked ⇒ visual-only mode (oscilloscope/level/spectrum + numeric readouts) with a notice; no silent failure, no autoplay attempt. Default is muted regardless. |
| **Local storage / IndexedDB** | If unavailable or full, progress features degrade to session-only; the app keeps working, shows a "progress can't be saved" notice, and never blocks learning. Imported progress is sanitised and size-capped. |
| **Service worker / offline** | If registration fails, the app runs online-only with an update/notice; core learning still loads. Service worker uses explicit versioning with an update prompt; a failed update never bricks the app. |
| **Reduced motion / low graphics** | Honoured via `prefers-reduced-motion` and an in-app toggle; reduces animation/particle counts only — **never changes computed results**. |
| **No network after first load** | Core learning routes remain available offline (static-first PWA); no runtime CDN or generative-model calls. |

General rule (shared spec interaction-integrity): no dead control, no placeholder
labelled as a working explorer/lab, no false-positive answer. If a feature is
unavailable, its control is removed or clearly labelled non-interactive — never faked.

---

## 25. Teacher sign-off checklist (Irvin)

Tick each item only when confirmed against the app and this document on the review
date. Completion claims must be backed by evidence, not narration.

**Definitions, units, and maths**
- [ ] All quantity definitions and SI units (§1) are correct for NSW Year 10 and shown on every control/readout/axis.
- [ ] `v = fλ` and its rearrangements (λ = v/f, f = v/λ) compute correctly, with division-by-zero guarded (§2, §20.1).
- [ ] Unit conversions (m/cm/mm/µm/nm; Hz/kHz/MHz/GHz; s/ms) are exact; display uses 3 s.f.; answer tolerance behaves as specified (§3).

**Waves**
- [ ] Transverse/longitudinal conventions and the "representation trap" are scientifically correct (§4).
- [ ] Particle oscillation, wave propagation, and energy transfer are clearly separated (§5); net particle displacement ≈ 0 after whole cycles (§20.2).
- [ ] Amplitude/source/medium/wavelength invariants hold (§6.3, §7, §20.3).
- [ ] Displacement–position vs displacement–time graphs are labelled and mapped correctly (§8).

**Constants and data (each verified against its cited source, 2026-07-17)**
- [ ] Sound speeds — air 343, fresh water 1480, seawater 1500, steel 5960 m/s (§6.2).
- [ ] Light speed c = 3.00 × 10⁸ m/s (exact 299 792 458) (§6.2).
- [ ] Refractive indices for the ~9 curated media (§9.5).
- [ ] Spectral lines for H, He, Na against NIST ASD (§14.3).
- [ ] Gravitational field strength g = 9.8 N/kg where used (§6.4).

**Light, sound, vision**
- [ ] Reflection/refraction/absorption/scattering models, boundary assumptions, frequency-constant-at-boundary, TIR, and energy ledger are correct (§9, §10, §20.6–20.8).
- [ ] EM spectrum boundaries labelled approximate; ionising ≠ radioactive handled (§11).
- [ ] Pitch/loudness/intensity, ear, Doppler (1D arrival timing, source f fixed, sonic boom excluded), and ultrasound boundaries are correct (§12).
- [ ] Eye separates optical image formation from neural perception; stellar spectra use real lines (§14).

**Motion and forces**
- [ ] 1D signed conventions and graph gradient/area rules are correct (§15).
- [ ] Net force, F = ma, a = Δv/Δt, friction, third-law pairs on different objects, and cart investigation behave correctly (§17, §20.11–20.13).
- [ ] Deterministic ideal mode is reproducible; seeded noise mode is optional and reproducible and never alters underlying state (§18).

**Ranges, safety, accessibility, robustness**
- [ ] Every control's input range (§19) is clamped; out-of-range/invalid input is rejected, never coerced to a pass.
- [ ] All invariants and edge cases (§20) pass automated tests.
- [ ] The misconception coverage (§21, ≥16 items) is addressed where stated.
- [ ] Web Audio is user-initiated, default muted, gain-capped, with headphone warning and a visual equivalent (§12.5, §22).
- [ ] Every investigation states it does not replace supervised practical work; no unsafe instructions (§22).
- [ ] Each simulation category has a working tabular/text accessibility alternative (§23).
- [ ] Canvas/WebGL/Web Audio/storage/service-worker fallbacks behave as specified with no faked controls (§24).
- [ ] Momentum content is absent (out of scope).

**Overall**
- [ ] I, Irvin Cisneros, confirm the scientific content, constants (with sources and 2026-07-17 review date), feedback, and model limitations are accurate and appropriate for NSW Year 10. Signed: ____________________ Date: __________
