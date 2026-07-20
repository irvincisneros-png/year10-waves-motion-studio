import type { McqQuestion } from './types';

function question(
  id: string,
  outcomeCode: string,
  concept: string,
  prompt: string,
  correct: string,
  distractors: string[],
  explanation: string,
  misconception: string,
): McqQuestion {
  return {
    id, outcomeCode, concept, prompt, explanation, misconception,
    difficulty: 'developing', representation: 'text', kind: 'mcq',
    hints: [
      { level: 1, text: 'Name the physical evidence before choosing.' },
      { level: 2, text: explanation.split('.')[0] + '.' },
      { level: 3, text: explanation },
    ],
    options: [correct, ...distractors].map((text, index) => ({
      id: `${id}-${index}`,
      text,
      correct: index === 0,
      feedback: index === 0 ? explanation : `Not quite. ${explanation}`,
    })),
  };
}

export const stageSixQuestions: readonly McqQuestion[] = [
  question('s6-em-1', '7.1.4', 'continuous EM spectrum', 'What changes from radio to gamma while all waves remain electromagnetic?', 'Frequency and wavelength change inversely.', ['All seven regions travel at different vacuum speeds.', 'Only visible light transfers energy.', 'The waves change from particles into energy.'], 'All EM waves share the same vacuum speed; wavelength and frequency vary inversely.', 'seven boxes are different kinds of wave'),
  question('s6-em-2', '7.1.7', 'applications and risk', 'Which is the strongest justification for choosing an EM region for an application?', 'Match interaction, transmission, resolution and risk evidence to the task.', ['Choose the highest frequency because it is always best.', 'Choose the brightest display colour.', 'Call all radiation radioactive.'], 'Suitability depends on properties, interactions, exposure and controls—not one ranking.', 'higher frequency is always more useful or dangerous'),
  question('s6-ear-1', '7.2.4', 'ear pathway', 'Which sequence correctly links sound to a nerve signal?', 'Eardrum → ossicles → cochlear fluid → hair cells → auditory nerve.', ['Eardrum → brain directly.', 'Ear canal → retina → optic nerve.', 'Hair cells → eardrum → ossicles.'], 'The response changes from mechanical vibration to fluid motion to electrical signalling.', 'the eardrum directly sends a signal to the brain'),
  question('s6-ear-2', '7.2.4', 'cochlear place map', 'In the simplified model, where does a high-frequency tone respond most strongly?', 'Near the base of the cochlea.', ['Near the apex only.', 'At the eardrum because frequency stops there.', 'At one identical place for every frequency.'], 'The simplified place map assigns higher frequencies towards the cochlear base.', 'all frequencies activate the same cochlear place'),
  question('s6-us-1', '7.2.6', 'pulse echo', 'Why is echo travel time divided by two when estimating depth?', 'The pulse travels to the boundary and back.', ['The sound speed is measured twice.', 'The probe emits two unrelated pulses.', 'The image halves every distance.'], 'The measured time is a round trip; depth is one-way distance.', 'ultrasound is a photograph'),
  question('s6-us-2', '7.2.6', 'frequency trade-off', 'What qualitative change is expected at higher diagnostic-ultrasound frequency?', 'Higher resolution but lower penetration.', ['Lower resolution and greater penetration.', 'No change to either property.', 'A change from sound into ionising radiation.'], 'Higher frequency can resolve smaller detail but is attenuated more strongly.', 'higher frequency improves everything without trade-off'),
  question('s6-astro-1', '7.3.4', 'spectral composition', 'What evidence supports identifying an element in starlight?', 'A match to catalogued spectral-line wavelengths.', ['The decorative star colour alone.', 'Any cursor position on the plot.', 'The telescope’s physical colour.'], 'Line identification is limited to reviewed catalogue positions.', 'any nearby line can be invented'),
  question('s6-astro-2', '7.3.4', 'redshift', 'A catalogued line appears at a longer wavelength. What does this simple model infer?', 'The source is receding (redshift).', ['The source is approaching (blueshift).', 'The source has stopped emitting that element.', 'The speed of light has increased.'], 'Positive radial velocity shifts a line to longer wavelength in the small-speed model.', 'redshift changes the speed of light'),
  question('s6-soc-1', '7.5.1', 'argument criteria', 'What makes a claim about technology changing society analysable?', 'Explicit criteria, sourced evidence and affected groups.', ['A statement that technology is entirely good.', 'A list of personal preferences only.', 'A conclusion written before evidence.'], 'A defensible argument defines change and weighs evidence, groups and limitations.', 'technology is purely good or bad'),
  question('s6-soc-2', '7.5.1', 'counterclaim', 'Why include a counterclaim and response?', 'To test the contention against competing evidence or values.', ['To hide evidence that disagrees.', 'To make every conclusion neutral.', 'To avoid citing sources.'], 'A counterclaim strengthens analysis by engaging with a plausible competing view.', 'counterclaims weaken every argument'),
  question('s6-us-3', '7.2.6', 'ultrasound safety', 'Which statement is scientifically responsible?', 'Ultrasound uses non-ionising sound but still requires trained, prudent medical use.', ['Ultrasound has no possible biological effects.', 'The classroom phantom can diagnose a patient.', 'Ultrasound is identical to X-ray imaging.'], 'Non-ionising does not mean unrestricted or diagnostic use by untrained people.', 'non-ionising means harmless'),
  question('s6-astro-3', '7.3.4', 'atmospheric windows', 'Why are many X-ray observatories placed in space?', 'Earth’s atmosphere absorbs most astronomical X-rays.', ['X-rays cannot travel through vacuum.', 'Ground telescopes change X-rays into sound.', 'Stars emit X-rays only above satellites.'], 'The atmosphere protects Earth’s surface but blocks that band from ground instruments.', 'all wavelengths reach the ground equally'),
] as const;
