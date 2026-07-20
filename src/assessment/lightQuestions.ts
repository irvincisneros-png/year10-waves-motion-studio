/** Validated Stage 4 question bank for outcomes 7.3.1–7.3.3. */

import type { Question } from './types';

export const lightQuestions: Question[] = [
  {
    id: 'lq-731-eye-pathway', kind: 'mcq', outcomeCode: '7.3.1', concept: 'Optical image formation and neural perception are linked but distinct', misconception: 'The brain simply flips the retinal image', difficulty: 'developing', representation: 'diagram',
    prompt: 'Which statement best describes how the eye and brain produce vision?',
    options: [
      { id: 'a', text: 'The cornea and lens focus an optical image on the retina; receptors create signals that travel through the optic nerve, and neural processing interprets them.', correct: true, feedback: 'Correct. Optical image formation and neural interpretation are separate, linked stages.' },
      { id: 'b', text: 'The retina takes a photograph and the brain simply flips it upright.', correct: false, feedback: 'That is incomplete. The retina converts light to neural signals, and perception involves interpretation — not a single “flip” step.' },
      { id: 'c', text: 'The pupil focuses the image and sends it directly to the brain.', correct: false, feedback: 'The pupil controls how much light enters. The cornea and lens focus light; the retina and optic nerve begin the neural pathway.' },
    ],
    hints: [
      { level: 1, text: 'Separate what happens to light from what happens to neural signals.' },
      { level: 2, text: 'The lens focuses light; the retina converts it to signals.' },
      { level: 3, text: 'Optics: cornea/lens → retinal image. Neural stage: retina → optic nerve → brain interpretation.' },
    ],
    explanation: 'The optical system forms a retinal image; photoreceptors convert light into signals and neural processing interprets them. “The brain flips it” is not a complete explanation.',
  },
  {
    id: 'lq-731-brightness', kind: 'mcq', outcomeCode: '7.3.1', concept: 'Pupil response to brightness', difficulty: 'foundational', representation: 'diagram',
    prompt: 'In this teaching model, what happens to the pupil opening when ambient brightness increases?',
    options: [
      { id: 'a', text: 'It narrows, reducing the amount of light entering.', correct: true, feedback: 'Correct. The iris narrows the pupil opening in brighter conditions.' },
      { id: 'b', text: 'It widens to collect more light.', correct: false, feedback: 'Widening is the model response to darker conditions. In brighter conditions the pupil narrows.' },
      { id: 'c', text: 'It focuses the image by changing lens shape.', correct: false, feedback: 'Lens accommodation changes focus. Pupil size controls the opening through which light enters.' },
    ],
    hints: [{ level: 1, text: 'Think about limiting a strong light input.' }, { level: 2, text: 'The iris controls the pupil opening.' }, { level: 3, text: 'Brighter → narrower pupil; darker → wider pupil.' }],
    explanation: 'The iris changes pupil opening with brightness. The app uses a relative response model, not a biometric pupil measurement.',
  },
  {
    id: 'lq-732-reflection', kind: 'numeric', outcomeCode: '7.3.2', concept: 'Law of reflection', difficulty: 'foundational', representation: 'diagram',
    prompt: 'A ray strikes a plane mirror at 37° from the normal. What is the reflected angle from the normal?', exactValue: 37, unit: '°',
    hints: [{ level: 1, text: 'Both angles are measured from the normal.' }, { level: 2, text: 'The law of reflection says θᵣ = θᵢ.' }, { level: 3, text: 'θᵣ = 37° because it equals the 37° incident angle.' }],
    explanation: 'For a plane mirror, angle of reflection equals angle of incidence, both measured from the normal.',
  },
  {
    id: 'lq-732-refraction-cause', kind: 'mcq', outcomeCode: '7.3.2', concept: 'Refraction as a speed change at a boundary', misconception: 'Light bends because it takes the shortest path', difficulty: 'developing', representation: 'diagram',
    prompt: 'Why does a light ray bend towards the normal as it enters water from air?',
    options: [
      { id: 'a', text: 'Its speed and wavelength decrease in the higher-index medium while its frequency stays fixed.', correct: true, feedback: 'Correct. The speed change makes the wavefront turn; wavelength changes with speed while frequency stays fixed.' },
      { id: 'b', text: 'Light chooses the shortest route through the water.', correct: false, feedback: 'This is the misconception. In this model, refraction is explained by a speed change and turning wavefronts, not a ray making a choice.' },
      { id: 'c', text: 'Its frequency decreases, pulling the ray towards the normal.', correct: false, feedback: 'Frequency stays constant across a stationary boundary. Speed and wavelength change together.' },
    ],
    hints: [{ level: 1, text: 'Which wave property is set by the source?' }, { level: 2, text: 'Frequency stays fixed at a stationary boundary.' }, { level: 3, text: 'Higher n → lower speed and wavelength; the wavefront turns towards the normal; frequency is unchanged.' }],
    explanation: 'Refraction follows from a speed change at the boundary. At fixed frequency, wavelength changes with speed.',
  },
  {
    id: 'lq-732-tir', kind: 'mcq', outcomeCode: '7.3.2', concept: 'Total internal reflection', difficulty: 'challenging', representation: 'diagram',
    prompt: 'When can total internal reflection occur?',
    options: [
      { id: 'a', text: 'When light travels from a higher-index to a lower-index medium and the incident angle exceeds the critical angle.', correct: true, feedback: 'Correct. Both the direction of travel and the critical-angle condition are required.' },
      { id: 'b', text: 'Whenever light enters a higher-index medium at any angle.', correct: false, feedback: 'TIR requires travel towards a lower-index medium, not into a higher-index one.' },
      { id: 'c', text: 'Only when the source frequency changes at the boundary.', correct: false, feedback: 'Frequency does not change at a stationary boundary. TIR depends on indices and incident angle.' },
    ],
    hints: [{ level: 1, text: 'Compare n₁ and n₂.' }, { level: 2, text: 'The ray must be leaving the higher-index medium.' }, { level: 3, text: 'TIR: n₁ > n₂ and θᵢ > θc, so no refracted ray exists.' }],
    explanation: 'Beyond the critical angle from a higher-index to a lower-index medium, Snell’s law has no transmitted-ray solution, so the model returns TIR.',
  },
  {
    id: 'lq-732-energy', kind: 'numeric', outcomeCode: '7.3.2', concept: 'Optical energy conservation', difficulty: 'developing', representation: 'numeric',
    prompt: 'A model surface transmits 10% and reflects 8% of incoming light. What percentage is absorbed?', exactValue: 82, unit: '%',
    hints: [{ level: 1, text: 'The three fractions total 100%.' }, { level: 2, text: 'Absorbed = 100 − transmitted − reflected.' }, { level: 3, text: '100 − 10 − 8 = 82%.' }],
    explanation: 'The model ledger conserves energy: transmitted + reflected + absorbed = 100%.',
  },
  {
    id: 'lq-733-black-surface', kind: 'mcq', outcomeCode: '7.3.3', concept: 'Surface absorption depends on conditions', misconception: 'Black objects always heat fastest', difficulty: 'challenging', representation: 'text',
    prompt: 'Which conclusion is scientifically responsible after comparing black and white surface models?',
    options: [
      { id: 'a', text: 'Under the stated illuminant and model assumptions the black surface absorbs more, but real heating also depends on surroundings, geometry and material properties.', correct: true, feedback: 'Correct. The evidence supports a conditional comparison, not an “always” claim.' },
      { id: 'b', text: 'Black objects always heat fastest in every situation.', correct: false, feedback: 'This overclaims. Absorption depends on the illuminant and surface, while temperature change also depends on the whole thermal situation.' },
      { id: 'c', text: 'Colour alone proves the exact heating rate.', correct: false, feedback: 'The app does not calculate heating rate. It only compares a modelled optical energy ledger under stated assumptions.' },
    ],
    hints: [{ level: 1, text: 'Look for words such as “always” and “every”.' }, { level: 2, text: 'The ledger models optical energy, not a full thermal experiment.' }, { level: 3, text: 'State the illuminant/surface assumptions and avoid claiming a universal heating rate.' }],
    explanation: 'An absorption comparison must state its illuminant, surface and model limits. Heating additionally depends on thermal and environmental factors.',
  },
  {
    id: 'lq-733-fibre', kind: 'mcq', outcomeCode: '7.3.3', concept: 'Optical fibre application of TIR', difficulty: 'developing', representation: 'diagram',
    prompt: 'How does an optical fibre guide light around a gentle bend?',
    options: [
      { id: 'a', text: 'Its higher-index core and lower-index cladding allow repeated total internal reflection above the critical angle.', correct: true, feedback: 'Correct. The index boundary and incident angles keep the light guided in the core.' },
      { id: 'b', text: 'The fibre continually increases the light frequency.', correct: false, feedback: 'Frequency stays fixed at stationary boundaries. Guidance comes from TIR.' },
      { id: 'c', text: 'The cladding absorbs all rays and creates new ones further along.', correct: false, feedback: 'The teaching model guides existing light by repeated TIR; it does not destroy and recreate rays.' },
    ],
    hints: [{ level: 1, text: 'Which refraction extension is used in fibres?' }, { level: 2, text: 'The core has higher n than the cladding.' }, { level: 3, text: 'Higher-index core → lower-index cladding at θ > θc → repeated TIR.' }],
    explanation: 'Optical fibres use a higher-index core, lower-index cladding and suitable incidence angles to produce repeated total internal reflection.',
  },
];
