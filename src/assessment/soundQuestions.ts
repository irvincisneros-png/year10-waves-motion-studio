/**
 * Sound-laboratory Check question bank — validated questions covering the
 * SCIENCE_REVIEW §21 sound misconceptions for outcomes 7.2.1–7.2.3:
 *   #1  particles travel along with the wave / to the ear,
 *   #3  bigger amplitude means higher pitch,
 *   #4  "volume" and "loudness" are the same measured thing,
 *   #5  a moving source actually emits a different frequency (Doppler).
 * Mix of multiple-choice (explained distractors) and numeric items. Australian
 * English. Pure TS. Every distractor and numeric branch has a false-positive
 * regression in tests/e2e/sound.spec.ts / assessment unit tests.
 */

import type { Question } from './types';

export const soundQuestions: Question[] = [
  // --- 7.2.1 compressions / rarefactions --------------------------------------
  {
    id: 'sq-721-longitudinal',
    kind: 'mcq',
    outcomeCode: '7.2.1',
    concept: 'Sound is a longitudinal wave of compressions and rarefactions',
    difficulty: 'foundational',
    representation: 'diagram',
    prompt: 'As a sound wave travels through air, how do the air particles move?',
    options: [
      {
        id: 'a',
        text: 'They vibrate back and forth along the direction the sound travels, bunching into compressions and spreading into rarefactions.',
        correct: true,
        feedback:
          'Correct. Sound is longitudinal: particles oscillate parallel to the travel direction, making compressions (bunched) and rarefactions (spread out).',
      },
      {
        id: 'b',
        text: 'They move up and down at right angles to the direction the sound travels.',
        correct: false,
        feedback:
          'That describes a transverse wave. Sound is longitudinal — the particles move back and forth ALONG the direction of travel, not across it.',
      },
      {
        id: 'c',
        text: 'They travel all the way from the source to your ear along with the sound.',
        correct: false,
        feedback:
          'This is the common misconception. Each particle only oscillates about its home position; the energy travels to your ear, the air does not.',
      },
    ],
    hints: [
      { level: 1, text: 'Is sound a transverse or a longitudinal wave?' },
      { level: 2, text: 'In the compression view, tag a particle and watch where it ends up.' },
      { level: 3, text: 'Sound is longitudinal: particles vibrate back and forth locally, forming compressions and rarefactions. Only energy moves forward.' },
    ],
    explanation:
      'Sound is a longitudinal wave: air particles oscillate parallel to the propagation direction, forming compressions and rarefactions; energy is transferred without net transfer of particles.',
  },
  {
    id: 'sq-721-particles-to-ear',
    kind: 'mcq',
    outcomeCode: '7.2.1',
    concept: 'Energy, not matter, travels from source to ear',
    misconception: 'Sound particles fly from the source to the ear',
    difficulty: 'developing',
    representation: 'text',
    prompt:
      'You clap your hands and a friend across the room hears it. What actually travels from your hands to their ear?',
    options: [
      {
        id: 'a',
        text: 'Energy, passed on as a compression–rarefaction pattern through the air; the air particles themselves stay put.',
        correct: true,
        feedback:
          'Correct. Each air particle oscillates about its home position and returns; the wave pattern and its energy move across the room.',
      },
      {
        id: 'b',
        text: 'A puff of air particles carrying the sound from your hands to their ear.',
        correct: false,
        feedback:
          'No — the particles do not travel across the room. They oscillate locally (net displacement ≈ 0). Only the energy is transferred.',
      },
      {
        id: 'c',
        text: 'Nothing physical — sound is just heard directly in the brain.',
        correct: false,
        feedback:
          'A real disturbance travels: a compression–rarefaction pattern in the air carries energy to the ear.',
      },
    ],
    hints: [
      { level: 1, text: 'Recall what the tagged-particle tracker showed after the wave passed.' },
      { level: 2, text: 'Do the air particles end up somewhere new, or back where they started?' },
      { level: 3, text: 'Particles return to their start (net displacement ≈ 0). Energy — carried as compressions and rarefactions — is what reaches the ear.' },
    ],
    explanation:
      'Sound transfers energy without net transfer of particles: air particles oscillate locally while the compression–rarefaction pattern carries energy to the ear (misconception §21.1).',
  },

  // --- 7.2.2 pitch & loudness -------------------------------------------------
  {
    id: 'sq-722-amplitude-pitch',
    kind: 'mcq',
    outcomeCode: '7.2.2',
    concept: 'Amplitude sets loudness; frequency sets pitch',
    misconception: 'Bigger amplitude means a higher pitch',
    difficulty: 'developing',
    representation: 'graph',
    prompt:
      'You turn only the amplitude (output level) up on a tone, leaving the frequency the same. What happens to the pitch?',
    options: [
      { id: 'a', text: 'The pitch stays the same — amplitude changes loudness, not pitch.', correct: true, feedback: 'Correct. Amplitude sets loudness; pitch is set by frequency. Changing amplitude alone leaves the pitch unchanged.' },
      { id: 'b', text: 'The pitch gets higher, because a bigger wave means a higher note.', correct: false, feedback: 'This is the misconception. A bigger amplitude sounds louder, not higher. Pitch depends on frequency, which you did not change.' },
      { id: 'c', text: 'The pitch gets lower.', correct: false, feedback: 'Amplitude does not change pitch at all. Only frequency changes pitch; you changed amplitude.' },
    ],
    hints: [
      { level: 1, text: 'Which control changes pitch, and which changes loudness?' },
      { level: 2, text: 'In the pitch/loudness lab, move only the level slider and watch the frequency readout.' },
      { level: 3, text: 'Frequency → pitch; amplitude → loudness. Changing amplitude alone cannot change the pitch.' },
    ],
    explanation:
      'Frequency determines pitch and amplitude determines loudness; they are independent, so changing amplitude alone never changes the pitch (invariant 20.4).',
  },
  {
    id: 'sq-722-volume-loudness',
    kind: 'mcq',
    outcomeCode: '7.2.2',
    concept: 'Volume (a control setting) versus loudness (a perception)',
    misconception: '"Volume" and "loudness" are the same measured thing',
    difficulty: 'challenging',
    representation: 'text',
    prompt:
      'Two tones are played at exactly the same output level (the same "volume" setting) but at different frequencies. A listener says one sounds louder. How is that possible?',
    options: [
      {
        id: 'a',
        text: 'Loudness is a perception and the ear is not equally sensitive at every frequency, so equal-level tones can sound differently loud.',
        correct: true,
        feedback:
          'Correct. "Volume" is the control setting; "loudness" is what the listener perceives, and hearing sensitivity varies with frequency.',
      },
      {
        id: 'b',
        text: 'It is impossible — equal volume must always sound equally loud.',
        correct: false,
        feedback:
          'Not so. Volume is the setting; loudness is the perception. The ear responds differently to different frequencies, so equal-level tones can sound differently loud.',
      },
      {
        id: 'c',
        text: 'The louder-sounding tone must secretly have a higher amplitude.',
        correct: false,
        feedback:
          'The amplitudes (output levels) are equal here. The difference is in perception — the ear’s sensitivity depends on frequency.',
      },
    ],
    hints: [
      { level: 1, text: 'Is "volume" a setting on the app, or something the listener feels?' },
      { level: 2, text: 'The app shows a relative level, not a calibrated decibel measurement of loudness.' },
      { level: 3, text: 'Volume is the control setting; loudness is perception. Hearing sensitivity varies with frequency, so equal-level tones can sound differently loud.' },
    ],
    explanation:
      '"Volume" is a control setting while "loudness" is a perception; because hearing sensitivity depends on frequency, equal-amplitude tones need not sound equally loud (misconception §21.4). The app shows a relative level, not a calibrated dB SPL.',
  },
  {
    id: 'sq-722-period',
    kind: 'numeric',
    outcomeCode: '7.2.2',
    concept: 'Period of a tone, T = 1/f',
    difficulty: 'developing',
    representation: 'numeric',
    prompt:
      'A pure tone has a frequency of 500 Hz. Calculate its period, in milliseconds (3 significant figures).',
    exactValue: 2,
    unit: 'ms',
    hints: [
      { level: 1, text: 'The period is the time for one full oscillation: T = 1/f.' },
      { level: 2, text: 'T = 1/500 s. Convert seconds to milliseconds (× 1000).' },
      { level: 3, text: 'T = 1/500 = 0.002 s = 2.00 ms.' },
    ],
    explanation: 'T = 1/f = 1/500 s = 0.002 s = 2.00 ms. The pressure trace repeats once every period.',
  },

  // --- 7.2.3 Doppler ----------------------------------------------------------
  {
    id: 'sq-723-source-frequency',
    kind: 'mcq',
    outcomeCode: '7.2.3',
    concept: 'The Doppler effect comes from arrival timing, not a changed source',
    misconception: 'A moving sound source actually emits a different frequency',
    difficulty: 'developing',
    representation: 'text',
    prompt:
      'An ambulance siren sounds higher-pitched as it approaches and lower as it drives away. What is happening to the frequency the siren actually emits?',
    options: [
      {
        id: 'a',
        text: 'The siren keeps emitting exactly the same frequency; the pitch change comes from how often the wavefronts arrive at your ear.',
        correct: true,
        feedback:
          'Correct. The source frequency is unchanged. Because the source moves, wavefronts arrive more often (approaching) or less often (receding), changing the detected pitch.',
      },
      {
        id: 'b',
        text: 'The siren emits a higher frequency while approaching and a lower one while receding.',
        correct: false,
        feedback:
          'This is the misconception. The siren’s emitted frequency does not change. The observed change is caused by wavefront arrival timing as the source moves.',
      },
      {
        id: 'c',
        text: 'The speed of the sound waves increases as the ambulance speeds up.',
        correct: false,
        feedback:
          'Wave speed is set by the medium (the air), not the source. It stays the same; only the arrival timing of wavefronts changes.',
      },
    ],
    hints: [
      { level: 1, text: 'Look at the source-frequency readout in the Doppler lab while the source moves.' },
      { level: 2, text: 'Does the emitted frequency number change, or only the detected one?' },
      { level: 3, text: 'The source frequency is fixed. Motion bunches wavefronts ahead (higher detected pitch) and stretches them behind (lower), all from arrival timing.' },
    ],
    explanation:
      'The Doppler shift arises from wavefront arrival timing as the source moves; the source frequency and the wave speed both stay fixed (SCIENCE_REVIEW §12.3, misconception §21.5).',
  },
  {
    id: 'sq-723-approach-pitch',
    kind: 'mcq',
    outcomeCode: '7.2.3',
    concept: 'Approaching raises detected pitch; receding lowers it',
    difficulty: 'foundational',
    representation: 'diagram',
    prompt: 'A source moves towards a stationary observer. Compared with the source frequency, the detected frequency is…',
    options: [
      { id: 'a', text: 'higher, because the wavefronts bunch up ahead of the moving source.', correct: true, feedback: 'Correct. Approaching bunches the wavefronts, so they arrive more often — a higher detected pitch.' },
      { id: 'b', text: 'lower, because the source is using up its sound.', correct: false, feedback: 'No — approaching bunches wavefronts ahead of the source, raising the detected pitch. Sound is not "used up".' },
      { id: 'c', text: 'exactly the same, because the source frequency does not change.', correct: false, feedback: 'The SOURCE frequency is unchanged, but the DETECTED frequency rises while approaching because wavefronts arrive more often.' },
    ],
    hints: [
      { level: 1, text: 'Do wavefronts bunch up ahead of, or stretch behind, an approaching source?' },
      { level: 2, text: 'Bunched wavefronts arrive more frequently.' },
      { level: 3, text: 'Approaching → wavefronts bunch ahead → arrive more often → higher detected pitch. Receding is the opposite.' },
    ],
    explanation:
      'An approaching source bunches wavefronts ahead of it, so they arrive more frequently and the detected pitch is higher than the source frequency.',
  },
  {
    id: 'sq-723-detected-frequency',
    kind: 'numeric',
    outcomeCode: '7.2.3',
    concept: 'Detected frequency, f′ = f·v/(v − v_s) for an approaching source',
    difficulty: 'challenging',
    representation: 'numeric',
    prompt:
      'A 500 Hz siren approaches a stationary observer at 20 m/s. The speed of sound is 343 m/s. Calculate the detected frequency, in hertz (3 significant figures).',
    exactValue: (500 * 343) / 323,
    unit: 'Hz',
    hints: [
      { level: 1, text: 'For an approaching source with a still observer, f′ = f·v/(v − v_s).' },
      { level: 2, text: 'f′ = 500 × 343 / (343 − 20) = 500 × 343 / 323.' },
      { level: 3, text: 'f′ = 500 × 343 / 323 ≈ 531 Hz — higher than 500 Hz, as expected for approach.' },
    ],
    explanation:
      'f′ = f·v/(v − v_s) = 500 × 343 / (343 − 20) ≈ 531 Hz. The detected frequency is higher than the emitted 500 Hz because the source is approaching.',
  },
  {
    id: 'sq-723-wave-speed',
    kind: 'mcq',
    outcomeCode: '7.2.3',
    concept: 'Wave speed relative to the medium is fixed',
    misconception: 'A moving source makes its sound travel faster',
    difficulty: 'developing',
    representation: 'text',
    prompt: 'While a sound source drives towards you at 30 m/s, what happens to the speed of the sound waves through the air?',
    options: [
      { id: 'a', text: 'It stays the same — wave speed is set by the medium (the air), not by the source’s motion.', correct: true, feedback: 'Correct. The medium sets the wave speed; the source’s motion changes arrival timing, not the speed of sound.' },
      { id: 'b', text: 'It increases by 30 m/s, because the source adds its speed to the sound.', correct: false, feedback: 'No — the source’s motion does not add to the wave speed. The medium fixes the speed of sound; only wavefront timing changes.' },
      { id: 'c', text: 'It becomes supersonic and makes a sonic boom every time.', correct: false, feedback: 'Subsonic sources do not create a sonic boom. The wave speed relative to the air is unchanged; the pitch change is a Doppler (timing) effect.' },
    ],
    hints: [
      { level: 1, text: 'What sets the speed of a wave — the source or the medium?' },
      { level: 2, text: 'Recall the "medium sets the speed" rule from the wave lab.' },
      { level: 3, text: 'The medium fixes the wave speed. A moving (subsonic) source changes only the arrival timing of wavefronts, not the speed of sound.' },
    ],
    explanation:
      'Wave speed is a property of the medium and stays fixed; a subsonic moving source changes wavefront arrival timing (the Doppler effect), not the speed of sound (SCIENCE_REVIEW §12.3).',
  },
];
