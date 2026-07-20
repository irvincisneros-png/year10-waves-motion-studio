import { outcomeMap } from '../content/outcomes';
import { ACTIVE_OUTCOME_CODES } from '../content/releaseRegistry';
import { lightQuestions } from './lightQuestions';
import { forceQuestions, motionQuestions } from './motionForcesQuestions';
import { soundQuestions } from './soundQuestions';
import { stageSixQuestions } from './stageSixQuestions';
import type { ConstructedQuestion, Question } from './types';
import { waveQuestions } from './waveQuestions';

export interface MasteryQuestionTag {
  misconception: string;
  responseMode: 'selected' | 'constructed';
}

export type MasteryQuestion = Question & MasteryQuestionTag;

const conceptsByOutcome: Record<string, [string[], string[]]> = {
  '7.1.1': [['mechanical', 'medium'], ['electromagnetic', 'vacuum']],
  '7.1.2': [['energy', 'transfer'], ['particle', 'oscillat']],
  '7.1.3': [['transverse', 'perpendicular'], ['longitudinal', 'parallel', 'compression']],
  '7.1.4': [['frequency', 'wavelength'], ['electromagnetic', 'spectrum']],
  '7.1.5': [['amplitude', 'frequency'], ['speed', 'wavelength']],
  '7.1.6': [['v = f', 'speed'], ['frequency', 'wavelength']],
  '7.1.7': [['property', 'interaction'], ['use', 'application']],
  '7.2.1': [['compression', 'rarefaction'], ['energy', 'particle']],
  '7.2.2': [['frequency', 'pitch'], ['amplitude', 'loudness', 'volume']],
  '7.2.3': [['source frequency', 'emitted frequency'], ['arrival', 'detected']],
  '7.2.4': [['mechanical', 'fluid'], ['electrical', 'nerve']],
  '7.2.6': [['echo', 'reflection'], ['time', 'depth', 'divide']],
  '7.3.1': [['optical', 'retina'], ['neural', 'perception']],
  '7.3.2': [['reflection', 'refraction'], ['absorption', 'scattering']],
  '7.3.3': [['property', 'application'], ['evidence', 'limitation']],
  '7.3.4': [['spectrum', 'band'], ['line', 'composition', 'shift']],
  '7.4.1': [['distance', 'speed'], ['displacement', 'velocity']],
  '7.4.2': [['equal time', 'interval'], ['spacing', 'position']],
  '7.4.3': [['graph', 'time'], ['slope', 'speed']],
  '7.4.4': [['force', 'mass'], ['acceleration', 'f = ma']],
  '7.4.5': [['net force', 'newton'], ['different objects', 'third law']],
  '7.4.6': [['force', 'vector'], ['net', 'sum']],
  '7.4.7': [['equation', 'unit'], ['force', 'motion']],
  '7.5.1': [['contention', 'criterion'], ['evidence', 'counterclaim']],
};

const constructedQuestions: ConstructedQuestion[] = ACTIVE_OUTCOME_CODES.flatMap((outcomeCode) => {
  const outcome = outcomeMap[outcomeCode];
  const concepts = conceptsByOutcome[outcomeCode];
  if (!concepts) throw new Error(`Missing mastery concept checklist for ${outcomeCode}`);
  const base = {
    outcomeCode,
    concept: outcome.text,
    misconception: 'Explain a boundary or misconception explicitly',
    representation: 'text' as const,
    kind: 'constructed' as const,
    minWords: 20,
    requiredConceptGroups: concepts,
    rubric: ['State a clear claim.', 'Use at least two relevant science concepts.', 'Link evidence to reasoning.', 'State a limitation or boundary.'],
    hints: [
      { level: 1 as const, text: 'Begin with one sentence that answers the prompt.' },
      { level: 2 as const, text: `Use evidence about ${concepts[0].join(' or ')} and ${concepts[1].join(' or ')}.` },
      { level: 3 as const, text: 'Link the evidence to the claim, then state one limitation or misconception the model corrects.' },
    ] as ConstructedQuestion['hints'],
  };
  return [
    { ...base, id: `mastery-${outcomeCode}-explain`, difficulty: 'developing' as const, prompt: `Explain this outcome with linked evidence: ${outcome.text}`, explanation: 'A strong response links the two named concept groups and states the model boundary.' },
    { ...base, id: `mastery-${outcomeCode}-evaluate`, difficulty: 'challenging' as const, prompt: `Evaluate a common misconception or model limitation connected with: ${outcome.text}`, explanation: 'Evaluation distinguishes the science claim from an overgeneralisation and supports it with evidence.' },
  ];
});

const objectiveQuestions: Question[] = [
  ...waveQuestions,
  ...soundQuestions,
  ...lightQuestions,
  ...motionQuestions,
  ...forceQuestions,
  ...stageSixQuestions,
];

const tagQuestion = (item: Question): MasteryQuestion => ({
  ...item,
  misconception: item.misconception ?? 'none — retrieval or quantitative application',
  responseMode: item.kind === 'mcq' ? 'selected' : 'constructed',
});

export const masteryQuestionBank: readonly MasteryQuestion[] = [
  ...objectiveQuestions.map(tagQuestion),
  ...constructedQuestions.map(tagQuestion),
];

const firstQuestionByOutcome = (questions: readonly Question[]) => {
  const result = new Map<string, Question>();
  for (const question of questions) {
    if (!result.has(question.outcomeCode)) result.set(question.outcomeCode, question);
  }
  return result;
};

const objectiveByOutcome = firstQuestionByOutcome(objectiveQuestions);
const constructedByOutcome = firstQuestionByOutcome(constructedQuestions);

/** One question per active outcome, alternating objective and constructed response modes. */
export const masterySessionQuestions: readonly MasteryQuestion[] = ACTIVE_OUTCOME_CODES.map((outcomeCode, index) => {
  const preferred = index % 2 === 0 ? objectiveByOutcome : constructedByOutcome;
  const fallback = index % 2 === 0 ? constructedByOutcome : objectiveByOutcome;
  const question = preferred.get(outcomeCode) ?? fallback.get(outcomeCode);
  if (!question) throw new Error(`Missing mastery session question for ${outcomeCode}`);
  return tagQuestion(question);
});
