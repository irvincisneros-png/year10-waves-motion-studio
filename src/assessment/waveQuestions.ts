/**
 * Wave-laboratory Check question bank — 10 validated questions covering the
 * SCIENCE_REVIEW §21 misconceptions for outcomes 7.1.1–7.1.6. Mix of numeric,
 * unit-selection, multiple-choice (with explained distractors) and one
 * graph-interpretation item. Australian English. Pure TS.
 */

import type { Question } from './types';

export const waveQuestions: Question[] = [
  // --- 7.1.1 mechanical needs a medium; EM does not ---------------------------
  {
    id: 'wq-711-vacuum',
    kind: 'mcq',
    outcomeCode: '7.1.1',
    concept: 'Mechanical waves need a medium; EM waves do not',
    misconception: 'Space is empty, so no waves can travel through it',
    difficulty: 'foundational',
    representation: 'text',
    prompt:
      'An astronaut outside the ISS can see the Sun but cannot hear a colleague tapping on the hull from outside. Why?',
    options: [
      {
        id: 'a',
        text: 'Light is an electromagnetic wave and needs no medium, but sound is a mechanical wave and cannot travel through the vacuum of space.',
        correct: true,
        feedback:
          'Correct. Light (EM) crosses the vacuum; sound (mechanical) has no particles to compress, so it cannot propagate.',
      },
      {
        id: 'b',
        text: 'Space is completely empty, so no waves of any kind can travel through it.',
        correct: false,
        feedback:
          'Not right — light clearly reaches us across space. EM waves do not need a medium; only mechanical waves (like sound) do.',
      },
      {
        id: 'c',
        text: 'The tapping is too quiet to hear over that distance.',
        correct: false,
        feedback:
          'Loudness is not the issue: with no medium there is nothing to carry the sound at all, at any volume.',
      },
    ],
    hints: [
      { level: 1, text: 'Think about which of light and sound is mechanical and which is electromagnetic.' },
      { level: 2, text: 'A mechanical wave needs particles to pass the disturbance along. A vacuum has none.' },
      { level: 3, text: 'Light is EM and needs no medium, so it crosses space. Sound is mechanical, so with no air (no medium) it cannot travel at all.' },
    ],
    explanation:
      'Mechanical waves (sound) require a medium; electromagnetic waves (light) do not. In a vacuum, sound cannot propagate but light can.',
  },

  // --- 7.1.2 energy transfers without net particle transfer -------------------
  {
    id: 'wq-712-particles',
    kind: 'mcq',
    outcomeCode: '7.1.2',
    concept: 'Energy is transferred without net transfer of particles',
    misconception: 'Particles travel along with the wave',
    difficulty: 'foundational',
    representation: 'diagram',
    prompt:
      'A cork floats on water as waves pass beneath it. What does the cork do as the waves move towards the shore?',
    options: [
      {
        id: 'a',
        text: 'It bobs up and down about the same spot; it is not carried along to the shore.',
        correct: true,
        feedback:
          'Correct. The water particles (and the cork) oscillate about a fixed point — only the wave pattern and its energy move forward.',
      },
      {
        id: 'b',
        text: 'It is carried steadily towards the shore with the wave.',
        correct: false,
        feedback:
          'This is the common misconception. The medium particles oscillate locally; they do not travel with the wave. Only energy is transported.',
      },
      {
        id: 'c',
        text: 'It sinks, because the wave pushes it down.',
        correct: false,
        feedback: 'The cork oscillates up and down about its rest position — it neither sinks nor is carried along.',
      },
    ],
    hints: [
      { level: 1, text: 'Watch a tagged particle in the energy view of the lab.' },
      { level: 2, text: 'Over a whole number of cycles, where does a tagged particle end up compared to where it started?' },
      { level: 3, text: 'The particle returns to its starting position after each cycle — net displacement is about zero. Energy moves forward; matter does not.' },
    ],
    explanation:
      'Waves transfer energy without transferring matter. A tagged particle oscillates about equilibrium with ≈0 net displacement over whole cycles.',
  },

  // --- 7.1.3 transverse vs longitudinal ---------------------------------------
  {
    id: 'wq-713-transverse',
    kind: 'mcq',
    outcomeCode: '7.1.3',
    concept: 'Features of transverse and longitudinal waves',
    difficulty: 'developing',
    representation: 'diagram',
    prompt: 'In a transverse wave, how does the particle displacement compare with the direction the wave travels?',
    options: [
      { id: 'a', text: 'Perpendicular (at right angles) to the direction of propagation.', correct: true, feedback: 'Correct. Transverse: displacement ⟂ propagation (e.g. crest and trough up/down while the wave moves sideways).' },
      { id: 'b', text: 'Parallel to the direction of propagation.', correct: false, feedback: 'That describes a longitudinal wave (compressions and rarefactions along the direction of travel).' },
      { id: 'c', text: 'In a circle around the direction of propagation.', correct: false, feedback: 'Near-circular motion is the special case of water-surface waves, which are not perfectly transverse.' },
    ],
    hints: [
      { level: 1, text: 'Switch the orientation toggle in the lab and watch the particle arrows.' },
      { level: 2, text: '"Trans" hints at "across". Which direction is the displacement compared with the wave motion?' },
      { level: 3, text: 'Transverse = displacement across (perpendicular to) the direction of travel; longitudinal = displacement along it.' },
    ],
    explanation:
      'Transverse waves displace particles perpendicular to propagation; longitudinal waves displace them parallel to it (compressions/rarefactions).',
  },
  {
    id: 'wq-713-representation-trap',
    kind: 'mcq',
    outcomeCode: '7.1.3',
    concept: 'A pressure/displacement graph is not the particle path',
    misconception: 'A sinusoidal pressure graph means sound particles move up and down',
    difficulty: 'challenging',
    representation: 'graph',
    prompt:
      'A sound wave is drawn as a smooth up-and-down sine curve. Does this mean the air particles physically move up and down?',
    options: [
      {
        id: 'a',
        text: 'No — the curve is a graph of pressure (or displacement) versus position or time, not the physical path of the air particles.',
        correct: true,
        feedback:
          'Correct. Sound is longitudinal: particles move back and forth along the wave, not up and down. The sine curve is a graph, not a picture of the motion.',
      },
      {
        id: 'b',
        text: 'Yes — the particles trace out the shape of the curve as they move.',
        correct: false,
        feedback:
          'This is the representation trap. The curve plots pressure/displacement against position or time; the air particles actually oscillate back and forth (longitudinally), not up and down.',
      },
    ],
    hints: [
      { level: 1, text: 'Recall whether sound is transverse or longitudinal.' },
      { level: 2, text: 'Look at the graph axes: what quantity is on the vertical axis?' },
      { level: 3, text: 'The vertical axis is pressure or displacement, not height. The particles move along the propagation direction; the curve is only a graph.' },
    ],
    explanation:
      'The drawn curve is a graph of pressure/displacement versus position or time — not the physical path of the particles (SCIENCE_REVIEW §4.2).',
  },

  // --- 7.1.5 amplitude vs frequency/speed -------------------------------------
  {
    id: 'wq-715-amplitude',
    kind: 'mcq',
    outcomeCode: '7.1.5',
    concept: 'Amplitude is independent of frequency and speed',
    misconception: 'Bigger amplitude means higher frequency/pitch or a faster wave',
    difficulty: 'developing',
    representation: 'text',
    prompt:
      'In the linear model, you increase only the amplitude of a wave on a rope (nothing else). What happens to its frequency and speed?',
    options: [
      { id: 'a', text: 'Both stay the same — amplitude is independent of frequency and speed.', correct: true, feedback: 'Correct. Amplitude changes the energy carried, not the frequency, speed or wavelength.' },
      { id: 'b', text: 'Both increase — a bigger wave is faster and higher-pitched.', correct: false, feedback: 'This is a common misconception. Amplitude does not appear in v = fλ; it changes neither f nor v in the linear model.' },
      { id: 'c', text: 'Frequency increases but speed stays the same.', correct: false, feedback: 'Frequency is set by the source, not the amplitude. Changing amplitude alone leaves f unchanged.' },
    ],
    hints: [
      { level: 1, text: 'Try the amplitude slider in the lab and watch the frequency and speed readouts.' },
      { level: 2, text: 'Does amplitude (A) appear anywhere in v = fλ?' },
      { level: 3, text: 'A is not in v = fλ. It sets how much energy the wave carries, but not its frequency, speed or wavelength.' },
    ],
    explanation: 'Amplitude is independent: it changes the energy carried only, leaving f, v and λ unchanged (SCIENCE_REVIEW §7).',
  },

  // --- 7.1.6 v = fλ calculations + rearrangements + units ---------------------
  {
    id: 'wq-716-lambda',
    kind: 'numeric',
    outcomeCode: '7.1.6',
    concept: 'λ = v/f',
    difficulty: 'developing',
    representation: 'numeric',
    prompt:
      'A sound wave travels at 343 m/s with a frequency of 440 Hz. Calculate its wavelength, in metres (3 significant figures).',
    exactValue: 343 / 440,
    unit: 'm',
    hints: [
      { level: 1, text: 'Which rearrangement of v = fλ gives wavelength?' },
      { level: 2, text: 'λ = v / f. Substitute v = 343 m/s and f = 440 Hz.' },
      { level: 3, text: 'λ = 343 ÷ 440 = 0.7795… ≈ 0.780 m.' },
    ],
    explanation: 'λ = v/f = 343 ÷ 440 ≈ 0.780 m. Rearranging v = fλ isolates the wanted variable.',
  },
  {
    id: 'wq-716-speed',
    kind: 'numeric',
    outcomeCode: '7.1.6',
    concept: 'v = fλ',
    difficulty: 'developing',
    representation: 'numeric',
    prompt:
      'A wave has a frequency of 2.0 Hz and a wavelength of 1.5 m. Calculate its speed, in m/s.',
    exactValue: 3,
    unit: 'm/s',
    hints: [
      { level: 1, text: 'You are given f and λ and want v.' },
      { level: 2, text: 'v = f × λ.' },
      { level: 3, text: 'v = 2.0 × 1.5 = 3.0 m/s.' },
    ],
    explanation: 'v = fλ = 2.0 × 1.5 = 3.0 m/s.',
  },
  {
    id: 'wq-716-frequency-units',
    kind: 'unit-select',
    outcomeCode: '7.1.6',
    concept: 'f = v/λ with unit choice',
    difficulty: 'challenging',
    representation: 'numeric',
    prompt:
      'An FM radio wave (EM, speed 3.00 × 10⁸ m/s) has a wavelength of 3.0 m. Work out its frequency and choose the most suitable unit.',
    exactValue: 100,
    correctUnit: 'MHz',
    unitOptions: ['Hz', 'kHz', 'MHz', 'GHz'],
    hints: [
      { level: 1, text: 'Use f = v / λ, then convert to a sensible unit.' },
      { level: 2, text: 'f = (3.00 × 10⁸) ÷ 3.0 = 1.00 × 10⁸ Hz.' },
      { level: 3, text: '1.00 × 10⁸ Hz = 100 MHz — the natural unit for FM radio.' },
    ],
    explanation: 'f = v/λ = (3.00 × 10⁸)/3.0 = 1.00 × 10⁸ Hz = 100 MHz.',
  },
  {
    id: 'wq-716-triangle',
    kind: 'mcq',
    outcomeCode: '7.1.6',
    concept: 'Meaning of v = fλ, not just a triangle trick',
    misconception: 'Using a triangle mnemonic without understanding what it means',
    difficulty: 'developing',
    representation: 'equation',
    prompt: 'Which statement best explains, in words, what v = fλ actually means?',
    options: [
      { id: 'a', text: 'Speed equals how many waves pass each second (f) multiplied by how long each wave is (λ).', correct: true, feedback: 'Correct — that is the physical meaning, which the triangle trick alone does not give you.' },
      { id: 'b', text: 'It is just a triangle: cover the letter you want and read off the rest.', correct: false, feedback: 'The triangle can help rearrange, but it is not an explanation. Speed = waves per second × length of each wave.' },
      { id: 'c', text: 'Bigger waves always travel faster.', correct: false, feedback: 'Amplitude ("bigger") is not in v = fλ. Speed depends on frequency and wavelength (and, physically, the medium).' },
    ],
    hints: [
      { level: 1, text: 'What does each symbol physically represent?' },
      { level: 2, text: 'f = waves per second; λ = length of one wave.' },
      { level: 3, text: 'Multiplying "waves per second" by "length per wave" gives "length per second" — the speed.' },
    ],
    explanation: 'v = fλ means speed = (waves per second) × (length of each wave). The triangle is only a rearranging aid.',
  },

  // --- graph interpretation: displacement–position vs displacement–time -------
  {
    id: 'wq-graph-axes',
    kind: 'mcq',
    outcomeCode: '7.1.5',
    concept: 'Displacement–position vs displacement–time graphs',
    misconception: 'Reading a period off a displacement–position (snapshot) graph',
    difficulty: 'challenging',
    representation: 'graph',
    prompt:
      'A graph shows displacement on the vertical axis and POSITION on the horizontal axis. What does the horizontal distance between two neighbouring crests tell you?',
    options: [
      { id: 'a', text: 'The wavelength (λ).', correct: true, feedback: 'Correct. A displacement–position "snapshot" shows λ as the repeat distance. To read the period you need a displacement–time graph.' },
      { id: 'b', text: 'The period (T).', correct: false, feedback: 'The period is read from a displacement–TIME graph. This graph has position on the horizontal axis, so the repeat distance is the wavelength.' },
      { id: 'c', text: 'The amplitude (A).', correct: false, feedback: 'Amplitude is the vertical distance from equilibrium to a crest, not the horizontal spacing between crests.' },
    ],
    hints: [
      { level: 1, text: 'Check what quantity is on the horizontal axis.' },
      { level: 2, text: 'Position on the horizontal axis → the repeat distance is a length.' },
      { level: 3, text: 'Repeat distance on a displacement–position graph is the wavelength λ; on a displacement–time graph it would be the period T.' },
    ],
    explanation:
      'On a displacement–position graph the crest-to-crest distance is the wavelength; the period is read only from a displacement–time graph (SCIENCE_REVIEW §8).',
  },
];
