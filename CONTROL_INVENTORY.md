# Control Inventory — WaveMotion Studio

Source of truth for every planned interactive control in the release-scope app. Derived
from `YEAR_10_WAVES_MOTION_APP_PLAN.md` §4–§12, `SCIENCE_SIMULATOR_SUITE_SHARED_SPEC.md`
("Shared student experience", "Shared teacher experience", accessibility standard), and the
stage roadmap in `docs/plans/2026-07-17-wavemotion-orchestration-plan.md` Part C. The executable
runtime parity check in `tests/e2e/control-inventory.spec.ts` parses the stable IDs documented
here, visits every shipped route, and rejects undocumented rendered IDs, duplicate non-repeatable
IDs, unnamed interactive elements, or rendered deferred cultural controls. Observable effects,
keyboard flows and scientific behaviour remain the responsibility of the named route-specific
browser specs; the parity check does not pretend to replace them.

## Conventions

- **ID**: stable kebab-case, `<workspace>.<control>`. IDs never change once assigned; a
  retired control's ID is marked `retired`, never reused.
- **Build stage**: S1–S6 per Part C of the orchestration plan. `S3*` marks EM Spectrum, whose
  stage is not explicitly named in Part C's roadmap table — it is inferred here as paired with
  the Sound group (S3) because it extends the wave-measurement engine built in S2 and needs no
  audio work of its own. **Confirm this placement with Irvin at the Stage 2→3 approval gate.**
  `S6-deferred` marks the cultural sound-material investigation (7.2.5), which is blocked on
  Irvin-supplied sources and must not ship with placeholder controls in the interim — its row
  exists here only as forward planning.
- **Global/shared controls** (pause, step, slow-motion, reset, presets, enable-sound,
  reduced-motion, low-graphics, presentation mode) are defined once in §1 and referenced by ID
  from every workspace that uses them — not redefined per workspace.
- **Accessible name** is the exact proposed `aria-label` / accessible-name text (quoted).
  Every name must be unique within its route; duplicate names across a route are a build defect.
- **Keyboard behaviour** states the reachable order (Tab/Shift+Tab), activation keys, and any
  arrow-key/Home/End stepping. Every control must be operable without a mouse per WCAG 2.2 AA.
- **Units / current-value display** states the live text shown adjacent to the control and
  when it updates. No control that represents a physical quantity may omit visible units.
- **Reset behaviour** states exactly what state the control returns to and whether the reset
  is announced to assistive technology.
- **Error handling** states validation rules and what happens on invalid/out-of-range/empty
  input — values must clamp or reject, never silently coerce to a "correct" state.
- **Fallback** states behaviour when Canvas, WebGL, Web Audio, or localStorage is unavailable.
  Controls with no rendering dependency are marked "N/A — plain HTML control, no fallback
  needed."
- **Browser evidence** names a real Playwright spec and summarises the relevant assertion;
  text after `›` is an evidence description, not necessarily a literal test title. The
  route-specific specs may exercise several related rows in one end-to-end learning task.
  Every active-release row must resolve to one of those real specs before its stage closes.

---

## 1. Global and shared controls

These are implemented once as shared components in Stage 1 and wired into each workspace at
that workspace's own build stage. Workspace sections below reference these IDs rather than
redefining them.

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `global.pause-button` | Toggle button | Freezes/resumes the active simulation's animation clock; science state is retained, only render advancement stops | "Pause simulation" / "Resume simulation" (name swaps with state) | Tab-reachable; `Space`/`Enter` toggles; also bound to keyboard shortcut `P` when a simulation canvas has focus | Icon + text label reflects current state; no numeric value | Not resettable itself — returns to "running" whenever the workspace's own reset fires | N/A — boolean toggle, no invalid state | If Canvas/WebGL unavailable, the paired text/data view (already static) ignores pause with no error | `e2e/waves.spec.ts › pause button toggles animation state` |
| `global.step-button` | Push button | Advances the simulation exactly one fixed timestep (workspace-defined, e.g. 1/30 s) while paused | "Step forward one frame" | Tab-reachable; `Enter`/`Space` activates; disabled (not focus-trapped, `aria-disabled`) when not paused, with visible hint "Pause to step" | Displays the new elapsed-time readout of the host workspace after each step | N/A (step is not stateful) | Disabled state prevents stepping while running; no error state, simply inert | No dependency — pure state-advance function; fallback view shows updated table row instead of canvas frame | `e2e/waves.spec.ts › step button requires paused state and advances one timestep` |
| `global.slow-motion-toggle` | Toggle/segmented control (1×, 0.5×, 0.25×) | Scales simulation playback rate without altering underlying equations or recorded data | "Playback speed" with per-option names "Normal speed", "Half speed", "Quarter speed" | Tab to control, arrow keys move between the three options, `Enter`/`Space` commits | Current multiplier shown as persistent label, e.g. "0.5×" | Returns to "Normal speed" (1×) on workspace reset | N/A — fixed option set, no free input | Fallback data table updates rows at the same real-world rate regardless of visual speed | `e2e/waves.spec.ts › slow-motion changes playback rate not physics` |
| `global.reset-button` | Push button | Restores the current workspace's science state, controls, and view to its documented default preset | "Reset [workspace name]" (workspace name interpolated, e.g. "Reset wave measurement lab") | Tab-reachable; `Enter`/`Space` activates; no shortcut (destructive-ish, avoid accidental global hotkey) | N/A | Announces "Reset to default" via a polite live region; all sliders/readouts visibly snap to defaults | N/A | Resets both the rendered view and the text/table fallback identically | `e2e/waves.spec.ts › reset returns every control to documented default` |
| `global.preset-select` | Listbox / native `<select>` | Loads a named scenario (values, medium, camera) defined in the workspace's `*Presets` data file | "Choose a preset scenario" | Tab-reachable; arrow keys change selection; `Enter` commits on native select behaviour | Selected preset name shown as the control's current value | Selecting "Custom" (always first option) clears to workspace defaults; `global.reset-button` also returns selection to "Custom" | Unknown/removed preset IDs (e.g. stale deep link) fall back to "Custom" with a one-line inline notice, never a blank/broken state | Preset list itself is static JSON; no rendering dependency | `e2e/waves.spec.ts › preset select loads scenario values and unknown id falls back safely` |
| `global.enable-sound-button` | Push button (one-shot gate) | Unlocks the Web Audio context on explicit user gesture; required before any audio-producing control becomes active, per shared-spec audio safety rule | "Enable sound for this activity" | Tab-reachable; `Enter`/`Space` activates; after activation the control becomes "Sound enabled" status text, not a button | Shows current gain as a %, once enabled (e.g. "Volume 20%") | `global.mute-button` (below) does not re-lock the context; only a full workspace reset re-requires the gesture | If Web Audio is denied/unsupported, button shows "Sound unavailable — visual mode only" and never claims success | Web Audio unsupported/denied → all audio-bearing controls run in visual-only mode automatically; no console error | `sound.spec.ts › explicit acknowledgement then enable starts muted, capped, and visual-only can never unmute` |
| `global.audio-permission-toggle` | Persisted checkbox | Master permission for optional audio controls; turning it off immediately mutes any enabled activity and locks activities to visual-only mode | "Enable sound" | Tab-reachable; `Space` toggles | Checked/unchecked plus explanatory hint that each activity still needs its own enable action | Persisted device preference; not changed by workspace reset | Off never disables visual equivalents or scientific controls | Web Audio unavailable still forces visual-only mode regardless of this preference | `sound.spec.ts › the header sound preference is a real master opt-out for activity audio`; persistence in `settings.spec.ts` |
| `global.mute-button` | Toggle button | Silences audio output without tearing down the Web Audio context | "Mute sound" / "Unmute sound" | Tab-reachable; `Enter`/`Space` toggles | Text and pressed state identify mute status | Workspace reset does not unmute automatically; first enable starts muted | N/A | Only visible on workspaces that enabled audio successfully | `sound.spec.ts › explicit acknowledgement then enable starts muted, capped, and visual-only can never unmute` |
| `global.reduced-motion-toggle` | Toggle switch (also auto-set from OS `prefers-reduced-motion`) | Disables non-essential animation/transition and switches wave/motion simulations to discrete-step rendering | "Reduce motion" | Tab-reachable; `Enter`/`Space`/arrow keys (switch role) toggles | On/off state shown as switch position + text | Persisted in the settings store across sessions; not reset by workspace `global.reset-button` (a device preference, not simulation state) | N/A | No fallback needed — this control exists specifically to provide a lower-motion path | `e2e/settings.spec.ts › reduced-motion toggle overrides and matches OS preference on first load` |
| `global.low-graphics-toggle` | Toggle switch | Switches Canvas/WebGL scenes to reduced particle count / static-frame rendering; must not change any computed scientific value | "Low graphics mode" | Tab-reachable; `Enter`/`Space`/arrow keys toggles | On/off state shown as switch position + text | Persisted across sessions like `reduced-motion-toggle`; unaffected by workspace reset | N/A | This control is itself the fallback path for low-powered devices; if WebGL is entirely unavailable it is force-enabled and disabled from further toggling, with a note "Enabled automatically — 3D graphics unavailable" | `e2e/settings.spec.ts › low-graphics mode never changes displayed numeric results` |
| `global.presentation-mode-toggle` | Toggle button | Enlarges base text and tagged equation panels for projection | "Presentation mode" | Tab-reachable; `Enter`/`Space` toggles; `Escape` exits | On/off state shown as pressed/unpressed `aria-pressed` | Exiting restores the standard layout | N/A | Pure CSS layout mode | `waves.spec.ts › presentation mode toggles on and Escape exits from anywhere` plus `keyboard.spec.ts` |

### 1.1 Global shell navigation

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `shell.skip-link` | Skip link | Moves focus directly to `<main>`, bypassing repeated navigation | "Skip to main content" | First focusable element on every page; `Enter` activates; visible on focus only | N/A | N/A | N/A | N/A — pure HTML anchor | `e2e/shell.spec.ts › skip link is the first tab stop and moves focus to main` |
| `shell.nav-home` | Nav link | Routes to `/` topic map | "Home" | Tab-reachable in the primary nav landmark; `Enter` activates | Current-page state indicated with `aria-current="page"` | N/A | Unknown route falls back to the 404 route, never a blank page | N/A | runtime parity/naming check in `tests/e2e/control-inventory.spec.ts`; navigation flow in `tests/e2e/shell.spec.ts` |
| `shell.nav-waves` | Nav link | Routes to `/waves` | "Waves" | as above | as above | N/A | as above | N/A | same |
| `shell.nav-sound` | Nav link | Routes to `/sound` | "Sound" | as above | as above | N/A | as above | N/A | same |
| `shell.nav-light` | Nav link | Routes to `/light` | "Light" | as above | as above | N/A | as above | N/A | same |
| `shell.nav-vision` | Nav link | Routes to `/vision` | "Vision" | as above | as above | N/A | as above | N/A | same |
| `shell.nav-motion` | Nav link | Routes to `/motion` | "Motion" | as above | as above | N/A | as above | N/A | same |
| `shell.nav-forces` | Nav link | Routes to `/forces` | "Forces" | as above | as above | N/A | as above | N/A | same |
| `shell.nav-spectrum` | Nav link | Routes to `/spectrum` | "Spectrum" | as above | as above | N/A | as above | N/A | same |
| `shell.nav-hearing` | Nav link | Routes to `/hearing` | "Hearing" | as above | as above | N/A | as above | N/A | same |
| `shell.nav-ultrasound` | Nav link | Routes to `/ultrasound` | "Ultrasound" | as above | as above | N/A | as above | N/A | same |
| `shell.nav-astronomy` | Nav link | Routes to `/astronomy` | "Astronomy" | as above | as above | N/A | as above | N/A | same |
| `shell.nav-society` | Nav link | Routes to `/society` | "Society" | as above | as above | N/A | as above | N/A | same |
| `shell.nav-mastery` | Nav link | Routes to `/mastery` | "Mastery" | as above | as above | N/A | as above | N/A | same |
| `shell.nav-glossary` | Nav link | Routes to `/glossary` | "Glossary" | as above | as above | N/A | as above | N/A | same |
| `shell.nav-progress` | Nav link | Routes to `/progress` | "Progress" | as above | as above | N/A | as above | N/A | same |
| `shell.nav-teacher` | Nav link | Routes to `/teacher` | "Teacher" | as above | as above | N/A | as above | N/A | same |
| `shell.nav-about` | Nav link | Routes to `/about` (sources, model limitations, accessibility, privacy) | "About" | as above | as above | N/A | as above | N/A | same |

---

## 2. Wave foundations workspace (`wave-lab`) — Stage S2

Covers app-plan §4.1–4.3. Uses `global.pause-button`, `global.step-button`,
`global.slow-motion-toggle`, `global.reset-button`, `global.preset-select`.

