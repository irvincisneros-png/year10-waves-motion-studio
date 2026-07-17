/**
 * WaveMotion Studio — NSW Year 10 / Stage 5 "Waves and motion" outcome content.
 *
 * Source document:
 *   /Users/irvincisneros/Library/Mobile Documents/com~apple~CloudDocs/Claude/
 *   Teaching - Subjects/Year 9 Materials/NSW Junior Science Syllabus.docx
 *   — focus area "7. Waves and motion" (sub-strands 7.1–7.5), tables 63–67
 *   of the document (extracted with python-docx).
 *
 * Extraction date: 2026-07-17
 *
 * Every `text` value below is copied VERBATIM from the syllabus document,
 * including Australian English spelling and the document's own curly
 * apostrophes/quotation marks. Two content points (7.1.6 and 7.4.7) embed
 * their formula as an inline image rather than text in the source .docx;
 * those formulas were read directly off the embedded PNGs
 * (word/media/image2.png and word/media/image3.png) and spliced back into
 * the sentence at the exact point the image sat between two text runs. See
 * docs/OUTCOME_EXTRACTION_REPORT.md for full method notes and flags.
 *
 * The plan's outcome codes (7.1.1–7.5.1) are identical to the syllabus
 * document's own content-point numbering for this focus area — there is no
 * renumbering or remapping required. `syllabusRef` records the sub-strand
 * heading each code was found under, for traceability back to the source
 * document.
 */

export interface Outcome {
  code: string;
  syllabusRef: string;
  text: string;
  strand: 'waves' | 'sound' | 'light' | 'motion' | 'forces' | 'society';
}

