/**
 * CSV + JSON serialisation for investigation trials. Produces parseable output
 * (tested in e2e). Units are carried in the column headers, never bare numbers
 * (SCIENCE_REVIEW §20.14). Pure TS.
 */

import { inverseFrequency, type InvestigationExport, type Trial } from './types';

export const TRIAL_COLUMNS = [
  'Medium',
  'Frequency (Hz)',
  'Wavelength (m)',
  'Speed (m/s)',
  '1/frequency (s)',
] as const;

/** Escape a CSV field per RFC 4180 (quote if it contains , " or newline). */
function csvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Serialise trials to CSV text with a units-bearing header row. */
export function trialsToCsv(trials: readonly Trial[]): string {
  const rows: string[] = [TRIAL_COLUMNS.map(csvField).join(',')];
  for (const t of trials) {
    rows.push(
      [
        csvField(t.medium),
        String(t.frequencyHz),
        String(t.wavelengthM),
        String(t.speedMps),
        String(inverseFrequency(t)),
      ].join(','),
    );
  }
  return rows.join('\n');
}

/** Serialise trials to a schema-wrapped JSON export. */
export function trialsToJson(
  trials: readonly Trial[],
  opts: { title: string; fixedSpeedMps: number | null },
): string {
  const payload: InvestigationExport = {
    schema: 'wavemotion.investigation',
    version: 1,
    title: opts.title,
    exportedAt: new Date().toISOString(),
    fixedSpeedMps: opts.fixedSpeedMps,
    columns: [...TRIAL_COLUMNS],
    trials: [...trials],
  };
  return JSON.stringify(payload, null, 2);
}