### 2.1 Medium or vacuum? (§4.1)

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `wave-lab.medium-type-select` | Segmented control | Switches the mechanical chamber between "Spring/rope model" and "Coupled particles (solid-like)" | "Medium type" | Tab, arrow keys to change option, `Enter` commits | Selected medium name shown as persistent label | Returns to "Coupled particles" default on `global.reset-button` | N/A — fixed option set | Text description of the selected medium's coupling behaviour replaces the canvas illustration | `e2e/waves.spec.ts › medium type select switches chamber model and label` |
| `wave-lab.coupling-slider` | Range slider, 0–100 | Adjusts inter-particle spring stiffness, changing pulse propagation speed in the mechanical chamber only | "Particle coupling strength" | Tab-reachable; `←`/`→` step by 1, `Home`/`End` jump to min/max, `PageUp`/`PageDown` step by 10 | Live value "Coupling: 62%" next to slider, updates on every keypress/drag | Returns to default 50% | Value programmatically clamped to [0,100]; slider cannot be dragged out of range so no invalid state is reachable | Fallback numeric input box with same clamp behaviour when Canvas unavailable | `e2e/waves.spec.ts › coupling slider clamps to 0-100 and updates propagation speed` |
| `wave-lab.density-slider` | Range slider | Adjusts particle spacing/density in the mechanical chamber | "Medium density" | as coupling-slider pattern | Live value "Density: 1.2×" | Returns to default 1.0× | Clamped to [0.5×, 3×]; out-of-range keyboard input (e.g. pasted value) is clamped, not rejected silently without feedback — inline note "Clamped to 3×" appears briefly | Numeric input fallback | `e2e/waves.spec.ts › density slider clamps and updates particle spacing` |
| `wave-lab.source-mode-toggle` | Toggle (Pulse / Continuous) | Switches the disturbance source between single-pulse and continuous-wave emission | "Source mode" | Tab, arrow keys between two options, `Enter` commits | Selected mode text label | Returns to "Pulse" default | N/A — fixed option set | N/A — text control | `e2e/waves.spec.ts › source mode toggle switches pulse vs continuous emission` |
| `wave-lab.amplitude-slider` | Range slider | Sets disturbance amplitude; per scientific guardrail must not alter frequency or propagation speed in the linear model | "Amplitude" | Tab, `←`/`→` step 1%, `Home`/`End` to bounds | Live value "Amplitude: 40%" | Returns to default 40% | Clamped [0,100]% | Numeric input fallback | `e2e/waves.spec.ts › amplitude slider does not change frequency or speed readouts (invariant)` |
| `wave-lab.frequency-slider` | Range slider | Sets source oscillation frequency for the continuous-wave mode | "Source frequency" | Tab, `←`/`→` step 0.1 Hz, `Home`/`End` to bounds | Live value "Frequency: 2.0 Hz" | Returns to default 1.0 Hz | Clamped [0.1, 10] Hz; typed/pasted values outside range clamp with visible inline note, never silently accepted | Numeric input fallback | `e2e/waves.spec.ts › frequency slider clamps to 0.1-10 Hz` |
| `wave-lab.particle-trails-toggle` | Checkbox | Shows/hides faint trailing paths behind oscillating particles | "Show particle trails" | Tab-reachable; `Space` toggles | Checked/unchecked state | Returns to unchecked (off) default | N/A | N/A — decorative overlay only, no scientific meaning conveyed by trails alone | `e2e/waves.spec.ts › particle trails toggle shows/hides overlay without changing data` |
| `wave-lab.energy-marker-toggle` | Checkbox | Shows/hides the travelling energy marker distinct from any particle | "Show energy marker" | as above | Checked/unchecked state | Returns to checked (on) default — energy transport is the key teaching point | N/A | Adjacent text states "Energy travels; particles do not" regardless of toggle state | `e2e/waves.spec.ts › energy marker is visually distinct from particles and togglable` |
| `wave-lab.trigger-disturbance-button` | Push button | Fires one pulse (pulse mode) or starts continuous emission (continuous mode) simultaneously in the mechanical, vacuum, and EM-field chambers | "Trigger disturbance in all three chambers" | Tab-reachable; `Enter`/`Space` activates | N/A | N/A (not a stateful control) | Disabled with `aria-disabled` while a pulse is still propagating in pulse mode, re-enabled once the pulse exits the chamber | Fallback view logs "Disturbance triggered at t=0.0s" as a text event instead of animating | `e2e/waves.spec.ts › trigger disturbance shows mechanical pulse, vacuum silence, EM field propagation together` |

### 2.2 Transverse/longitudinal comparison (§4.2)

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | QA test |
|---|---|---|---|---|---|---|---|---|---|
| `wave-lab.wave-orientation-toggle` | Toggle (Transverse / Longitudinal) | Switches the displayed wave model and its displacement-vs-propagation relationship | "Wave orientation" | Tab, arrow keys, `Enter` commits | Selected mode label plus a one-line description of displacement direction relative to propagation | Returns to "Transverse" default | N/A — fixed option set | N/A — text control | `e2e/waves.spec.ts › orientation toggle switches transverse/longitudinal displacement direction` |
| `wave-lab.point-probe-drag` | Draggable marker on the wave curve | Places a measurement probe at a chosen position; readout panel updates to that position's instantaneous displacement/pressure and elapsed time | "Point probe position" (as a slider fallback: 0–100% along the visible wave) | Tab-reachable; draggable with mouse, and keyboard-operable as a slider (`←`/`→` move 1% of chamber width, `Home`/`End` to ends) | Live readout "Probe at x = 0.34 m, displacement = +2 mm, t = 1.2 s" | Returns to chamber midpoint on reset | Probe position clamped to visible chamber bounds | Non-draggable text input for probe x-position when pointer/touch drag is unavailable | `e2e/waves.spec.ts › point probe is keyboard-operable and reports position, displacement, time` |
| `wave-lab.clock-readout-control` | Push button ("Mark period") + persistent readout | Marks two successive equivalent points (e.g. crest-to-crest) to compute measured period, cross-checked against the source's set frequency | "Mark period at probe position" | Tab-reachable; `Enter`/`Space` marks; second press completes the pair | Live value "Measured period: 0.50 s (source frequency: 2.0 Hz → expected 0.50 s)" | Marked points clear on `global.reset-button` or on `wave-orientation-toggle` change | If the two marks are on non-equivalent points (e.g. crest to trough), the readout shows "Not a full period — mark two crests or two troughs" rather than a wrong numeric answer | Numeric readout unaffected by rendering — works identically in fallback table view | `e2e/waves.spec.ts › mark-period control rejects mismatched point pairs and matches source frequency` |
| `wave-lab.representation-trap-answer` | Two-button choice ("Yes, particles move up and down" / "No, only the graph value changes") | Captures the student's answer to the representation-trap challenge and gives specific corrective feedback | "Does the pressure graph mean sound particles physically move up and down?" | Tab-reachable; `Enter`/`Space` selects | Selected answer highlighted; feedback text appended below | Re-attempting after reset clears the previous selection and feedback | Selecting "Yes" (the misconception) is marked incorrect with feedback text quoting the guardrail: "the graph represents pressure/displacement versus position or time, not the physical path of air particles" — never marked correct | N/A — text-based question, no rendering dependency | `e2e/waves.spec.ts › representation-trap marks the misconception answer incorrect with specific feedback (false-positive regression)` |
| `wave-lab.label-toggles` | Checkbox group (Crest, Trough, Equilibrium, Amplitude, Wavelength) | Shows/hides each measurement label independently on the wave diagram | "Show [label name]" ×5, e.g. "Show crest label" | Tab through each checkbox individually; `Space` toggles | Checked state per label | All return to checked (on) by default | N/A | Text/table fallback lists all five values regardless of toggle state | `e2e/waves.spec.ts › each of the five label toggles is independently operable and uniquely named` |

### 2.3 Wave measurement laboratory (§4.3)

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `wave-lab.measurement-preset-select` | Listbox | Loads one of Rope / Water-surface (conceptual) / Sound / EM measurement presets with medium-appropriate speed ranges | "Measurement preset" | Tab, arrow keys, `Enter` | Selected preset name | Returns to "Rope" default | Each preset clamps the speed slider to that medium's valid range (see `wave-lab.speed-slider` below) — this is the fix for the audited "Sound (Water)" preset that previously exceeded the slider's cap | N/A | `e2e/waves.spec.ts › switching preset re-clamps speed slider range (regression: sound-in-water no longer exceeds cap)` |
| `wave-lab.ruler-tool-drag` | Draggable/keyboard-operable ruler overlay | Measures a user-selected span on the wave diagram in the active preset's length unit | "Ruler tool" | Tab-reachable; `←`/`→` move ruler start, `Shift+←`/`Shift+→` move ruler end, in 1-pixel-equivalent (0.001 m) steps | Live span readout "Span: 0.750 m" | Ruler returns to a 0-length default position at the chamber origin on reset | Cannot be dragged outside chamber bounds | Numeric two-field ("from"/"to") fallback input | `e2e/waves.spec.ts › ruler tool is keyboard-operable and reports span in active unit` |
| `wave-lab.timer-tool-control` | Push button ("Start timing" / "Stop timing") | Times an interval between two events the student marks (e.g. wavefront passing two points) | "Timer" | Tab-reachable; `Enter`/`Space` starts/stops | Live elapsed time "Elapsed: 1.20 s" while running; final value retained after stop | Returns to 0.00 s on reset | N/A (elapsed time cannot be negative or invalid by construction) | N/A | `e2e/waves.spec.ts › timer starts, stops, and retains the measured interval` |
| `wave-lab.probe-tool-drag` | Draggable/keyboard-operable probe (shared pattern with `wave-lab.point-probe-drag`) | Reads instantaneous amplitude at a chosen position for period/frequency measurement | "Measurement probe position" | Same pattern as §2.2 point probe | Live readout with position and instantaneous value | Returns to chamber midpoint | Clamped to chamber bounds | Numeric input fallback | `e2e/waves.spec.ts › measurement probe reports amplitude at any keyboard-selected position` |
| `wave-lab.frequency-unit-select` | Listbox (Hz, kHz, MHz, GHz) | Converts and displays the current source frequency in the selected unit | "Frequency display unit" | Tab, arrow keys, `Enter` | Selected unit relabels the live frequency readout, e.g. "2.0 Hz" → "0.002 kHz" | Returns to "Hz" default | Conversion is exact (no rounding error accumulation); unit change never alters the underlying stored SI value | N/A — text control | `e2e/waves.spec.ts › frequency unit conversion Hz/kHz/MHz/GHz is exact and reversible` |
| `wave-lab.length-unit-select` | Listbox (m, cm, mm, µm, nm) | Converts and displays wavelength/ruler measurements in the selected unit | "Length display unit" | as above | Selected unit relabels wavelength/ruler readouts | Returns to "m" default | Conversion exact; unit change never alters underlying stored SI value | N/A — text control | `e2e/waves.spec.ts › length unit conversion m/cm/mm/µm/nm is exact and reversible` |
| `wave-lab.lambda-v-f-input-v` | Numeric input | Student-entered or model-derived speed value for the `v = fλ` calculator | "Speed (v)" | Tab-reachable; standard text-input editing keys; `Enter` submits the calculation | Shows unit suffix inline, e.g. "343 m/s" | Clears to blank (not zero) on `global.reset-button`, forcing a fresh attempt rather than implying zero is correct | Empty submission shows "Enter a speed value" and does not compute; non-numeric text (e.g. "fast") shows "Enter a number" and is never coerced to 0; negative speed shows "Speed cannot be negative" | N/A — text input, no rendering dependency | `e2e/waves.spec.ts › lambda-v-f calculator rejects empty, non-numeric, and negative speed input` |
| `wave-lab.lambda-v-f-input-f` | Numeric input | Student-entered or model-derived frequency value | "Frequency (f)" | as above | Unit suffix inline, e.g. "440 Hz" | Clears to blank on reset | Empty → "Enter a frequency value"; non-numeric → "Enter a number"; 0 Hz → "Frequency cannot be 0 Hz for a travelling wave" (explicit boundary case); negative → "Frequency cannot be negative" | N/A | `e2e/waves.spec.ts › lambda-v-f calculator rejects empty, non-numeric, zero, and negative frequency (false-positive regression)` |
| `wave-lab.lambda-v-f-input-lambda` | Numeric input | Student-entered or model-derived wavelength value | "Wavelength (λ)" | as above | Unit suffix inline, e.g. "0.78 m" | Clears to blank on reset | Same empty/non-numeric/negative rules as `input-f`; additionally checks internal consistency `v = fλ` within 1% tolerance when all three fields are filled, showing "These three values don't satisfy v = fλ — check your working" rather than silently accepting | N/A | `e2e/waves.spec.ts › lambda-v-f calculator flags internally inconsistent v, f, λ triples` |
| `wave-lab.add-trial-button` | Push button | Appends the current probe/ruler/timer measurement as a row in the trial table | "Add measurement to trial table" | Tab-reachable; `Enter`/`Space` activates | N/A | N/A | Disabled with explanatory `aria-describedby` text until at least one full measurement (speed, frequency, wavelength) is available | Fallback table entry works identically without Canvas | `e2e/waves.spec.ts › add-trial is disabled until a full measurement exists and appends a correct row` |
| `wave-lab.trial-table` | Data table with per-row delete | Displays all recorded trials (medium, frequency, wavelength, computed speed) | "Trial results table" (table `<caption>`); each delete button "Delete trial [n]" | Tab into table, arrow-key row navigation optional (native table semantics), delete buttons individually Tab-reachable | Every cell carries its unit in the column header, not repeated per cell | Table clears entirely on `global.reset-button`, with a confirmation prompt if it holds ≥1 row | Deleting a non-existent (already-removed) row via a stale reference is a no-op, not an error | Identical table in fallback (this control has no canvas dependency at all) | `e2e/waves.spec.ts › trial table rows are addable, individually deletable, and cleared with confirmation on reset` |
| `wave-lab.graph-view-toggle` | Toggle (Table / Graph) | Switches the trial-results panel between tabular and plotted (wavelength vs 1/frequency) views | "Trial results view" | Tab, arrow keys, `Enter` | Selected view label | Returns to "Table" default | Graph view with fewer than 2 trials shows "Add at least two trials to see a graph" instead of an empty/broken plot | Graph view is SVG with an adjacent visually-hidden data table always present as the accessible equivalent | `e2e/waves.spec.ts › graph view requires 2+ trials and has an accessible data-table equivalent` |

---

## 2.4 Stage 2 as-built notes and divergences (2026-07-18)

Every §2 control shipped with its inventoried accessible name and keyboard
behaviour, exercised by `tests/e2e/waves.spec.ts`. Divergences and additions,
flagged per the stage brief:

