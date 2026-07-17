/**
 * Learning-map data for the home page.
 *
 * The 11 planned workspaces of WaveMotion Studio, grouped by strand and
 * labelled with the syllabus outcomes each will cover. In Stage 1 NONE of the
 * workspaces are built, so every card is marked `in-development` and rendered
 * as a NON-interactive panel (never a dead link/button). Only the shared shell
 * routes (glossary/progress/teacher/about) are navigable this stage.
 *
 * Outcome codes reference src/content/outcomes.ts (the canonical list).
 */

export type WorkspaceStatus = 'in-development' | 'available';

export interface Workspace {
  id: string;
  name: string;
  summary: string;
  outcomeCodes: string[];
  status: WorkspaceStatus;
  /** Set only when a real route exists (Stage 2+). */
  route?: string;
  /** Optional note, e.g. a deferral reason. */
  note?: string;
}

export interface StrandGroup {
  id: string;
  title: string;
  blurb: string;
  accent: 'cyan' | 'violet';
  workspaces: Workspace[];
}

export const learningMap: StrandGroup[] = [
  {
    id: 'waves',
    title: 'Wave properties',
    blurb: 'What every wave has in common, and the electromagnetic family.',
    accent: 'cyan',
    workspaces: [
      {
        id: 'waves',
        name: 'Wave foundations',
        summary:
          'Model mechanical vs electromagnetic waves, transverse vs longitudinal, and measure amplitude, frequency, wavelength and speed.',
        outcomeCodes: ['7.1.1', '7.1.2', '7.1.3', '7.1.5', '7.1.6'],
        status: 'in-development',
      },
      {
        id: 'spectrum',
        name: 'EM spectrum',
        summary:
          'Compare the wave forms of the electromagnetic spectrum and how their properties suit different uses.',
        outcomeCodes: ['7.1.4', '7.1.7'],
        status: 'in-development',
      },
    ],
  },
  {
    id: 'sound',
    title: 'Sound',
    blurb: 'Longitudinal sound energy, how we hear it, and medical uses.',
    accent: 'violet',
    workspaces: [
      {
        id: 'sound',
        name: 'Sound laboratory',
        summary:
          'Compressions and rarefactions, how amplitude and frequency change loudness and pitch, and the Doppler effect.',
        outcomeCodes: ['7.2.1', '7.2.2', '7.2.3'],
        status: 'in-development',
      },
      {
        id: 'hearing',
        name: 'Hearing',
        summary: 'How the ear responds to sound waves.',
        outcomeCodes: ['7.2.4', '7.2.5'],
        status: 'in-development',
        note: 'Outcome 7.2.5 (Aboriginal and Torres Strait Islander instruments) is deferred until community-approved sources are supplied.',
      },
      {
        id: 'ultrasound',
        name: 'Ultrasound',
        summary: 'How sound waves are used in medical diagnosis.',
        outcomeCodes: ['7.2.6'],
        status: 'in-development',
      },
    ],
  },
  {
    id: 'light',
    title: 'Light',
    blurb: 'How light behaves, how we see it, and what it tells us about stars.',
    accent: 'cyan',
    workspaces: [
      {
        id: 'light',
        name: 'Light & optics',
        summary:
          'Absorption, reflection, refraction and scattering, and their everyday applications.',
        outcomeCodes: ['7.3.2', '7.3.3'],
        status: 'in-development',
      },
      {
        id: 'vision',
        name: 'Vision & astronomy',
        summary:
          'How the eye responds to light, and how the electromagnetic spectrum is used to learn about stars.',
        outcomeCodes: ['7.3.1', '7.3.4'],
        status: 'in-development',
      },
    ],
  },
  {
    id: 'motion',
    title: 'Motion & forces',
    blurb: 'Describing motion with data and graphs, and Newton’s laws.',
    accent: 'violet',
    workspaces: [
      {
        id: 'motion',
        name: 'Describing motion',
        summary:
          'Distance, time, speed, displacement and velocity; motion diagrams and distance–time graphs.',
        outcomeCodes: ['7.4.1', '7.4.2', '7.4.3'],
        status: 'in-development',
      },
      {
        id: 'forces',
        name: 'Forces & Newton’s laws',
        summary:
          'Force, mass and acceleration; Newton’s laws; one-dimensional net force; and the F = ma, vₐᵥ = Δs/Δt and a = Δv/Δt calculations.',
        outcomeCodes: ['7.4.4', '7.4.5', '7.4.6', '7.4.7'],
        status: 'in-development',
      },
    ],
  },
  {
    id: 'context',
    title: 'Waves & motion in context',
    blurb: 'Bringing the ideas together and applying them to society.',
    accent: 'cyan',
    workspaces: [
      {
        id: 'society',
        name: 'Argument studio',
        summary:
          'Structure an argument analysing how waves and motion have changed society.',
        outcomeCodes: ['7.5.1'],
        status: 'in-development',
      },
      {
        id: 'mastery',
        name: 'Mastery challenge',
        summary:
          'Mixed revision across every strand, drawing on validated questions once the workspaces are built.',
        outcomeCodes: [],
        status: 'in-development',
        note: 'Reviews all outcomes; assesses only content that has been built.',
      },
    ],
  },
];
