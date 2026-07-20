/**
 * Glossary of core Year 10 Waves & Motion terms. Australian English.
 * Definitions are teacher-authored plain-language descriptions for the shell
 * glossary route; the science engines and SCIENCE_REVIEW.md remain the
 * authority for exact quantitative definitions.
 */

export interface GlossaryTerm {
  term: string;
  definition: string;
  strand: 'waves' | 'sound' | 'light' | 'motion' | 'forces';
}

export const glossary: GlossaryTerm[] = [
  {
    term: 'Amplitude',
    definition:
      'The maximum distance a point on a wave moves away from its rest position. Larger amplitude carries more energy.',
    strand: 'waves',
  },
  {
    term: 'Wavelength',
    definition:
      'The distance between two matching points on neighbouring waves, such as crest to crest. Its symbol is the Greek letter λ (lambda).',
    strand: 'waves',
  },
  {
    term: 'Frequency',
    definition:
      'The number of complete waves passing a point each second, measured in hertz (Hz). One hertz is one wave per second.',
    strand: 'waves',
  },
  {
    term: 'Period',
    definition:
      'The time taken for one complete wave to pass a point. It is the reciprocal of frequency (T = 1 / f).',
    strand: 'waves',
  },
  {
    term: 'Wave speed',
    definition:
      'How fast a wave travels through a medium, linked to frequency and wavelength by v = fλ.',
    strand: 'waves',
  },
  {
    term: 'Transverse wave',
    definition:
      'A wave in which the medium oscillates at right angles to the direction the wave travels, such as light or a wave on a rope.',
    strand: 'waves',
  },
  {
    term: 'Longitudinal wave',
    definition:
      'A wave in which the medium oscillates back and forth along the same direction the wave travels, such as sound.',
    strand: 'sound',
  },
  {
    term: 'Compression and rarefaction',
    definition:
      'Regions of a longitudinal wave where the medium is squeezed together (compression) or spread apart (rarefaction).',
    strand: 'sound',
  },
  {
    term: 'Pitch',
    definition:
      'How high or low a sound seems. Higher-frequency sound waves are heard as a higher pitch.',
    strand: 'sound',
  },
  {
    term: 'Doppler effect',
    definition:
      'The change in observed frequency of a wave when its source and the observer move towards or away from each other.',
    strand: 'sound',
  },
  {
    term: 'Electromagnetic spectrum',
    definition:
      'The full range of electromagnetic waves, from radio waves through visible light to gamma rays, ordered by frequency and wavelength.',
    strand: 'light',
  },
  {
    term: 'Refraction',
    definition:
      'The bending of a wave as it passes from one medium into another and changes speed, while its frequency stays the same.',
    strand: 'light',
  },
  {
    term: 'Reflection',
    definition:
      'The bouncing of a wave off a surface, where the angle of incidence equals the angle of reflection.',
    strand: 'light',
  },
  {
    term: 'Absorption',
    definition: 'A transfer in which incoming light energy is taken up by a material rather than transmitted through it or reflected away.',
    strand: 'light',
  },
  {
    term: 'Scattering',
    definition: 'The redirection of light in many directions by particles or variations in a material. The light energy is redirected, not destroyed.',
    strand: 'light',
  },
  {
    term: 'Normal (optics)',
    definition: 'An imaginary line perpendicular to a surface at the point where a ray arrives. Incident, reflected and refracted angles are measured from it.',
    strand: 'light',
  },
  {
    term: 'Refractive index',
    definition: 'A dimensionless comparison n = c/v showing how much slower light travels in a medium than in vacuum.',
    strand: 'light',
  },
  {
    term: 'Pupil',
    definition: 'The opening in the iris that changes size to control how much light enters the eye; it does not focus the image.',
    strand: 'light',
  },
  {
    term: 'Accommodation',
    definition: 'The adjustment of lens shape by the ciliary muscles to bring objects at different distances into focus on the retina.',
    strand: 'light',
  },
  {
    term: 'Retina',
    definition: 'The light-sensitive layer at the back of the eye where an optical image forms and receptors begin converting light into neural signals.',
    strand: 'light',
  },
  {
    term: 'Speed',
    definition:
      'How fast an object moves, found by dividing the distance travelled by the time taken. Speed has size but no direction.',
    strand: 'motion',
  },
  {
    term: 'Velocity',
    definition:
      'The rate of change of displacement. Velocity has both size and direction, so it is a vector.',
    strand: 'motion',
  },
  {
    term: 'Acceleration',
    definition:
      'The rate of change of velocity, found with a = Δv/Δt. An object accelerates when it speeds up, slows down, or changes direction.',
    strand: 'motion',
  },
  {
    term: 'Force',
    definition:
      'A push or pull on an object, measured in newtons (N). A net force changes an object’s motion following F = ma.',
    strand: 'forces',
  },
  {
    term: 'Net force',
    definition:
      'The single force that results from combining all the forces acting on an object. A zero net force means no change in motion.',
    strand: 'forces',
  },
];