**Divergences from the rows above**
- `global.pause-button`: the `P` keyboard shortcut is NOT implemented — the
  canvas is not a focusable control (it is `role="img"` with a live text
  alternative), so "when a simulation canvas has focus" never occurs. Pause is
  a Tab-reachable toggle button. Revisit if a focusable canvas ever ships.
- `global.preset-select` (measurement lab): there is no leading "Custom"
  option; the preset list is exactly the four §2.3 presets and
  `global.reset-button` returns to the documented default (Rope). An unknown
  preset id in a deep link falls back to Rope silently (safe state, no broken
  UI) rather than showing the inline notice described above.
- `wave-lab.frequency-slider` exists on `/waves/medium` per §2.1. The
  measurement lab needed its own source-frequency control with per-preset
  ranges, added as **`wave-lab.measure-frequency-slider`** ("Source
  frequency" is still unique per route).
- `wave-lab.ruler-tool-drag`: PageUp/PageDown coarse-step the ruler END
  (Shift+arrows fine-step it); Home collapses to the zero-length origin
  default, End stretches across the chamber. Span, not start, is the
  `aria-valuenow`.
- `wave-lab.clock-readout-control` ("Mark period") lives on `/waves/types`.
  Equivalence of the two marked points is checked by whole-period timing
  (|Δt − n·T| < 12% of T): mismatched pairs (e.g. crest→trough) show "Not a
  full period — mark two crests or two troughs", never a wrong number.
- `wave-lab.trial-table` records the MEASURED wavelength (ruler reading) and
  shows computed speed f×λ(measured) plus a 1/frequency column for the
  λ vs 1/f investigation.
- `wave-lab.point-probe-drag` / `wave-lab.probe-tool-drag`: implemented as
  native range sliders (drag AND keyboard operable) rather than free-drag
  markers with a slider fallback — one control, both input methods.

**Controls added beyond the S2 rows (new IDs, same conventions)**
- `wave-lab.medium-notice-input`, `wave-lab.energy-notice-input` — "What do
  you notice?" capture, saved to the progress store as evidence (empty text
  rejected).
- `wave-lab.energy-pulse-button` ("Send energy pulse"),
  `wave-lab.tag-particle-toggles` ("Tag particle B/D/F/H"),
  `wave-lab.tagged-particle-table` — the 7.1.2 tagged-particle view.
- `wave-lab.noise-mode-toggle` ("Seeded measurement noise") + seed input —
  deterministic seeded measurement-noise mode (ruler readings only; never the
  wave state).
- `wave-lab.export-csv-button`, `wave-lab.export-json-button` — trial exports.
- `wave-lab.check-question`, `wave-lab.check-hint-button` — Check runner with
  three-level progressive hints.
- `wave-lab.cer-editor` — Explain-phase claim–evidence–reasoning scaffold
  (missing part named specifically on submit).
- Interpretation and limitation prompts on `/waves/measure` (saved as
  investigation evidence for 7.1.6 / 7.1.5).

## 3. Electromagnetic spectrum workspace (`em-spectrum`) — Stage S3*

Covers app-plan §5. See the stage-inference note in Conventions above.

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `em-spectrum.zoom-pan-slider` | Range slider (logarithmic) spanning radio→gamma | Selects a wavelength/frequency position on the continuous log-scale spectrum strip | "Position on the electromagnetic spectrum" | Tab-reachable; `←`/`→` step by one log-scale minor tick, `Home`/`End` to radio/gamma extremes, `PageUp`/`PageDown` jump one region | Live readout "λ ≈ 500 nm, f ≈ 6.0×10¹⁴ Hz (visible)" | Returns to a default mid-visible-light position | Slider position is continuous and cannot be invalid; extreme ends clamp at the documented band boundaries with a note "approximate boundary, conventions vary" | Fallback: a `<select>` of named regions (Radio, Microwave, Infrared, Visible, Ultraviolet, X-ray, Gamma) driving the same state | `e2e/stage-six.spec.ts › zoom/pan slider covers full log range and clamps at documented (approximate) boundaries` |
| `em-spectrum.region-select` | Listbox (7 regions) | Jumps the zoom/pan position to a named region's representative wavelength | "Jump to spectrum region" | Tab, arrow keys, `Enter` | Selected region name | N/A (this is itself a navigation control) | N/A — fixed option set | This *is* the fallback control referenced above | `e2e/stage-six.spec.ts › region select moves the spectrum position and stays in sync with the slider` |
| `em-spectrum.wavelength-frequency-input-toggle` | Toggle (enter by wavelength / enter by frequency) | Switches which numeric field drives the spectrum position | "Enter position by" | Tab, arrow keys, `Enter` | Selected mode label | Returns to "wavelength" default | Whichever field is inactive is read-only and shows the computed value, preventing two independent (and possibly inconsistent) inputs | N/A | `e2e/stage-six.spec.ts › wavelength/frequency entry toggle keeps exactly one field editable and both in sync` |
| `em-spectrum.log-axis-toggle` | Checkbox | Switches the spectrum strip between logarithmic and (disabled-by-default, clearly labelled) linear display | "Use logarithmic scale" | Tab-reachable; `Space` toggles | Checked (log, default) / unchecked (linear) | Returns to checked (log) default — linear view is explicitly labelled "compresses most of the spectrum into one edge" when selected, to prevent misreading | N/A | N/A | `e2e/stage-six.spec.ts › log-axis toggle relabels axis and warns when linear view is selected` |
| `em-spectrum.source-detector-toggle` | Disclosure button | Expands/collapses the "common sources and detectors" panel for the current position | "Show sources and detectors for this wavelength" | Tab-reachable; `Enter`/`Space` toggles; `aria-expanded` reflects state | N/A | Collapses on reset | N/A | N/A — text panel | `e2e/stage-six.spec.ts › source/detector disclosure expands and collapses with correct aria-expanded` |
| `em-spectrum.interaction-toggle` | Disclosure button | Expands/collapses "interactions with materials/tissue/atmosphere" panel | "Show material interactions for this wavelength" | as above | N/A | as above | N/A | N/A | `e2e/stage-six.spec.ts › interaction disclosure expands and collapses` |
| `em-spectrum.application-risk-toggle` | Disclosure button | Expands/collapses "applications and risks/controls" panel | "Show applications and risk controls for this wavelength" | as above | N/A | as above | N/A | N/A | `e2e/stage-six.spec.ts › application/risk disclosure expands and collapses` |
| `em-spectrum.ionising-classification-display` | Static status indicator (not a control, listed for completeness/labelling audit) | Shows whether the current position is classified ionising/non-ionising in the Year 10 teaching model, with the guardrail note against "higher frequency is always more dangerous" | "Ionising classification for this wavelength" | N/A (not interactive) | Text label "Non-ionising (teaching classification)" | N/A | N/A | N/A | `e2e/stage-six.spec.ts › ionising classification label is present and matches curated data at every region boundary` |
| `em-spectrum.evidence-card-toggle` | Disclosure button | Expands/collapses the source/review-date evidence card for the current position's data | "Show evidence and review date" | as above | N/A | as above | N/A | N/A | `e2e/stage-six.spec.ts › evidence card discloses source and review date for every region` |
| `em-spectrum.dataset-property-select` | Listbox | Chooses the comparison property (e.g. penetration, resolution, cost, safety) for the EM-uses dataset activity | "Compare applications by" | Tab, arrow keys, `Enter` | Selected property name | Returns to first property option on reset | N/A — fixed option set | N/A | `e2e/stage-six.spec.ts › dataset property select changes the comparison table's sort/highlight` |
| `em-spectrum.dataset-citation-input` | Text input | Captures the student's cited data point/justification for their application choice | "Your evidence for this property" | Tab-reachable; standard text editing | Character count shown, e.g. "42/300" | Clears on reset with confirmation if non-empty | Empty submission on the "Submit justification" action shows "Cite at least one data point before submitting" | N/A | `e2e/stage-six.spec.ts › dataset citation input rejects empty submission` |
| `em-spectrum.atmospheric-overlay-toggle` | Checkbox | Shows/hides the atmospheric-transmission overlay on the spectrum strip | "Show atmospheric transmission overlay" | Tab-reachable; `Space` toggles | Checked/unchecked | Returns to unchecked default | N/A | Adjacent text list of "transmitted/absorbed" bands available regardless of toggle | `e2e/stage-six.spec.ts › atmospheric overlay toggle shows/hides band shading` |
| `em-spectrum.scale-comparison-strip` | Static illustrative control (drag handle to compare object sizes at a wavelength) | Lets students drag a comparison marker (e.g. "about the width of a hair") next to the current wavelength for intuition-building | "Scale comparison marker" | Tab-reachable; `←`/`→` cycles through curated comparison objects | Text label of current comparison object and its approximate size | Returns to first comparison object on reset | N/A — fixed, curated list, no free input | Text-only list of comparisons, always present | `e2e/stage-six.spec.ts › scale comparison strip is keyboard-cyclable and text is always present` |

---

## 4. Sound laboratory workspace (`sound-lab`) — Stage S3

Covers app-plan §6.1–6.3. Uses `global.enable-sound-button`, `global.mute-button`,
`global.pause-button`, `global.step-button`, `global.reset-button`.

### 4.1 Compression and rarefaction (§6.1)

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `sound-lab.source-vibration-slider` | Range slider | Drives the vibrating-source frequency shown across all four linked representations | "Source vibration frequency" | Tab, `←`/`→` step 10 Hz, `Home`/`End` to bounds | Live "Frequency: 440 Hz" | Returns to 440 Hz default (concert A, familiar reference) | Clamped [20, 2000] Hz for this conceptual view (full audible-safety range lives in §4.2 pitch/loudness) | Numeric input fallback | `e2e/sound.spec.ts › source vibration slider updates all four linked representations together` |
| `sound-lab.medium-temperature-preset-select` | Listbox | Loads a medium/temperature preset that sets propagation speed (default 343 m/s, dry air, ≈20 °C, labelled as reference approximation) | "Medium and temperature" | Tab, arrow keys, `Enter` | Selected preset name plus resulting speed, e.g. "Dry air, 20°C — 343 m/s" | Returns to the dry-air-20°C default | N/A — fixed curated option set with sourced values | N/A | `e2e/sound.spec.ts › medium/temperature preset updates propagation speed and shows its source note` |
| `sound-lab.tag-particles-toggle` | Checkbox | Highlights a small set of individual air particles so students can verify local oscillation only | "Tag particles to track their motion" | Tab-reachable; `Space` toggles | Checked/unchecked | Returns to unchecked default | N/A | Text explanation "tagged particles oscillate about a fixed point" always present regardless of toggle | `e2e/sound.spec.ts › tagged particles show approximately zero net displacement after full cycles (invariant)` |
| `sound-lab.energy-marker-toggle` | Checkbox (shared pattern with `wave-lab.energy-marker-toggle`) | Shows/hides the travelling energy marker, distinct from any particle | "Show energy marker" | as above | Checked/unchecked | Returns to checked default | N/A | Text note always present | `e2e/sound.spec.ts › energy marker is visually distinct from tagged particles` |

### 4.2 Pitch and loudness investigation (§6.2)

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `sound-lab.frequency-slider` | Range slider | Sets the audible tone's frequency (drives Web Audio oscillator once `global.enable-sound-button` has been activated) | "Tone frequency" | Tab, `←`/`→` step 1 Hz, `Home`/`End` to bounds | Live "Frequency: 440 Hz" | Returns to 440 Hz default | Clamped to the documented age-appropriate safe range [85, 8000] Hz; out-of-range typed values clamp with inline note | Slider drives only the visual waveform when audio is unavailable/denied; no silent audio failure | `e2e/sound.spec.ts › frequency slider clamps to safe audible range and drives visual waveform when audio denied` |
| `sound-lab.amplitude-output-slider` | Range slider | Sets output gain; per guardrail must not alter the pitch representation | "Output level" | Tab, `←`/`→` step 1%, `Home`/`End` to bounds | Live "Level: 20%" | Returns to a safe low default (20%), never defaults loud | Hard-capped at a maximum safe gain regardless of typed input, to satisfy the "volume limit/warning" privacy-and-safety rule | Visual amplitude bar always shown, independent of audio availability | `e2e/sound.spec.ts › amplitude slider is hard-capped and defaults to a safe low level (invariant: pitch unaffected by amplitude)` |
| `sound-lab.waveform-preset-select` | Listbox (sine, square, triangle, sawtooth) | Extension control selecting oscillator timbre | "Waveform shape" | Tab, arrow keys, `Enter` | Selected waveform name | Returns to "sine" default | N/A — fixed option set | Oscilloscope view shows the correct static shape even if audio is muted/unavailable | `e2e/sound.spec.ts › waveform preset changes both audio timbre and oscilloscope trace shape` |
| `sound-lab.duration-input` | Numeric input (seconds) | Sets tone duration for pulse mode | "Tone duration" | Tab-reachable; text-input editing | Unit suffix "1.0 s" | Returns to 1.0 s default | Empty/non-numeric rejected with "Enter a duration in seconds"; values above a 5 s ceiling clamp with a note (headphone-safety consideration) | N/A | `e2e/sound.spec.ts › duration input rejects empty/non-numeric and clamps to the 5 s ceiling` |
| `sound-lab.pulse-continuous-toggle` | Toggle | Switches tone emission between one-shot pulse and continuous | "Emission mode" | Tab, arrow keys, `Enter` | Selected mode label | Returns to "Pulse" default | N/A | N/A | `e2e/sound.spec.ts › pulse/continuous toggle changes emission behaviour` |
| `sound-lab.oscilloscope-timescale-slider` | Range slider | Adjusts the time window shown on the oscilloscope trace | "Oscilloscope time scale" | Tab, `←`/`→` step, `Home`/`End` to bounds | Live "Window: 10 ms" | Returns to default 10 ms window | Clamped to a sensible display range [1 ms, 100 ms] | Trace still renders (as SVG) with audio unavailable, since it is driven by the same synthesiser state, not by audio output | `e2e/sound.spec.ts › oscilloscope time scale clamps and renders trace even when audio is denied` |
| `sound-lab.spectrum-view-toggle` | Toggle (Oscilloscope / Spectrum) | Switches the visualisation between time-domain trace and frequency-domain bar | "Visualisation view" | Tab, arrow keys, `Enter` | Selected view label | Returns to "Oscilloscope" default | N/A | Both views work without audio output (driven by the deterministic waveform model, not the audio graph) | `e2e/sound.spec.ts › spectrum view toggle switches visualisation and works without audio` |
| `sound-lab.visual-only-mode-toggle` | Checkbox | Explicit opt-in to run the entire pitch/loudness module with audio permanently muted | "Visual-only mode (no sound)" | Tab-reachable; `Space` toggles | Checked/unchecked | Persists across this workspace's session; unaffected by `global.reset-button` | N/A | This *is* the accessible fallback; auto-enabled with `aria-describedby` explanation if Web Audio is unsupported | `e2e/sound.spec.ts › visual-only mode toggle is auto-enabled and locked when Web Audio unsupported` |
| `sound-lab.headphone-warning-ack` | One-shot confirmation button ("I understand — start at a low level") | Gates creation/enabling of the Web Audio path behind an explicit headphone-safety acknowledgement; visual sliders remain usable with sound off | "Acknowledge headphone safety warning" | Tab-reachable; `Enter`/`Space` activates | N/A | Re-shown once per browser session (not persisted forever), never re-shown mid-session after acknowledgement | N/A | N/A | `e2e/sound.spec.ts › explicit acknowledgement then enable starts muted, capped, and visual-only can never unmute` |

