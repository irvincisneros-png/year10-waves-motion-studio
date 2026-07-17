# Outcome Extraction Report — WaveMotion Studio

**Extraction date:** 2026-07-17
**Output file:** `src/content/outcomes.ts`
**Test file:** `tests/unit/outcomes.test.ts` (7 tests, all passing)

## Source document

`/Users/irvincisneros/Library/Mobile Documents/com~apple~CloudDocs/Claude/Teaching - Subjects/Year 9 Materials/NSW Junior Science Syllabus.docx`

This is a single compiled Word document covering Years 7–10 (headings "Year 7
Syllabus" through topic 8. "Data science 2"). It is not the official NESA PDF —
it appears to be a condensed working copy that mirrors the **NSW Science 7–10
Syllabus** focus-area structure, using the syllabus's own sequential
content-point numbering (e.g. `7.1.1`, `7.1.2`, …) rather than the older-style
outcome codes (e.g. `SC5-16PW`). No `SC4-`/`SC5-`-style codes appear anywhere
in the document — I searched for them and found none — so there is no
alternate/legacy identifier to cross-reference.

The relevant section is **`7. Waves and motion`** (Heading 2, paragraph index
225 of 258), with five sub-strand tables immediately following it in document
order:

| Table index (python-docx) | Sub-strand heading | Codes |
|---|---|---|
| 63 | 7.1 Common properties of waves | 7.1.1–7.1.7 |
| 64 | 7.2 Sound waves | 7.2.1–7.2.6 |
| 65 | 7.3 Light waves | 7.3.1–7.3.4 |
| 66 | 7.4 Motion | 7.4.1–7.4.7 |
| 67 | 7.5 Waves and motion - in Context | 7.5.1 |

Each table row holds one content point in a single cell, formatted as
`<code><text>` (no space after the code in most rows — normalised during
extraction).

## Extraction method

1. Installed `python-docx` into a fresh venv at `~/.venvs/docx-extract` (not
   inside iCloud, per the automations-local-disk convention).
2. Dumped every paragraph and every table's cell text to a scratch file to
   locate the "7. Waves and motion" section and its five outcome tables.
3. Parsed tables 63–67 cell-by-cell, run-by-run (not just `cell.text`), so that
   any non-text content (inline images) could be caught and handled instead of
   silently dropped or replaced with the placeholder whitespace python-docx
   leaves behind.
4. Two content points embed their formula as an **inline image** rather than
   as text or an OOXML math (`m:oMath`) object:
   - **7.1.6** (table 63, row 5): image `word/media/image2.png`, embedded
     mid-sentence between the runs `"Use the formula "` and `" to explain the
     relationship between a wave's frequency, speed and wavelength"`. I
     extracted and viewed the PNG directly — it reads **`λ = v/f`**.
   - **7.4.7** (table 66, row 6): image `word/media/image3.png`, embedded
     between `"...the algebraic formulas "` and `"to quantitatively relate
     force, distance, time..."`. Viewed directly — it reads
     **`F = ma, v_av = Δs/Δt and a = Δv/Δt,`**.
   Both images were spliced back into their sentences at the exact run
   position the image occupied, with a single space inserted on each side to
   avoid word-run-ons, then whitespace was normalised. No other content point
   in 7.1–7.5 contains an embedded image (checked all 25 cells for
   `w:drawing`).
5. No paragraph, sentence, or code was invented, paraphrased, or reworded —
   every `text` value in `outcomes.ts` is the syllabus document's own wording,
   including its curly apostrophes/quotation marks and Australian spelling
   (e.g. "colour"-style spellings weren't present in this section, but
   "analyse" is used throughout, as in the source).

## Plan-code → syllabus mapping

**Result: a clean 1:1 match. All 25 codes in the plan's outcome coverage
matrix (section 3 of `YEAR_10_WAVES_MOTION_APP_PLAN.md`) exist verbatim in the
syllabus document under the identical numbering — no renumbering, gaps, or
invented codes were needed.**

| Plan code | Found in syllabus? | Syllabus sub-strand |
|---|---|---|
| 7.1.1–7.1.7 | Yes, all 7 | 7.1 Common properties of waves |
| 7.2.1–7.2.6 | Yes, all 6 | 7.2 Sound waves |
| 7.3.1–7.3.4 | Yes, all 4 | 7.3 Light waves |
| 7.4.1–7.4.7 | Yes, all 7 | 7.4 Motion |
| 7.5.1 | Yes | 7.5 Waves and motion - in Context |

Total: 25 / 25 plan codes grounded in verbatim syllabus text. Nothing was
silently invented.

`syllabusRef` in `outcomes.ts` records, for each code, the document filename
and the sub-strand heading it was found under (e.g. `"NSW Junior Science
Syllabus.docx — 7.1 Common properties of waves (7.1.1)"`), so the mapping back
to the source is traceable even though the plan code and the syllabus's own
identifier are the same string.

## Flags and ambiguities

1. **Strand assignment for 7.4.7 is genuinely mixed** (flagged in a code
   comment in `outcomes.ts` as well). The content point's wording covers three
   formulas: `F = ma` (a force relationship), `v_av = Δs/Δt` and `a = Δv/Δt`
   (kinematics/motion relationships), and lists "force" first among the
   quantities to relate. The app plan itself splits the underlying maths
   across two different workspaces — `v_av = Δs/Δt` appears in section 10.3
   "Graph laboratory" (Describing motion workspace) while `F_net = ma` and
   `a = Δv/Δt` appear in section 11.2 "Force–mass–acceleration investigation"
   (Forces and Newton's laws workspace). I assigned `strand: 'forces'` because
   7.4.7 is grouped with 7.4.4–7.4.6 as the culminating quantitative outcome
   of the Forces workspace and `F = ma` leads its formula list, but this is a
   judgement call, not a fact pulled from the syllabus — reassign to
   `'motion'` if the app's implementation treats it primarily as a kinematics
   outcome, or consider splitting it into two evidence points if the UI needs
   the two halves tracked separately.
2. **No official NESA outcome codes present.** If any downstream tooling
   (e.g. a report to parents, a NESA-facing compliance document) needs the
   formal `SC5-##XX`-style codes, they are not present anywhere in this source
   document and would need to be sourced from the official NESA syllabus
   published on the NESA website — I did not fetch that externally since the
   task scoped extraction to this local .docx.
3. **7.1.6 and 7.4.7 formula text is a manual transcription of an embedded
   image**, not machine-extracted text. I am confident in the reading (both
   images are small, clean, single-line typeset formulas — `λ = v/f` and
   `F = ma, v_av = Δs/Δt and a = Δv/Δt,`) but this is worth a second human
   glance against the source document if perfect fidelity matters, since OCR
   of an image is a different extraction path to the rest of the verbatim
   text.
4. **No plan code was left ungrounded** — there was no case of "keep the plan
   code but the syllabus lacks it," so no `text` value in `outcomes.ts` falls
   back to plan wording. Every `text` is syllabus-sourced.

## Verification

- `npx vitest run tests/unit/outcomes.test.ts` → **7 passed / 7 total**.
- `npx tsc --noEmit -p tsconfig.app.json` → no errors attributable to
  `src/content/outcomes.ts`.
