import { useState } from 'react';
import { LineGraph } from '../../components/graphs/LineGraph';
import { trialsToCsv, trialsToJson } from '../../investigations/export';
import { inverseFrequency, type Trial } from '../../investigations/types';
import { formatSigFigs } from '../../science/units';

/**
 * Trial results panel: table view (with per-row delete) and the λ vs 1/f graph
 * view, plus CSV/JSON export. The graph always carries a visually-hidden data
 * table (inside LineGraph) as its accessible equivalent.
 */
export interface TrialResultsProps {
  trials: Trial[];
  onDelete: (id: string) => void;
  /** Fixed medium speed of the active preset (for the ideal λ = v/f line). */
  fixedSpeedMps: number;
  presetLabel: string;
}

function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function TrialResults({ trials, onDelete, fixedSpeedMps, presetLabel }: TrialResultsProps) {
  const [view, setView] = useState<'table' | 'graph'>('table');

  const scatter = trials.map((t) => ({ at: inverseFrequency(t), value: t.wavelengthM }));
  const maxInv = Math.max(...scatter.map((p) => p.at), 1e-9);
  const idealLine = [
    { at: 0, value: 0 },
    { at: maxInv * 1.05, value: fixedSpeedMps * maxInv * 1.05 },
  ];

  return (
    <div className="card stack">
      <h2>Trial results</h2>

      <fieldset className="seg-control" data-control-id="wave-lab.graph-view-toggle">
        <legend className="seg-control__legend">Trial results view</legend>
        <div className="seg-control__options" role="radiogroup" aria-label="Trial results view">
          {(
            [
              ['table', 'Table'],
              ['graph', 'Graph'],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="seg-control__option">
              <input
                type="radio"
                name="trial-view"
                checked={view === value}
                onChange={() => setView(value)}
                data-testid={`trial-view-${value}`}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {view === 'table' ? (
        <div className="data-table-wrap">
          <table className="data-table" data-control-id="wave-lab.trial-table">
            <caption>Trial results table</caption>
            <thead>
              <tr>
                <th scope="col">Trial</th>
                <th scope="col">Medium</th>
                <th scope="col">Frequency (Hz)</th>
                <th scope="col">Measured wavelength (m)</th>
                <th scope="col">Computed speed f×λ (m/s)</th>
                <th scope="col">1/frequency (s)</th>
                <th scope="col">Remove</th>
              </tr>
            </thead>
            <tbody data-testid="trial-table-body">
              {trials.length === 0 ? (
                <tr>
                  <td colSpan={7}>No trials yet — measure a wavelength and add it.</td>
                </tr>
              ) : (
                trials.map((t, i) => (
                  <tr key={t.id}>
                    <th scope="row">{i + 1}</th>
                    <td>{t.medium}</td>
                    <td>{formatSigFigs(t.frequencyHz)}</td>
                    <td>{formatSigFigs(t.wavelengthM)}</td>
                    <td>{formatSigFigs(t.speedMps)}</td>
                    <td>{formatSigFigs(inverseFrequency(t))}</td>
                    <td>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => onDelete(t.id)}
                        aria-label={`Delete trial ${i + 1}`}
                      >
                        <span aria-hidden="true">🗑</span> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : trials.length < 2 ? (
        <p className="notice" data-testid="graph-needs-trials">
          Add at least two trials to see a graph.
        </p>
      ) : (
        <LineGraph
          title={`Wavelength against 1/frequency — ${presetLabel} (fixed speed ${formatSigFigs(fixedSpeedMps)} m/s)`}
          xLabel="1/frequency (s)"
          yLabel="wavelength (m)"
          xDomain={[0, maxInv * 1.05]}
          series={[
            { label: 'Ideal λ = v·(1/f)', points: idealLine, mode: 'line' },
            { label: 'Your trials', points: scatter, mode: 'scatter' },
          ]}
          testId="lambda-graph"
        />
      )}

      <div className="seg-control__options">
        <button
          type="button"
          className="btn"
          onClick={() => downloadText('wavemotion-wave-trials.csv', trialsToCsv(trials), 'text/csv')}
          disabled={trials.length === 0}
          data-testid="export-csv"
          data-control-id="wave-lab.export-csv-button"
        >
          Export trials (CSV)
        </button>
        <button
          type="button"
          className="btn"
          onClick={() =>
            downloadText(
              'wavemotion-wave-trials.json',
              trialsToJson(trials, {
                title: 'Wave measurement investigation — λ vs 1/f at fixed speed',
                fixedSpeedMps,
              }),
              'application/json',
            )
          }
          disabled={trials.length === 0}
          data-testid="export-json"
          data-control-id="wave-lab.export-json-button"
        >
          Export trials (JSON)
        </button>
      </div>
    </div>
  );
}