### 4.3 Doppler effect (§6.3)

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `sound-lab.doppler-source-velocity-slider` | Range slider (signed) | Sets the source's velocity along the 1D track | "Source velocity" | Tab, `←`/`→` step 1 m/s, `Home`/`End` to bounds | Live "Source: +8 m/s (moving right)" with sign-to-direction text pairing | Returns to 0 m/s default | Clamped below the speed of sound in the active medium, with inline note when the cap is hit — sonic-boom behaviour is out of scope per guardrail | Text/table of source position over time when Canvas unavailable | `e2e/sound.spec.ts › source velocity slider clamps below medium sound speed and pairs sign with direction text` |
| `sound-lab.doppler-observer-velocity-slider` | Range slider (signed) | Sets the observer's velocity along the 1D track | "Observer velocity" | as above | Live "Observer: 0 m/s" | Returns to 0 m/s default | Same clamp rule as source | Text/table fallback | `e2e/sound.spec.ts › observer velocity slider clamps below medium sound speed` |
| `sound-lab.doppler-preset-select` | Listbox (Stationary, Approach, Pass, Recession, Moving observer, Both moving) | Loads a named scenario into both velocity sliders | "Doppler scenario preset" | Tab, arrow keys, `Enter` | Selected preset name | Returns to "Stationary" default | N/A — fixed option set | N/A | `e2e/sound.spec.ts › all six Doppler presets load correct velocity pairs` |
| `sound-lab.doppler-view-mode-toggle` | Toggle (1D / 2D) | Switches between the required 1D wavefront view and the optional 2D extension view | "View dimension" | Tab, arrow keys, `Enter` | Selected mode label | Returns to "1D" default | 2D mode is clearly labelled "extension — same physics as the 1D model" so it is never mistaken for a different result | 1D text/table view is always available regardless of 2D availability | `e2e/sound.spec.ts › 1D/2D toggle keeps physics identical between views` |
| `sound-lab.doppler-pitch-audio-toggle` | Checkbox | Opt-in to hear the simulated detected-frequency pitch shift (gated behind `global.enable-sound-button`) | "Play detected pitch" | Tab-reachable; `Space` toggles | Checked/unchecked | Returns to unchecked (silent) default | N/A | Detected-frequency graph is always shown as the visual equivalent, independent of this toggle | `e2e/sound.spec.ts › Doppler pitch audio toggle requires enable-sound gate and has a visual equivalent regardless` |

### 4.4 Stage 3 as-built notes and additions (2026-07-20)

Every exposed sound control is exercised in `tests/e2e/sound.spec.ts`, with the
seven sound routes also included in the shared axe, console and responsive
matrices. The following notes make the implemented surface explicit.

**Clarifications and divergences from the planned rows**
- The headphone acknowledgement gates only the **audio path**. Frequency,
  output-level, waveform and visualisation controls remain usable before
  acknowledgement so the visual-only activity is never locked behind an audio
  safety decision. Acknowledgement is remembered only in `sessionStorage`.
- `sound-lab.tag-particles-toggle` is an inventoried logical group implemented
  as four independently named checkboxes (particles P–S), not one all-or-none
  checkbox. Each checkbox changes both the Canvas overlay and tagged-particle
  table.
- `sound-lab.doppler-preset-select` includes a seventh **Custom velocities**
  display state when either signed velocity slider is changed; reset returns to
  Stationary. The six authored scenarios remain unchanged.
- The compression view uses a fixed 3.12 m physical window. Frequency and medium
  changes therefore alter the number of wavelengths visible rather than
  silently rescaling the chamber. Particle movement and pressure are explicitly
  relative/display-exaggerated values.
- Pitch/loudness reset asks for confirmation only when it would clear recorded
  trials. The visual-only pulse action reports duration, frequency and cycle
  count, so duration and emission mode retain a real effect without Web Audio.

**Controls added as part of the verified Stage 3 learning flow**
- `sound-lab.microphone-probe` — "Microphone position" slider; moves the fixed
  pressure probe and linked trace.
- `sound-lab.tagged-particle-table` — tagged particle home/current/net-relative-
  displacement table.
- `sound-lab.compression-notice-input` and
  `sound-lab.doppler-notice-input` — non-empty observation/explanation captures
  saved to the progress store.
- `sound-lab.add-trial-button`, `sound-lab.trial-table`, per-row "Delete trial
  [n]", `sound-lab.export-csv-button`, `sound-lab.export-json-button` — the
  pitch/loudness fair-test record and export flow.
- `sound-lab.limitation-input` plus the interpretation capture/save action —
  records a result, model limitation and improvement; duplicate settings alone
  do not qualify as complete fair-test evidence.
- `sound-lab.check-question`, `sound-lab.check-hint-button` — the nine-question
  sound Check runner with invalid-input protection and three progressive hints.
- `sound-lab.cer-editor` — Claim/Evidence/Reasoning fields and save action; each
  missing field is named specifically.
- The pitch page also exposes the real-effect `Play a pulse` / `Show pulse
  timing` action. In visual-only mode it reports pulse timing/cycles and never
  unmutes audio.

---

## 5. Hearing, cultural sound, and ultrasound (Stage S6)

Covers app-plan §7.1–7.3.

### 5.1 Ear explorer (`hearing`)

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `hearing.anatomy-part-buttons` | Set of 8 clickable hotspot buttons on the ear cutaway (outer ear, ear canal, eardrum, ossicles, oval window, cochlear fluid, hair cells, auditory nerve) | Selecting a part highlights it and opens its explanation panel, building the "mechanical → fluid → electrical signal" ladder | "Explore [part name]" ×8, e.g. "Explore the eardrum" | Tab through all 8 in pathway order; `Enter`/`Space` selects; arrow keys move to next/previous part along the pathway | Selected part name shown as a persistent heading | Deselecting returns to the pathway overview (no part selected) | N/A — fixed hotspot set | Text list of all 8 parts with descriptions, always present as the non-visual equivalent of the cutaway diagram | `e2e/stage-six.spec.ts › all 8 anatomy hotspots are keyboard-reachable in pathway order and open matching text panel` |
| `hearing.frequency-location-slider` | Range slider | Sets a test frequency and highlights its simplified corresponding location along the cochlea model | "Test frequency for cochlear mapping" | Tab, `←`/`→` step 10 Hz (log-scaled internally), `Home`/`End` to bounds | Live "Frequency: 4000 Hz → high-frequency region (base of cochlea)" | Returns to 1000 Hz default | Clamped [20, 20000] Hz | Text mapping table (frequency range → cochlear region) always shown | `e2e/stage-six.spec.ts › frequency-location slider highlights the correct simplified cochlear region at each end of range` |
| `hearing.representation-ladder-toggle` | Disclosure button | Expands/collapses the "mechanical → fluid → electrical" explanatory ladder for the currently selected part | "Show signal-type explanation" | Tab-reachable; `Enter`/`Space` toggles, `aria-expanded` reflects state | N/A | Collapses on part deselection | N/A | N/A | `e2e/stage-six.spec.ts › representation ladder disclosure expands/collapses per selected part` |
| `hearing.protection-info-toggle` | Disclosure button | Expands/collapses hearing-protection context (non-diagnostic) | "Show hearing protection information" | as above | N/A | as above | N/A | N/A | `e2e/stage-six.spec.ts › hearing-protection disclosure never presents diagnostic claims (content check)` |

### 5.2 Aboriginal and Torres Strait Islander sound-material investigation (`cultural-sound`) — Stage S6-deferred

**Status: not built.** Blocked on Irvin supplying/approving attributable, community-specific
sources per the shared spec's cultural-integrity requirements and the orchestration plan's
Part B item 9. The controls below are forward planning only and must not be scaffolded with
placeholder content — an empty or generic version of this module is a spec violation
("never imply that a feature is absent as if functional"), so this route stays out of
navigation entirely until source-gated content exists.

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `cultural-sound.material-select` | Listbox (populated only from Irvin-approved, attributed sources) | Selects a specific, named material/instrument tied to a specific community and Country | "Instrument material" | Tab, arrow keys, `Enter` | Selected item's name with community attribution shown adjacent, never anonymised | N/A until built | N/A until built | N/A until built | Not yet in `TEST_PLAN.md` — added when content is approved |
| `cultural-sound.length-slider` | Range slider | Demonstrates how length affects the acoustic property being investigated | "Material length" | Tab, arrow keys | Live value with unit | N/A until built | N/A until built | N/A until built | as above |
| `cultural-sound.thickness-slider` | Range slider | as above for thickness | "Material thickness" | as above | as above | N/A until built | N/A until built | N/A until built | as above |
| `cultural-sound.cavity-slider` | Range slider | as above for cavity size | "Cavity size" | as above | as above | N/A until built | N/A until built | N/A until built | as above |
| `cultural-sound.tension-slider` | Range slider | as above for tension | "Tension" | as above | as above | N/A until built | N/A until built | N/A until built | as above |
| `cultural-sound.striking-method-select` | Listbox | Selects striking/playing method | "Playing method" | Tab, arrow keys, `Enter` | Selected method name | N/A until built | N/A until built | N/A until built | as above |

### 5.3 Ultrasound diagnostic lab (`ultrasound`)

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `ultrasound.pulse-trigger-button` | Push button | Emits one pulse into the synthetic tissue phantom and begins the echo timeline | "Send ultrasound pulse" | Tab-reachable; `Enter`/`Space` activates | N/A | N/A | Disabled while a pulse is still returning, re-enabled after echo completes or times out | Text log "Pulse sent at t=0.0 ms" replaces animation | `e2e/stage-six.spec.ts › pulse trigger is disabled mid-pulse and logs the event in fallback text` |
| `ultrasound.probe-angle-slider` | Range slider | Adjusts conceptual probe angle against the phantom | "Probe angle" | Tab, `←`/`→` step 1°, `Home`/`End` to bounds | Live "Angle: 15°" | Returns to 0° (perpendicular) default | Clamped [-45°, 45°] | Numeric input fallback | `e2e/stage-six.spec.ts › probe angle slider clamps to ±45°` |
| `ultrasound.probe-frequency-slider` | Range slider | Adjusts conceptual probe frequency, trading penetration for resolution per the qualitative model | "Probe frequency" | Tab, `←`/`→` step | Live "Frequency: 5 MHz" | Returns to 5 MHz default | Clamped to the curated realistic diagnostic range | Text explanation of the penetration/resolution trade-off always shown | `e2e/stage-six.spec.ts › probe frequency slider clamps and updates the penetration/resolution trade-off note` |
| `ultrasound.tissue-phantom-select` | Listbox | Selects a synthetic tissue-layer scenario | "Tissue phantom scenario" | Tab, arrow keys, `Enter` | Selected scenario name; explicit "synthetic phantom, not real patient data" label always visible | Returns to default scenario | N/A — fixed synthetic option set only; no real-data import path exists (privacy/safety requirement) | N/A | `e2e/stage-six.spec.ts › tissue phantom select only offers synthetic scenarios and the non-clinical label is always visible` |
| `ultrasound.bmode-image-toggle` | Checkbox | Shows/hides the assembled simplified B-mode image built from accumulated scan lines | "Show B-mode image" | Tab-reachable; `Space` toggles | Checked/unchecked | Returns to unchecked default | N/A | Numeric echo-depth table always available as the accessible equivalent of the image | `e2e/stage-six.spec.ts › B-mode toggle has an always-available numeric depth-table equivalent` |

---

## 6. Light and optics workspace (`optics`) — Stage S4

Covers app-plan §8.1–8.3.

