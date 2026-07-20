export type EarSignalType = 'mechanical' | 'fluid' | 'electrical';

export interface EarPart {
  id: string;
  name: string;
  signalType: EarSignalType;
  description: string;
}

export const EAR_PATHWAY: readonly EarPart[] = [
  { id: 'outer-ear', name: 'Outer ear', signalType: 'mechanical', description: 'Collects sound energy and directs it into the ear canal.' },
  { id: 'canal', name: 'Ear canal', signalType: 'mechanical', description: 'Guides the pressure variation towards the eardrum.' },
  { id: 'eardrum', name: 'Eardrum', signalType: 'mechanical', description: 'Vibrates as the arriving pressure changes.' },
  { id: 'ossicles', name: 'Ossicles', signalType: 'mechanical', description: 'Three small bones transfer and amplify the vibration.' },
  { id: 'oval-window', name: 'Oval window', signalType: 'mechanical', description: 'Transfers the ossicle vibration into cochlear fluid.' },
  { id: 'cochlear-fluid', name: 'Cochlear fluid', signalType: 'fluid', description: 'Carries a travelling disturbance through the coiled cochlea.' },
  { id: 'hair-cells', name: 'Hair cells', signalType: 'electrical', description: 'Convert local fluid-driven motion into electrical nerve signals.' },
  { id: 'auditory-nerve', name: 'Auditory nerve', signalType: 'electrical', description: 'Carries coded electrical signals towards the brain for interpretation.' },
] as const;

export interface CochlearPlace {
  label: 'apex' | 'middle' | 'base';
  frequencyDescription: string;
  position: number;
}

export function cochlearPlaceForFrequency(frequencyHz: number): CochlearPlace {
  if (!Number.isFinite(frequencyHz) || frequencyHz < 20 || frequencyHz > 20_000) {
    throw new RangeError('Frequency must be between 20 Hz and 20,000 Hz.');
  }
  const position = Math.log10(frequencyHz / 20) / Math.log10(20_000 / 20);
  if (frequencyHz < 500) return { label: 'apex', frequencyDescription: 'low-frequency region near the apex', position };
  if (frequencyHz < 4_000) return { label: 'middle', frequencyDescription: 'mid-frequency region', position };
  return { label: 'base', frequencyDescription: 'high-frequency region near the base', position };
}