export const outcomeMap: Record<string, Outcome> = {
  '7.1.1': {
    code: '7.1.1',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.1 Common properties of waves (7.1.1)',
    text: 'Demonstrate that a mechanical wave requires a medium to travel through, while an electromagnetic (EM) wave does not',
    strand: 'waves',
  },
  '7.1.2': {
    code: '7.1.2',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.1 Common properties of waves (7.1.2)',
    text: 'Use the wave model to explain how energy is transferred without the net transfer of particles',
    strand: 'waves',
  },
  '7.1.3': {
    code: '7.1.3',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.1 Common properties of waves (7.1.3)',
    text: 'Use models to compare and describe the features of transverse and longitudinal waves',
    strand: 'waves',
  },
  '7.1.4': {
    code: '7.1.4',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.1 Common properties of waves (7.1.4)',
    text: 'Compare the different wave forms of the electromagnetic spectrum',
    strand: 'waves',
  },
  '7.1.5': {
    code: '7.1.5',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.1 Common properties of waves (7.1.5)',
    text: 'Investigate the features of waves, including amplitude, frequency, speed and wavelength by exploring a range of wave types',
    strand: 'waves',
  },
  '7.1.6': {
    code: '7.1.6',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.1 Common properties of waves (7.1.6)',
    text: 'Use the formula λ = v/f to explain the relationship between a wave’s frequency, speed and wavelength',
    strand: 'waves',
  },
  '7.1.7': {
    code: '7.1.7',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.1 Common properties of waves (7.1.7)',
    text: 'Analyse data from secondary sources to compare the uses of different EM waves based on their properties',
    strand: 'waves',
  },
  '7.2.1': {
    code: '7.2.1',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.2 Sound waves (7.2.1)',
    text: 'Model the transfer of sound energy as compressions and rarefactions in waves',
    strand: 'sound',
  },
  '7.2.2': {
    code: '7.2.2',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.2 Sound waves (7.2.2)',
    text: 'Investigate and describe how amplitude and frequency affect the pitch and volume of sound',
    strand: 'sound',
  },
  '7.2.3': {
    code: '7.2.3',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.2 Sound waves (7.2.3)',
    text: 'Investigate the Doppler effect of waves',
    strand: 'sound',
  },
  '7.2.4': {
    code: '7.2.4',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.2 Sound waves (7.2.4)',
    text: 'Describe how the ear responds to sound waves',
    strand: 'sound',
  },
  '7.2.5': {
    code: '7.2.5',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.2 Sound waves (7.2.5)',
    text: 'Investigate and outline the impact of material selection on the transfer of sound energy in Aboriginal and/or Torres Strait Islander Peoples’ traditional musical and communication instruments',
    strand: 'sound',
  },
  '7.2.6': {
    code: '7.2.6',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.2 Sound waves (7.2.6)',
    text: 'Describe how sound waves are used in medical diagnosis',
    strand: 'sound',
  },
  '7.3.1': {
    code: '7.3.1',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.3 Light waves (7.3.1)',
    text: 'Describe how the eye responds to light',
    strand: 'light',
  },
  '7.3.2': {
    code: '7.3.2',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.3 Light waves (7.3.2)',
    text: 'Investigate the properties of light, including absorption, reflection, refraction and scattering',
    strand: 'light',
  },
  '7.3.3': {
    code: '7.3.3',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.3 Light waves (7.3.3)',
    text: 'Investigate applications of absorption, reflection and refraction in everyday life',
    strand: 'light',
  },
  '7.3.4': {
    code: '7.3.4',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.3 Light waves (7.3.4)',
    text: 'Explain how the electromagnetic spectrum is used to learn about stars',
    strand: 'light',
  },
  '7.4.1': {
    code: '7.4.1',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.4 Motion (7.4.1)',
    text: 'Conduct an investigation to analyse the relationships between distance, time, speed, displacement and velocity',
    strand: 'motion',
  },
  '7.4.2': {
    code: '7.4.2',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.4 Motion (7.4.2)',
    text: 'Investigate the motion of objects and represent them using motion diagrams',
    strand: 'motion',
  },
  '7.4.3': {
    code: '7.4.3',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.4 Motion (7.4.3)',
    text: 'Conduct investigations to analyse the relationship between distance, time and speed, and draw and analyse a line graph of the results',
    strand: 'motion',
  },
  '7.4.4': {
    code: '7.4.4',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.4 Motion (7.4.4)',
    text: 'Conduct an investigation to analyse the relationships between force, mass and acceleration',
    strand: 'forces',
  },
  '7.4.5': {
    code: '7.4.5',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.4 Motion (7.4.5)',
    text: 'Investigate applications of Newton’s laws of motion',
    strand: 'forces',
  },
  '7.4.6': {
    code: '7.4.6',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.4 Motion (7.4.6)',
    text: 'Determine, using vector analysis, the net force on an object in one dimension',
    strand: 'forces',
  },
  // NOTE: 7.4.7 spans both the motion and forces strands (it names force,
  // distance, time, speed, displacement, acceleration, velocity and mass
  // together, and its three formulas are F = ma [forces], v_av = Δs/Δt
  // and a = Δv/Δt [motion/kinematics]). It is grouped here with 'forces'
  // because F = ma leads the formula list and the content point is the
  // culminating quantitative outcome of the plan's Forces and Newton's
  // laws workspace (section 11.2) alongside 7.4.4–7.4.6, even though
  // v_av = Δs/Δt is also used in the Describing motion workspace (10.3).
  // Flagged in docs/OUTCOME_EXTRACTION_REPORT.md — reassign to 'motion'
  // if the app's implementation treats it primarily as a kinematics outcome.
  '7.4.7': {
    code: '7.4.7',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.4 Motion (7.4.7)',
    text: 'Use mathematical representations, including graphs and the algebraic formulas F = ma, v_av = Δs/Δt and a = Δv/Δt, to quantitatively relate force, distance, time, speed, displacement, acceleration, velocity and mass',
    strand: 'forces',
  },
  '7.5.1': {
    code: '7.5.1',
    syllabusRef: 'NSW Junior Science Syllabus.docx — 7.5 Waves and motion - in Context (7.5.1)',
    text: 'Structure an argument to analyse how waves and motion have changed society',
    strand: 'society',
  },
};