### 6.1 Reflection (§8.1)

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `optics.reflection-source-drag` | Native range slider (pointer/keyboard-operable ray-source position) | Repositions the light source along the bench | "Light source position" | Tab-reachable; `←`/`→` move 1 cm along the bench axis, `Home`/`End` to bench ends | Live position "Source at x = 20 cm" | Returns to default 20 cm | Clamped to [0,100] cm | The native range is the pointer and keyboard implementation; the numeric readout is always present | `e2e/optics.spec.ts › reflection controls, challenge feedback and keyboard bounds are observable` |
| `optics.reflection-mirror-position` | Native range slider | Repositions the mirror along the bench | "Mirror position" | Tab; arrows step 1 cm; `Home`/`End` reach bounds | Live "Position: 50 cm" | Returns to 50 cm | Clamped to [0,100] cm | Native range + numeric readout | same test as above |
| `optics.reflection-mirror-angle` | Native range slider | Rotates the mirror and updates incident/reflected angles | "Mirror position and angle" | Tab; arrows step 1°; `Home`/`End` reach bounds | Mirror angle and incident angle, both in degrees | Returns to 60° mirror angle (30° incidence) | Clamped [1°,180°]; derived ray incidence is clamped below grazing | Native range + numeric law readout | same test as above |
| `optics.reflection-normal-toggle` | Checkbox | Shows/hides the normal line at the point of incidence | "Show normal line" | Tab-reachable; `Space` toggles | Checked/unchecked | Returns to checked (on) default | N/A | N/A | `e2e/optics.spec.ts › normal-line toggle shows/hides construction line` |
| `optics.reflection-protractor-tool` | Checkbox attaching a measurement readout | Shows the incident/reflected numeric measurements from the normal | "Protractor" | Tab-reachable; `Space` toggles | "Measured incident 30.0°; reflected 30.0°" | Returns to detached/hidden state on reset | N/A — read-only measurement, no invalid state | Law readout remains present when detached | `e2e/optics.spec.ts › reflection controls, challenge feedback and keyboard bounds are observable` |
| `optics.mirror-type-select` | Listbox (Plane, Concave, Convex) | Switches mirror curvature model; concave/convex are scaffolded extensions | "Mirror type" | Tab, arrow keys, `Enter` | Selected type label | Returns to "Plane" default | N/A — fixed option set | N/A | `e2e/optics.spec.ts › mirror type select switches ray-construction model` |
| `optics.reflection-challenge-select` | Listbox (Periscope design, Reflector design) | Loads a design-challenge scenario with a target outcome to achieve by positioning mirrors | "Design challenge" | Tab, arrow keys, `Enter` | Selected challenge name and its goal text | Returns to "None" (free play) default | Challenge completion check runs on every mirror move; a near-miss shows specific feedback (e.g. "close — the reflected ray misses the target by 8°"), never a bare pass/fail | N/A | `e2e/optics.spec.ts › periscope and reflector challenges give specific distance-to-goal feedback, not just pass/fail` |

### 6.2 Refraction (§8.2)

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `optics.refraction-first-medium-select` | Listbox (curated refractive indices) | Sets the medium the incident ray is leaving; required for less-dense/TIR cases | "First medium" | Tab, arrow keys, `Enter` | Selected medium and refractive index | Returns to Air | Fixed curated set | N/A | `e2e/optics.spec.ts › first and second medium controls support both ordinary refraction and TIR` |
| `optics.refraction-media-select` | Listbox (Air, Water, Glass, Diamond, ... curated refractive indices) | Sets the second medium's refractive index | "Second medium" | Tab, arrow keys, `Enter` | Selected medium name with its refractive index, e.g. "Water (n = 1.33)" | Returns to "Air → Water" default pair | N/A — fixed curated option set with sourced values | N/A | `e2e/optics.spec.ts › medium select shows sourced refractive index and updates ray bending` |
| `optics.refraction-incident-angle-slider` | Range slider | Sets the incident ray angle from the normal | "Incident angle" | Tab, `←`/`→` step 1°, `Home`/`End` to bounds | Live "Incident: 40°" | Returns to 30° default | Clamped [0°, 89°] (90° excluded — grazing incidence undefined in the simple model, with inline note) | Numeric input fallback | `e2e/optics.spec.ts › incident angle slider clamps below 90° with an explanatory note at the boundary` |
| `optics.frequency-constant-indicator` | Static readout (labelling audit item) | Confirms that frequency is displayed as unchanged across the boundary while speed/wavelength change | Heading "Frequency at boundary" | N/A — static readouts are exempt from activation/focus requirements | "5.00e+14 Hz — unchanged across boundary" | N/A | N/A | Plain text | `e2e/optics.spec.ts › refraction preserves frequency, changes speed/wavelength and represents TIR without a false ray` |
| `optics.snells-law-calculation-toggle` | Disclosure button (extension) | Expands/collapses a worked Snell's-law calculation for the current angle/media pair | "Show Snell's law calculation" | Tab-reachable; `Enter`/`Space` toggles, `aria-expanded` reflects state | Shown calculation includes live values, e.g. "n₁ sin θ₁ = n₂ sin θ₂ → 1.00 × sin 40° = 1.33 × sin θ₂ → θ₂ = 28.9°" | Collapses on reset | N/A | N/A | `e2e/optics.spec.ts › Snell's law disclosure computation matches the rendered refracted ray angle` |
| `optics.tir-demo-toggle` | Checkbox | Enables a guided sweep past the critical angle to demonstrate total internal reflection | "Demonstrate total internal reflection" | Tab-reachable; `Space` toggles | Live critical-angle readout appears when enabled, e.g. "Critical angle: 48.8°" | Returns to unchecked default | N/A | Text explanation of TIR conditions always available | `e2e/optics.spec.ts › TIR demo shows correct critical angle and switches ray behaviour past it` |
| `optics.fibre-application-toggle` | Disclosure button | Expands/collapses the optical-fibre application explanation linked to TIR | "Show optical fibre application" | as above pattern | N/A | as above | N/A | N/A | `e2e/optics.spec.ts › optical fibre application disclosure expands/collapses` |

### 6.3 Absorption and scattering (§8.3)

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `optics.material-surface-select` | Listbox | Selects a material/surface with a defined spectral response | "Material or surface" | Tab, arrow keys, `Enter` | Selected material name | Returns to default material | N/A — fixed curated option set | N/A | `e2e/optics.spec.ts › material select updates the energy ledger to a new curated response` |
| `optics.illuminant-select` | Listbox | Changes the named teaching illuminant and therefore the normalised energy-ledger fixture | "Illuminant (light source type)" | Tab, arrow keys, `Enter` | Daylight (model), Warm LED (model), or UV-rich source (model); no D65 measurement claim | Returns to "Daylight (model)" | N/A — fixed option set | N/A | `e2e/optics.spec.ts › energy ledger conserves 100 percent and all scattering regimes are reachable` |
| `optics.energy-ledger-display` | Static stacked-bar + table readout (labelling audit item) | Shows transmitted/reflected/absorbed model fractions for the current material/illuminant | Region label "Energy ledger: transmitted, reflected, absorbed" | N/A — static readouts are exempt from activation/focus requirements | Default smoked glass/daylight: T 10%, R 8%, A 82%, total 100% | N/A | Engine rejects any non-conserving fixture in unit tests | Scrollable text table is always present, not colour-only | same test as above |
| `optics.atmospheric-particle-size-slider` | Range slider | Adjusts a conceptual setting selecting a qualitative scattering regime | "Atmospheric particle size" | Tab, `←`/`→` step 1%, `Home`/`End` to bounds | Live conceptual setting plus Small (0–33), Comparable-size (34–66), or Large (67–100) regime | Returns to 20% (Small) | Clamped [0,100]; no physical particle-size unit is claimed | Text regime/explanation always present | same test as above |
| `optics.application-select` | Listbox (Sunscreen/UV, Thermal absorption, White/black surfaces, Visibility, Remote sensing) | Loads a worked everyday-application scenario using the current material/illuminant settings | "Everyday application" | Tab, arrow keys, `Enter` | Selected application name and its explanatory text, including the "avoid overclaiming black-heats-fastest" guardrail note where relevant | Returns to "None" default | N/A — fixed option set | N/A | `e2e/optics.spec.ts › application select text includes the stated assumptions/guardrail for each scenario` |
| `optics.lens-type-select` | Listbox (Converging, Diverging) | Loads a qualitative lens application ray model for a magnifier/camera comparison | "Lens type" | Tab, arrow keys, `Enter` | Selected lens and qualitative image description | Returns to Converging | Fixed set; no lens equation or fabricated focal length | Text ray-path description always present | `e2e/optics.spec.ts › lens application control switches converging/diverging qualitative outcomes` |

### 6.4 Stage 4 as-built investigation, assessment and evidence controls (2026-07-20)

The surface/illuminant values are normalised deterministic teaching fixtures documented
in `SCIENCE_REVIEW.md` §9.6, not measured material constants. Reflection defaults are
source 20 cm, mirror 50 cm and mirror angle 60° (30° incidence). Refraction defaults are
air → water, 30°, and source frequency `5.00e+14 Hz`. The UI excludes grazing incidence
with a maximum of 89°; the pure engine throws a `RangeError` for 90° rather than returning
`NaN` or drawing a fictitious ray. Mirror and lens extension outputs are deliberately
qualitative; no focal length, mirror equation, temperature, perceived-colour or D65
measurement is fabricated.

Static manifest IDs (`optics.frequency-constant-indicator`,
`optics.energy-ledger-display`, `vision.pupil-response-display`) identify audited
readouts. They must update from state and have a text/table equivalent, but because they
are not controls they are explicitly exempt from keyboard focus and activation tests.

| ID | Control | Effect / acceptance | Accessible name | Keyboard / reset / validation | Browser evidence |
|---|---|---|---|---|---|
| `optics.record-reflection-button` | Button | Adds the current angle pair to the trial table/graph | "Record reflection trial" | Tab + Enter/Space; trials clear only after confirmed reset | complete controlled-investigation test in `tests/e2e/optics.spec.ts` |
| `optics.record-refraction-button` | Button | Adds current medium/angle result, including explicit TIR result | "Record refraction trial" | as above | same |
| `optics.record-energy-button` | Button | Adds current T/R/A ledger and scattering regime | "Record energy/scattering trial" | as above | same |
| `optics.trial-delete-button` | Per-row button | Deletes one named trial | "Delete trial N" | Tab + Enter/Space | same |
| `optics.hypothesis-input` | Textarea | Captures a pre-interpretation prediction with reason | "Hypothesis" | Tab; cleared by confirmed reset; non-empty required | same |
| `optics.interpretation-input` | Textarea | Captures the measured pattern | "What pattern did your measurements show?" | as above | same |
| `optics.conclusion-input` | Textarea | Answers the aim and compares evidence with hypothesis | "Conclusion" | as above | same |
| `optics.limitation-input` | Textarea | Captures model limitation and real-evidence improvement | "Limitation and improvement" | as above | same |
| `optics.export-csv-button` | Button | Downloads unit-labelled trial CSV | "Export trials (CSV)" | Disabled until ≥1 trial; Tab + Enter/Space | same |
| `optics.export-json-button` | Button | Downloads versioned investigation JSON | "Export trials (JSON)" | as above | same |
| `optics.print-button` | Button | Opens the browser print flow | "Print investigation" | Tab + Enter/Space | same |
| `optics.save-investigation-button` | Button | Saves 7.3.2 evidence only after hypothesis, ≥2 reflection points, refraction, energy, interpretation, conclusion and limitation | "Save investigation as evidence" | Empty/incomplete evidence gets a specific error and is never accepted | same |
| `optics.lens-object-position` | Radio group | Switches Near/Far qualitative converging-lens result | "Object position" | Tab/arrows/Space; resets to Near | applications test in `tests/e2e/optics.spec.ts` |
| `optics.application-justification-input` | Textarea | Claim + cited model property + reasoning | "Design justification" | Required, cleared on reset | same |
| `optics.application-assumption-input` | Textarea | States a conditional assumption/limitation | "Assumption or limitation" | Required, cleared on reset | same |
| `optics.application-save-button` | Button | Saves 7.3.3 evidence | "Save design justification" | Scenario + both text fields required | same |
| `optics.check-question` | MCQ/numeric question region | Presents the validated eight-question 7.3.1–7.3.3 bank | Prompt/answer labels vary by item | Native radio/text keyboard behaviour; empty/malformed never scores | check-question test + validation unit suite |
| `optics.check-hint-button` | Progressive disclosure button | Reveals three increasingly strong hints | "Show a hint" / stronger / worked reasoning | Tab + Enter/Space | same |
| `optics.check-submit-button` / `optics.check-next-button` / `optics.check-restart-button` | Buttons | Validates, advances after a scored answer, then permits a fresh bank attempt | Visible button text | Tab + Enter/Space; answer locked after scoring | same |
| `optics.cer-editor` | Static CER region | Groups the refraction claim, evidence and reasoning fields under one stable runtime inventory ID | Region text begins with the refraction explanation prompt | Static grouping; child textareas and save button carry the keyboard interaction | CER test in `tests/e2e/optics.spec.ts`; runtime documentation parity in `tests/e2e/control-inventory.spec.ts` |
| `optics.cer-claim-input` / `optics.cer-evidence-input` / `optics.cer-reasoning-input` | Textareas | Complete the 7.3.2 CER scaffold | Claim / Evidence / Reasoning | Each required in order; missing field named specifically | CER test in `tests/e2e/optics.spec.ts` |
| `optics.cer-save-button` | Button | Saves complete CER evidence | "Save explanation as evidence" | Tab + Enter/Space | same |

Every Stage 4 route also uses the already-inventoried route-scoped
`global.reset-button`; reset returns the documented defaults and requests confirmation
before discarding investigation trials.

---

## 7. Vision and astronomy (Stage S4 vision / S6 astronomy)

Covers app-plan §9.1–9.2.

### 7.1 Eye response simulator (`vision`) — Stage S4

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `vision.object-distance-slider` | Range slider | Sets the viewed object's distance from the eye | "Object distance" | Tab, `←`/`→` step 5 cm, `Home`/`End` to bounds | Live "Distance: 40 cm" | Returns to 50 cm default | Clamped [10 cm, 10 m] | Numeric input fallback | `e2e/vision.spec.ts › object distance slider clamps and drives retinal image size` |
| `vision.brightness-slider` | Range slider | Sets ambient brightness, driving pupil response | "Ambient brightness" | Tab, `←`/`→` step 5%, `Home`/`End` to bounds | Live "Brightness: 60%" | Returns to 60% default | Clamped [0,100]% | Numeric input fallback | `e2e/vision.spec.ts › brightness slider clamps and pupil diameter responds correctly at extremes` |
| `vision.pupil-response-display` | Static readout (labelling audit item) | Shows relative pupil opening reacting to brightness | "Relative pupil opening" | N/A (not interactive) | "Relative pupil opening: 55% (teaching model, not millimetres)" | N/A | N/A | Text value always present alongside the diagram | `e2e/vision.spec.ts › relative pupil opening narrows/widens correctly with brightness (no colour-only cue)` |
| `vision.accommodation-slider` | Range slider | Manually adjusts lens accommodation/focus to explore image sharpness independent of the automatic model | "Lens accommodation" | Tab, `←`/`→` step 5%, `Home`/`End` to bounds | Live "Accommodation: 80%" | Returns to the value that produces a sharp image for the current object distance (auto-focus default) | Clamped [0,100]% | Text description of "in focus / out of focus" state always present, not conveyed by blur alone | `e2e/vision.spec.ts › accommodation slider changes sharpness and state is described in text, not blur alone` |
| `vision.blind-spot-demo-button` | Push button | Runs a guided blind-spot demonstration sequence with instructions | "Run blind spot demonstration" | Tab-reachable; `Enter`/`Space` activates | Step-by-step instruction text updates as the demo proceeds | Returns to step 1 on reset | N/A | Entirely text-instruction-driven already; no separate fallback needed | `e2e/vision.spec.ts › blind spot demo instructions are fully readable via text, no image-only step` |
| `vision.focusing-problem-toggle` | Listbox (extension: None, Short-sighted model, Long-sighted model) | Loads a common focusing-problem model, explicitly labelled as educational, not medical advice | "Focusing problem model" | Tab, arrow keys, `Enter` | Selected model name plus its "not medical advice" label, always visible when a problem model is active | Returns to "None" default | N/A — fixed option set | N/A | `e2e/vision.spec.ts › focusing-problem models always display the non-diagnostic disclaimer` |

### 7.1.1 Stage 4 as-built vision evidence controls (2026-07-20)

The eye model is relative and non-diagnostic: pupil opening is 100% at the darkest
supported setting and 25% at the brightest, accommodation is a normalised inverse-
distance demand over 10 cm–10 m, and retinal image size is a relative unit. It makes no
millimetre, lux, prescription or medical claim. Focus is stated in text with a ±5
percentage-point teaching threshold.

| ID | Control | Effect | Accessible name | Keyboard / reset / validation | Browser evidence |
|---|---|---|---|---|---|
| `vision.explanation-input` | Textarea | Captures a linked optical-image and neural-processing explanation | Full visible prompt label | Tab; reset clears | evidence/reset test in `tests/e2e/vision.spec.ts` |
| `vision.save-explanation-button` | Button | Saves 7.3.1 explanation evidence | "Save vision explanation" | Tab + Enter/Space; empty text rejected | same |

### 7.2 Reading starlight (`astronomy`) — Stage S6

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `astronomy.band-select` | Listbox (Radio, Infrared, Visible, Ultraviolet, X-ray, Gamma) | Switches which observational band's curated dataset is displayed for the selected star | "Observation band" | Tab, arrow keys, `Enter` | Selected band name | Returns to "Visible" default | N/A — fixed option set | N/A | `e2e/stage-six.spec.ts › band select changes displayed dataset and each band's dataset has a cited source` |
| `astronomy.stellar-example-select` | Listbox | Selects a curated, sourced stellar example | "Star example" | Tab, arrow keys, `Enter` | Selected star name with source citation always visible | Returns to first star in the curated list | N/A — fixed curated option set only, no free-text star lookup (avoids inventing data) | N/A | `e2e/stage-six.spec.ts › every stellar example has a visible source citation` |
| `astronomy.spectral-line-tool` | Draggable/keyboard-operable cursor on the spectrum plot | Inspects a spectral line's wavelength and identifies the associated element from curated line-position data | "Spectral line inspector" | Tab-reachable; `←`/`→` move cursor along spectrum in small wavelength steps, `Home`/`End` to plot ends | Live "λ = 656.3 nm — Hydrogen-alpha" | Returns to leftmost position on reset | Cursor snaps to the nearest real curated line within a tolerance; positions with no known line show "No catalogued line here" rather than inventing an identification | Text/table list of all catalogued lines for the current star, always available | `e2e/stage-six.spec.ts › spectral line inspector only identifies catalogued lines, never invents one (false-positive regression)` |
| `astronomy.redshift-blueshift-slider` | Range slider (signed) | Applies a Doppler shift to the displayed spectrum to demonstrate motion evidence | "Radial velocity (redshift/blueshift)" | Tab, `←`/`→` step, `Home`/`End` to bounds | Live "Velocity: +120 km/s (redshift — receding)" | Returns to 0 km/s default | Clamped to a realistic stellar-velocity range; sign always paired with the direction word, never colour-only | Text readout always shown alongside the shifted plot | `e2e/stage-six.spec.ts › redshift/blueshift slider pairs sign with direction text, never colour-only` |
| `astronomy.atmospheric-window-toggle` | Checkbox | Shows/hides the atmospheric-transmission-window overlay explaining why some bands need space telescopes | "Show atmospheric windows" | Tab-reachable; `Space` toggles | Checked/unchecked | Returns to unchecked default | N/A | Text list of which bands are ground-observable vs space-only, always present | `e2e/stage-six.spec.ts › atmospheric window toggle text explains the ground vs space telescope reason for each band` |

---

## 8. Describing motion workspace (`motion`) — Stage S5

Covers app-plan §10.1–10.3.

### 8.1 Track laboratory (§10.1)

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `motion.origin-direction-setter` | Draggable/keyboard-operable marker + toggle | Sets the coordinate origin and the positive direction on the 1D track | "Track origin and positive direction" | Tab-reachable; `←`/`→` move origin, `R` (or a dedicated button) flips positive direction | Live "Origin at 0 m, positive direction: right" | Returns to left-end origin, positive-right default | N/A — origin can be placed anywhere on the track, no invalid position | Numeric input + direction radio-button fallback | `e2e/motion-forces.spec.ts › origin/direction setter is keyboard-operable and all readouts respect the chosen sign convention` |
| `motion.walker-control` | Push-button set (Move +, Move −, Pause, Turn around, Speed up, Slow down) mapped to preset walker/cart behaviours | Drives the walker/cart through the required behaviours: steady positive/negative motion, turning around, pausing, speeding up, slowing down | "Walker control: [behaviour]" ×6, e.g. "Walker control: turn around" | Tab through all 6 buttons individually; `Enter`/`Space` activates each | Live position/velocity readout updates continuously while active | `global.reset-button` returns the walker to the track start, stationary | Rapid double-activation is debounced (queues the next command rather than corrupting state) | Text/table of position-vs-time log updates identically without canvas rendering | `e2e/motion-forces.spec.ts › all six walker-control behaviours are individually keyboard-triggerable and logged` |
| `motion.timer-start-button` | Push button | Starts/stops the track timer for the current run | "Track timer" | Tab-reachable; `Enter`/`Space` starts/stops | Live elapsed time "Elapsed: 3.4 s" | Returns to 0.0 s on reset | N/A | N/A | `e2e/motion-forces.spec.ts › track timer starts, stops, and resets to 0.0 s` |
| `motion.distance-displacement-display` | Static dual readout (labelling audit item) | Shows distance (always non-negative, scalar) alongside displacement (signed, vector) for the current run | "Distance travelled and displacement from origin" | N/A (not interactive) | "Distance: 6.0 m, Displacement: +2.0 m" | Resets to 0/0 with the walker | N/A | Both values always shown as text, never merged into one ambiguous number | `e2e/motion-forces.spec.ts › distance is always non-negative while displacement carries a sign, for every walker behaviour (invariant)` |
| `motion.speed-velocity-display` | Static dual readout (labelling audit item) | Shows instantaneous speed (scalar) alongside velocity (signed) | "Speed and velocity" | N/A (not interactive) | "Speed: 1.5 m/s, Velocity: −1.5 m/s" | Resets with the walker | N/A | Both values always shown as text | `e2e/motion-forces.spec.ts › speed magnitude equals abs(velocity) for every walker behaviour (invariant)` |

### 8.2 Motion diagrams (§10.2)

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `motion.strobe-dot-editor` | Click/keyboard-placeable dot sequence on a track | Students place position dots at equal time intervals to construct a motion diagram | "Place strobe dot at current cursor position" | Tab-reachable; `←`/`→` move placement cursor, `Enter`/`Space` places a dot, `Backspace` removes the last dot | Live "Dot 4 of up to 8 placed" | `global.reset-button` clears all placed dots | Placing more dots than the interval count allows is blocked with "Maximum dots for this interval reached" | Numeric-entry alternative (type each dot's position value into a list) when drag/click placement is unavailable | `e2e/motion-forces.spec.ts › strobe-dot editor is fully keyboard-operable and blocks excess dot placement with a message` |
| `motion.time-interval-select` | Listbox (0.1 s, 0.2 s, 0.5 s, 1.0 s) | Sets the equal time interval represented by consecutive dots | "Time interval between dots" | Tab, arrow keys, `Enter` | Selected interval, e.g. "0.2 s" | Returns to 0.2 s default | N/A — fixed option set | N/A | `e2e/motion-forces.spec.ts › time interval select relabels dot spacing meaning without moving existing dots` |
| `motion.velocity-arrow-overlay-toggle` | Checkbox | Shows/hides derived velocity-arrow overlay, kept visually separate from the position dots | "Show velocity arrows" | Tab-reachable; `Space` toggles | Checked/unchecked | Returns to unchecked default | N/A | N/A | `e2e/motion-forces.spec.ts › velocity arrows are a distinct, togglable overlay never merged with position dots` |
| `motion.acceleration-arrow-overlay-toggle` | Checkbox | Shows/hides derived acceleration-arrow overlay | "Show acceleration arrows" | as above | Checked/unchecked | Returns to unchecked default | N/A | N/A | `e2e/motion-forces.spec.ts › acceleration arrows are a distinct, togglable overlay` |
| `motion.diagram-pattern-select` | Listbox (Constant velocity, Acceleration, Deceleration, Reversal, Rest) | Loads a target motion pattern for the student to reconstruct with the strobe-dot editor, with a check against the correct dot spacing | "Target motion pattern" | Tab, arrow keys, `Enter` | Selected pattern name and its goal description | Returns to "Constant velocity" default | Checking the student's dot placement against the target uses a tolerance band, with specific feedback per pattern (e.g. "dots should get farther apart for acceleration") rather than a bare correct/incorrect | N/A | `e2e/motion-forces.spec.ts › each of the five target patterns gives pattern-specific feedback, not generic pass/fail` |

### 8.3 Graph laboratory (§10.3)

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `motion.trial-record-button` | Push button | Starts/stops recording a timed trial from the track laboratory into the results table | "Record trial" | Tab-reachable; `Enter`/`Space` starts/stops | Live elapsed time while recording | N/A (trials accumulate; cleared by `global.reset-button` with confirmation) | Recording with the walker never started shows "Start the walker before recording" | N/A | `e2e/motion-forces.spec.ts › trial recording requires an active run and is start/stop keyboard-operable` |
| `motion.trial-data-table` | Data table, editable distance/time cells + delete per row | Displays and allows manual entry/correction of distance-time trial data | "Motion trial results table"; row delete buttons "Delete trial [n]" | Tab into cells and buttons individually; standard text-editing within cells | Column headers carry units (s, m); no unit repeated per cell | Clears with confirmation on reset | Non-numeric or negative time/distance entries rejected inline with "Enter a non-negative number", never silently zeroed | Identical table with no canvas dependency | `e2e/motion-forces.spec.ts › trial table rejects non-numeric and negative manual entries (false-positive regression)` |
| `motion.graph-type-select` | Listbox (Distance-time, Position/Displacement-time, Velocity-time) | Switches which graph is plotted from the trial data | "Graph type" | Tab, arrow keys, `Enter` | Selected graph type label with axis units shown, e.g. "Distance (m) vs Time (s)" | Returns to "Distance-time" default | Fewer than 2 data points shows "Add at least two trials to see a graph" | SVG graph with an always-present visually-hidden data-table equivalent | `e2e/motion-forces.spec.ts › graph type select relabels axes correctly and requires 2+ points` |
| `motion.slope-identification-tool` | Draggable/keyboard-operable two-point selector on the graph | Computes the slope between two selected graph points and labels it as speed (for a straight distance-time graph) | "Slope tool — select two points" | Tab-reachable; `←`/`→` move the active point selector along plotted data points, `Enter` locks a point | Live "Slope: 1.5 m/s between t=1.0s and t=3.0s" | Returns to no selection on reset | Selecting the same point twice shows "Choose two different points" | Numeric point-index dropdown alternative for point selection | `e2e/motion-forces.spec.ts › slope tool matches the configured motion's speed within tolerance (invariant: graph slope = motion)` |
| `motion.piecewise-story-select` | Listbox (curated short motion "stories", e.g. "walks, pauses, then jogs back") | Loads a target piecewise-motion scenario for the student to interpret from a pre-drawn graph, explicitly guarding against reading the graph as a literal path/hill | "Motion story scenario" | Tab, arrow keys, `Enter` | Selected story name | Returns to "None" default | Interpretation-check answers that describe the graph as a physical hill/path are marked incorrect with feedback restating the guardrail, never marked correct | N/A | `e2e/motion-forces.spec.ts › piecewise story interpretation rejects "graph is a literal hill" answers (false-positive regression)` |

---

### 8.4 Stage 5 as-built additions and ID splits

The shipped implementation splits the two planned grouped controls into unique,
testable controls and adds the investigation/assessment/evidence controls required by
the shared learning rhythm. All native inputs/buttons use standard Tab, arrow-key,
Enter/Space and text-editing behaviour. Reset that would discard a non-empty log asks
for confirmation; simple empty-state reset is immediate.

| As-built IDs | Default / constraint | Evidence and browser coverage |
|---|---|---|
| `motion.origin-position-slider`; `motion.positive-direction-right-radio`; `motion.positive-direction-left-radio` | origin `0 m` in `−10…+10 m`; positive right | sign-convention/return-trip flow in `motion-forces.spec.ts` |
| `motion.walker-move-positive-button`; `motion.walker-move-negative-button`; `motion.walker-pause-button`; `motion.walker-turn-button`; `motion.walker-speed-up-button`; `motion.walker-slow-down-button` | stationary at physical `0 m`; moves/steps are exact `1.0 s`; speed cap `10 m/s` | keyboard/reduced-motion exact-step test; text log fallback |
| `motion.average-instantaneous-comparison-input`; `motion.save-track-evidence-button` | empty; requires two samples + comparison | saves 7.4.1 evidence; names missing requirements |
| `motion.strobe-add-dot-button`; `motion.strobe-remove-dot-button`; `motion.diagram-check-button`; `motion.diagram-explanation-input`; `motion.save-diagram-evidence-button` | six preset dots; `2…8` allowed | interval-stability, reversal feedback and 7.4.2 evidence test |
| `motion.trial-speed-slider`; `motion.trial-duration-slider`; `motion.trial-delete-button` | `2.0 m/s`; `1 s`; empty table | semantic units-bearing table; three-trial graph/export flow |
| `motion.piecewise-story-submit-button` | no answer | literal-hill answer always fails with specific feedback |
| `motion.investigation-aim-input`; `motion.investigation-hypothesis-input`; `motion.investigation-interpretation-input`; `motion.investigation-comparison-input`; `motion.investigation-conclusion-input`; `motion.investigation-limitation-input` | empty | each field required by name before 7.4.1/7.4.3 promotion |
| `motion.export-csv-button`; `motion.export-json-button`; `motion.print-button`; `motion.save-investigation-button` | exports disabled until a trial; print available | CSV/JSON download test; complete investigation evidence |
| `motion.check-question`; `motion.check-submit-button`; `motion.check-next-button`; `motion.check-hint-button`; `motion.check-restart-button` | first of six questions; 0 hints | outcomes 7.4.1–7.4.3; three hints; invalid input unscored |
| `motion.cer-editor`; `motion.cer-0-input`; `motion.cer-1-input`; `motion.cer-2-input`; `motion.cer-3-input`; `motion.cer-save-button` | all empty | identifies the specific missing CER/limitation field |

Static readouts `motion.distance-displacement-display`,
`motion.speed-velocity-display` and `motion.trial-data-table` are semantic output, not
activation targets; the inventory-wide “keyboard exercise” rule explicitly exempts
static readouts while still requiring visible text and table equivalents.

## 9. Forces and Newton's laws (`forces`) — Stage S5

Covers app-plan §11.1–11.3.

### 9.1 One-dimensional force studio (§11.1)

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `forces.add-force-button` | Push button | Adds a new labelled force arrow to the single selected object | "Add a force" | Tab-reachable; `Enter`/`Space` activates | N/A | N/A (adding is additive; cleared by `global.reset-button`) | Disabled once the maximum modelled forces (6) is reached, with a visible reason | N/A | `e2e/motion-forces.spec.ts › add-force button is disabled at the modelled maximum with a visible reason` |
| `forces.force-magnitude-input` | Numeric input (one per added force) | Sets the force's magnitude in newtons | "Force [n] magnitude" | Tab-reachable; standard text-input editing | Unit suffix "N" always shown | Removed with its force on delete | Empty → "Enter a magnitude"; negative → magnitude field itself never accepts negative values (direction is set separately) so this is structurally prevented, not just validated | N/A | `e2e/motion-forces.spec.ts › force magnitude input rejects empty and cannot represent negative magnitude by construction` |
| `forces.force-direction-select` | Toggle (Positive / Negative, relative to the chosen positive direction) | Sets the force's sign relative to the studio's positive-direction convention | "Force [n] direction" | Tab, arrow keys, `Enter` | Selected direction label, paired with the arrow's visual direction (never colour-only) | Returns to "Positive" default for new forces | N/A — fixed binary choice | N/A | `e2e/motion-forces.spec.ts › force direction select pairs with arrow direction, not colour-only` |
| `forces.positive-direction-select` | Toggle (Left / Right) | Sets the studio's positive-direction convention, re-signing all existing forces' displayed values consistently | "Positive direction convention" | Tab, arrow keys, `Enter` | Selected direction label | Returns to "Right" default | Changing convention recalculates every existing force's sign and the net-force readout atomically — no stale/mismatched intermediate state is ever rendered | N/A | `e2e/motion-forces.spec.ts › changing positive-direction convention re-signs every existing force and the net force consistently` |
| `forces.force-type-toggle` | Listbox (Applied/thrust, Friction, Drag, Tension, Normal/support, Weight) | Tags an added force with its physical type for labelling purposes | "Force [n] type" | Tab, arrow keys, `Enter` | Selected type label shown next to the arrow | Returns to "Applied" default for new forces | "Weight" is only offered when contextually appropriate (object has mass in a gravity context), per the app-plan guardrail — otherwise disabled with a tooltip reason | N/A | `e2e/motion-forces.spec.ts › weight option is only available in gravity-relevant scenarios` |
| `forces.net-force-display` | Static readout (labelling audit item) | Shows the computed net force from all current arrows | "Net force" | N/A (not interactive) | "Net force: +3.0 N (right)" | Resets to 0 N with `global.reset-button` | N/A | Text sum always shown, working identically without canvas | `e2e/motion-forces.spec.ts › net force equals the signed sum of all current forces for every configuration (invariant)` |

### 9.2 Force–mass–acceleration investigation (§11.2)

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `forces.cart-force-slider` | Range slider | Sets the applied net force on the low-friction cart | "Applied force" | Tab, `←`/`→` step 0.1 N, `Home`/`End` to bounds | Live "Force: 2.0 N" | Returns to 2.0 N default | Clamped [0, 20] N | Numeric input fallback | `e2e/motion-forces.spec.ts › cart force slider clamps to 0-20 N` |
| `forces.cart-mass-slider` | Range slider | Sets the cart's mass | "Cart mass" | Tab, `←`/`→` step 0.1 kg, `Home`/`End` to bounds | Live "Mass: 1.0 kg" | Returns to 1.0 kg default | Clamped [0.1, 10] kg (0 kg excluded — undefined acceleration, with inline note) | Numeric input fallback | `e2e/motion-forces.spec.ts › cart mass slider excludes 0 kg with an explanatory note` |
| `forces.friction-toggle` | Checkbox | Enables/disables a small modelled friction force opposing motion | "Enable friction" | Tab-reachable; `Space` toggles | Checked/unchecked; when checked, the modelled friction magnitude is shown as its own labelled force | Returns to unchecked (ideal, frictionless) default | N/A | N/A | `e2e/motion-forces.spec.ts › friction toggle adds/removes a distinctly labelled opposing force` |
| `forces.trial-run-button` | Push button | Runs one timed trial at the current force/mass/friction settings and records resulting acceleration | "Run trial" | Tab-reachable; `Enter`/`Space` activates | Live "Measured acceleration: 2.0 m/s²" after the run | N/A (trials accumulate; cleared by `global.reset-button` with confirmation) | Disabled while a trial is in progress | Text-log trial result identical to canvas-driven result | `e2e/motion-forces.spec.ts › trial run measured acceleration matches F_net = ma within tolerance (invariant)` |
| `forces.noise-mode-toggle` | Checkbox | Switches between deterministic ideal-run mode and an optional seeded measurement-noise mode for evaluating uncertainty | "Measurement noise mode" | Tab-reachable; `Space` toggles | Checked/unchecked; when checked, the active random seed value is shown, e.g. "Seed: 4471" | Returns to unchecked (ideal, deterministic) default | N/A | N/A | `e2e/motion-forces.spec.ts › noise mode is deterministic for a fixed seed and reproducible on repeat (seeded-noise regression)` |

### 9.3 Newton's laws applications (§11.3)

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `forces.newton-case-select` | Listbox (Seatbelt/passenger, Pushing carts, Walking/ground interaction, Balloon propulsion, Collision forces, Spacecraft motion) | Loads a short case scenario with its own mini-simulation and question set | "Newton's laws case study" | Tab, arrow keys, `Enter` | Selected case name | Returns to first case on reset | N/A — fixed option set | N/A | `e2e/motion-forces.spec.ts › all six Newton case studies load and each corrects its listed target misconception` |
| `forces.newton-case-interaction-controls` | Case-specific push button(s) (e.g. "Apply brakes", "Push cart", "Take a step") | Drives the mini-simulation for the selected case | "[Case-specific action]" (varies per case; each individually named) | Tab-reachable; `Enter`/`Space` activates | Live readout specific to the case (e.g. relative velocity, force pair magnitudes) | Returns to the case's start state on `global.reset-button` | N/A | Text description of the interaction outcome always shown | `e2e/motion-forces.spec.ts › each case's interaction control produces the scientifically correct outcome, not merely plays an animation` |
| `forces.newton-third-law-pair-display` | Static readout (labelling audit item, spacecraft/collision/walking cases) | Shows the third-law force pair explicitly attached to two different objects, never combined on one free-body diagram | "Newton's third law force pair" | N/A (not interactive) | "Force on ground: 400 N down (by foot). Force on foot: 400 N up (by ground)." | Resets with the case | N/A | Text pairing always shown, explicit about the two different objects | `e2e/motion-forces.spec.ts › third-law pairs are always shown as equal/opposite and attached to two different objects (invariant)` |
| `forces.newton-case-feedback-reveal-button` | Push button | Reveals the explanation correcting the case's target misconception after the student attempts the interaction | "Show explanation" | Tab-reachable; `Enter`/`Space` activates | N/A | Collapses again on case change | N/A | N/A | `e2e/motion-forces.spec.ts › feedback reveal shows the specific misconception correction for the active case` |

---

### 9.4 Stage 5 as-built additions and ID splits

| As-built IDs | Default / constraint | Evidence and browser coverage |
|---|---|---|
| `forces.context-select`; `forces.delete-force-button` | horizontal context; no forces | weight/normal options are context-gated; maximum six forces |
| `forces.vector-explanation-input`; `forces.save-vector-evidence-button` | empty explanation; save requires ≥1 valid force plus explanation | captures and saves 7.4.6 signed-vector evidence; missing requirements are named |
| `forces.cart-sweep-select`; `forces.noise-seed-input`; `forces.cart-delete-trial-button` | force sweep; seed `4471`; empty table | two independent controlled series; fixed-seed reload reproduction |
| `forces.cart-hypothesis-input`; `forces.cart-interpretation-input`; `forces.cart-verification-input`; `forces.cart-uncertainty-input`; `forces.cart-conclusion-input`; `forces.cart-limitation-input` | empty | each required by name; noisy mode additionally requires an identical repeat |
| `forces.export-csv-button`; `forces.export-json-button`; `forces.print-button`; `forces.save-investigation-button` | exports disabled until a trial | schema-wrapped JSON and units-bearing CSV; 7.4.4/7.4.7 evidence |
| `forces.newton-seatbelt-action-button`; `forces.newton-carts-action-button`; `forces.newton-walking-action-button`; `forces.newton-balloon-action-button`; `forces.newton-collision-action-button`; `forces.newton-spacecraft-action-button` | selected case reset state | each action has text outcome; walking alone shows the `400 N` pair |
| `forces.application-explanation-input`; `forces.save-application-evidence-button` | empty | requires interaction + explanation for 7.4.5 |
| `forces.calculation-mode-select`; `forces.calculation-input-1`; `forces.calculation-input-2`; `forces.calculate-button`; `forces.calculation-interpretation-input`; `forces.save-calculation-evidence-button` | solve `a=F/m`; blank inputs | all nine rearrangements; zero/nonphysical denominators rejected; unit-labelled 7.4.7 evidence |
| `forces.check-question`; `forces.check-submit-button`; `forces.check-next-button`; `forces.check-hint-button`; `forces.check-restart-button` | first of eight questions; 0 hints | outcomes 7.4.4–7.4.7; three hints; wrong-unit false positives |
| `forces.cer-editor`; `forces.cer-0-input`; `forces.cer-1-input`; `forces.cer-2-input`; `forces.cer-3-input`; `forces.cer-save-button` | all empty | names the missing CER/limitation field before save |

`forces.net-force-display` and `forces.newton-third-law-pair-display` are static
text readouts and share the explicit static-readout keyboard exemption above. SVG
and decorative track/force scenes never carry unique meaning: their semantic tables
and text outcomes are always present. No Stage 5 route uses Canvas or autoplay, so
Canvas denial and reduced-motion both retain the complete activity.

## 10. Waves and motion in society (`society`) — Stage S6

Covers app-plan §12.

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `society.case-study-select` | Select with six reviewed cases | Loads the selected evidence pack and resets its section to Benefits | "Case study" | Native select behavior | Selected case | First case on route load | Fixed options only | N/A | `stage-six.spec.ts › society argument requires every sourced reasoning component and exports` plus content unit tests |
| `society.evidence-pack-viewer` | Select with six evidence sections | Switches the visible reviewed evidence excerpt | "Evidence pack section" | Native select behavior | Selected section | Benefits on case change | Fixed options only | Plain text with source link | same Stage 6 learner test |
| `society.contention-input` | Textarea | Captures the contention | "Your contention" | Native textarea | Text | Route-local | Empty save/export names the missing contention | Semantic HTML | same Stage 6 learner test |
| `society.criteria-builder` | Repeatable labelled text inputs and add/remove buttons | Captures one or more student-defined criteria | "Criterion n"; "Add criterion" / "Remove criterion n" | Native controls | Text | Route-local | Save/export requires one non-empty criterion | Semantic HTML | same Stage 6 learner test |
| `society.evidence-table-entry` | Repeatable claim/source/relevance input groups | Captures sourced evidence rows | "Evidence claim n", "Source n", "Relevance n" | Native controls | Text | Route-local | Save/export requires one row with all three fields | Semantic HTML | same Stage 6 learner test |
| `society.cer-paragraph-editor` | Three labelled textareas | Captures Claim, Evidence and Reasoning | Visible field labels | Native textareas | Text | Route-local | Missing fields are named individually | Semantic HTML | same Stage 6 learner test |
| `society.counterclaim-input`; `society.conclusion-input` | Two labelled textareas | Capture counterclaim/response and proportional conclusion | Visible field labels | Native textareas | Text | Route-local | Missing field is named on save/export | Semantic HTML | same Stage 6 learner test |
| `society.bibliography-input`; `society.export-argument-button` | Repeatable source inputs plus Export button | Requires a bibliography and downloads the complete local JSON argument | "Source n" / "Export argument" | Native controls | Text | Route-local | Export reports every missing prerequisite and never downloads partial work | Local JSON | same Stage 6 learner test |

---

## 11. Mastery challenge (`mastery`) — Stage S6

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `mastery.question-nav-buttons` | Previous/Next buttons | Moves through the fixed 24-question session | "Previous question" / "Next question" | Native buttons | Live "Question n of 24" readout | N/A | Next stays disabled until an attempt is submitted | N/A | `stage-six.spec.ts › mastery never accepts an empty response and records a submitted attempt` |
| `mastery.question-submit-button` | Push button | Validates and records the current answer | "Submit answer" | Native button | N/A | N/A | Empty or invalid responses remain unattempted | N/A | `stage-six.spec.ts › mastery never accepts an empty response and records a submitted attempt` |
| `mastery.answer-input` | MCQ radio group, numeric text input, numeric + unit select, or constructed-response textarea | Captures the response for the deterministic validator | Visible question-type labels | Native radio, text, select and textarea behavior | Type-appropriate value/unit | Clears with Retry or question change | Empty, malformed, wrong-unit, short and concept-missing responses are rejected by unit tests | Semantic HTML | `stage-six.spec.ts` plus `tests/unit/mastery.test.ts` and validation tests |
| `mastery.hint-reveal-buttons` | Three progressive hint buttons | Reveals prompt, targeted hint and worked reasoning | "Show prompt" / "Show targeted hint" / "Show worked reasoning" | Native buttons | N/A | Clears on question change/Retry | Worked reasoning is disabled until an attempt exists | N/A | `stage-six.spec.ts › mastery never accepts an empty response and records a submitted attempt` |
| `mastery.retry-button` | Push button | Clears only the current response, result and open hints | "Retry this question" | Native button | N/A | Performs the reset | N/A | N/A | Route behavior and runtime inventory parity |
| `mastery.progress-report-view` | Static table | Shows evidence-derived level for all 24 active outcomes | "Mastery progress table" | Scrollable table region | Outcome code + text level | Cleared only by progress reset | N/A | Plain HTML table | Progress-store unit tests and runtime inventory parity |

---

## 12. Teacher tools (`teacher`) — Stage S6 (full panel); basic shared controls S1

Cross-cutting per the shared spec's "Shared teacher experience". References `global.pause-button`,
`global.step-button`, `global.slow-motion-toggle`, `global.reset-button`, `global.preset-select`,
`global.presentation-mode-toggle` rather than redefining them.

| ID | Control | Effect | Accessible name | Keyboard behaviour | Units / current-value display | Reset behaviour | Error handling | Fallback | Browser test |
|---|---|---|---|---|---|---|---|---|---|
| `teacher.show-hide-labels-toggle`; `teacher.show-hide-values-toggle`; `teacher.show-hide-equations-toggle`; `teacher.show-hide-particles-toggle`; `teacher.show-hide-vectors-toggle`; `teacher.show-hide-trails-toggle`; `teacher.show-hide-answers-toggle` | Seven persisted checkboxes | Independently hide only elements tagged for the named representation | Visible layer label | Native checkbox behavior | Checked/unchecked | Defaults on | N/A | Canvas text/table alternatives remain visible | `stage-six.spec.ts › teacher layers, presets, coverage and print templates have observable effects` |
| `teacher.deep-link-generator` | Fixed preset select + read-only URL | Generates one of five reviewed, student-data-free lesson links | "Lesson preset" / "Generated deep link" | Native select and read-only input | Complete URL | First preset on a new session | No free-text encoder exists | N/A | same Stage 6 teacher test |
| `teacher.outcome-coverage-view` | Filter select + static report | Shows release scope, verification status, activity and every implementation route | "Filter coverage" / "Outcome coverage table" | Native select; scrollable table | Text status per outcome | All outcomes | N/A | Plain HTML table | same Stage 6 teacher test plus `stageSixContent.test.ts` |
| `teacher.misconception-prompts-panel` | Static section with per-question disclosures | Shows curated misconception prompts and suggested questions | Section heading and native summaries | Native details/summary behavior | N/A | Details closed | N/A | Plain HTML | Runtime inventory parity |
| `teacher.printable-sheet-generator` | Template select + Print button | Selects one of three plain HTML sheets; Print opens the browser dialog | "Sheet template" / "Print selected sheet" | Native select and button | Selected template | Investigation sheet | Browser owns print errors | Plain HTML/CSS | same Stage 6 teacher test |
| `teacher.progress-export-button` | Push button | Downloads an anonymous JSON summary | "Export anonymous summary" | Native button | N/A | N/A | N/A | Local-only download | Progress-store unit tests and runtime inventory parity |
| `teacher.progress-import-button` | File input | Imports a schema-validated local backup capped at 1 MB | "Import local progress backup" | Native file input | N/A | Clears after import | Specific oversize/parse/schema feedback | Session remains usable | `settings.spec.ts` and Stage 6 teacher test |
| `teacher.reset-module-button`; `teacher.reset-all-button` | Destructive buttons using native confirmation | Reset one strand or all local evidence | Visible button names | Native button/dialog behavior | N/A | Performs the selected reset | Cancel leaves data unchanged | N/A | Stage 6 teacher test; reset-all also in `settings.spec.ts` |

---

## Stage 6 as-built reconciliation (2026-07-20)

The Stage 6 routes use semantic HTML/CSS and native controls. Their main learning,
validation, evidence and export flows are exercised in `tests/e2e/stage-six.spec.ts`
in Chromium and WebKit; runtime IDs/names are swept by `control-inventory.spec.ts`,
while shared axe, console and five-width responsive matrices import
`COMPLETION_ROUTES`. Static tables/readouts are not activation targets but remain
keyboard-scrollable where they can overflow locally.

| Route | As-built IDs / controls | Default, validation and observable effect |
|---|---|---|
| `/spectrum` | `em-spectrum.zoom-pan-slider`; `region-select`; `wavelength-frequency-input-toggle`; `log-axis-toggle`; `atmospheric-overlay-toggle`; `source-detector-toggle`; `interaction-toggle`; `application-risk-toggle`; `evidence-card-toggle`; `scale-comparison-strip`; `dataset-property-select`; `dataset-citation-input` | X-ray/visible deep-link preset supported; exact f↔λ state; linear-axis warning; four disclosures and overlay are independent; empty citation never saves |
| `/hearing` | `hearing.anatomy-part-outer-ear`; `hearing.anatomy-part-canal`; `hearing.anatomy-part-eardrum`; `hearing.anatomy-part-ossicles`; `hearing.anatomy-part-oval-window`; `hearing.anatomy-part-cochlear-fluid`; `hearing.anatomy-part-hair-cells`; `hearing.anatomy-part-auditory-nerve`; `hearing.frequency-location-slider`; `hearing.representation-ladder-toggle`; `hearing.protection-info-toggle` | Eight named stages are separate buttons; 20–20,000 Hz simplified place map; explanation under 30 characters is rejected |
| `/ultrasound` | `ultrasound.probe-angle-slider`; `probe-frequency-slider`; `tissue-phantom-select`; `pulse-trigger-button`; `bmode-image-toggle` | Angle −45…+45°, frequency 2…12 MHz, three synthetic phantoms; evidence requires a sent pulse and ≥30-character interpretation; table remains when B-mode is hidden |
| `/astronomy` | planned five IDs in §7.2 | Band/star/velocity/window/line controls operate over curated data only; unmatched wavelengths say no line; velocity sign is paired with approaching/receding text |
| `/society` | planned nine IDs in §10 plus `society.export-argument-button` | Repeatable criteria/evidence/bibliography controls; every named argument component is required before save/export; export is local JSON |
| `/mastery` | six as-built IDs in §11 | 24-item session drawn from a 101-question bank, exactly one per active outcome; empty responses never score; next is gated by an attempt; retry clears only the current question |
| `/teacher` | `teacher.show-hide-labels-toggle`; `teacher.show-hide-values-toggle`; `teacher.show-hide-equations-toggle`; `teacher.show-hide-particles-toggle`; `teacher.show-hide-vectors-toggle`; `teacher.show-hide-trails-toggle`; `teacher.show-hide-answers-toggle`; `teacher.deep-link-generator`; `teacher.outcome-coverage-view`; `teacher.misconception-prompts-panel`; `teacher.printable-sheet-generator`; `teacher.progress-export-button`; `teacher.progress-import-button`; `teacher.reset-module-button`; `teacher.reset-all-button` | Seven persisted display layers affect tagged overlays; only whitelisted, student-data-free presets are generated; coverage is release-registry-backed; three print sheets; import capped at 1 MB; native confirmations cancel without mutation |

Planned teacher annotation/model-limitation toggles were reconciled to the shipped
equations/trails layers because those correspond to actual tagged representations.
The teacher deep-link control is a fixed preset selector plus read-only URL; it
deliberately has no free-text assignment encoder. Native `window.confirm` is retained
for destructive resets, so the browser—not application code—owns focus trapping and
Escape cancellation.

Outcome 7.2.5's six planned `cultural-sound.*` controls are deferred and resolve to
zero rendered elements. No substitute controls or placeholder route ship.

## Release-audit control reconciliation (2026-07-20)

The all-route runtime parity test now rejects every button, input, select,
textarea or summary that has neither its own stable ID nor an inventoried
ancestor group. These IDs close the controls that were previously named but
not structurally mapped:

| ID | Shipped control/effect | Executable evidence |
|---|---|---|
| `global.settings-panel` | Opens/closes the persisted display-and-sound settings; owns the Close action while the three preference toggles retain their individual IDs | `settings.spec.ts`; `keyboard.spec.ts`; runtime parity |
| `wave-lab.lambda-v-f-submit-button` | Calculates/checks `v = fλ`; invalid, empty and wrong-unit paths never pass | `waves.spec.ts`; equation/validation unit suites |
| `wave-lab.investigation-prompts` | Groups the measured-pattern and limitation textareas with their independent save actions | `waves.spec.ts` evidence/validation path |
| `sound-lab.pulse-timing-button` | Plays a gated pulse or shows equivalent visual timing/cycle evidence | `sound.spec.ts` visual/audio paths |
| `sound-lab.interpretation-input`; `sound-lab.interpretation-save-button` | Captures and validates the fair-test interpretation before saving evidence | `sound.spec.ts` investigation path |
| `em-spectrum.region-buttons`; `em-spectrum.numeric-entry`; `em-spectrum.dataset-save-button` | Seven named spectrum jumps, positive SI numeric entry and cited-comparison validation/save | `stage-six.spec.ts` spectrum path |
| `hearing.explanation-editor`; `ultrasound.interpretation-editor`; `astronomy.inference-editor` | Labelled writing + validation/save groups for the three completion activities | `stage-six.spec.ts` learner controls/evidence path |
| `society.argument-actions` | Groups Save, Export and Print actions; all share the complete argument validator | `stage-six.spec.ts`; `release-controls.spec.ts` |
| `progress.export-anonymous-json-button`; `progress.export-anonymous-csv-button`; `progress.print-summary-button` | Anonymous JSON/CSV download and print actions | `settings.spec.ts`; `release-controls.spec.ts` |
| `progress.export-backup-button`; `progress.import-backup-input`; `progress.reset-all-button` | Schema-v2 backup export/import and native-confirmed persistent reset | `settings.spec.ts` |
| `teacher.progress-export-backup-button`; `teacher.reset-controls` | Local backup download and grouped strand-select/reset actions | `stage-six.spec.ts`; `release-controls.spec.ts` |

`teacher.deep-link-generator` and `teacher.printable-sheet-generator` are now
semantic ancestor groups, so their paired selector/read-only-link and
selector/Print controls cannot drift outside the inventory. The Teacher page's
presentation checkbox reuses `global.presentation-mode-toggle`.

## Summary counts

The earlier planning-row total was retired because reconciled rows can own multiple
controls and therefore drift from the executable inventory. The source of truth is
the set of stable, namespaced IDs in this document, read directly by
`control-inventory.spec.ts`: **358 unique product control/family IDs**, comprising
**352 active release IDs** and **6 deferred `cultural-sound.*` IDs**. Runtime parity
also proves the six deferred IDs render zero elements.
