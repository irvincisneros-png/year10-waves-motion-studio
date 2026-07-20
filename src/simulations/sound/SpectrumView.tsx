import { useId } from 'react';
import { formatSigFigs } from '../../science/units';
import type { SpectrumBar } from '../../science/sound';

/**
 * Frequency-domain (spectrum) bar view for the pitch/loudness lab. Renders the
 * qualitative harmonic amplitudes from the sound engine as an SVG bar chart with
 * an always-present accessible data table. Driven by the deterministic waveform
 * model, so it works with audio muted or unavailable.
 */
const W = 640;
const H = 260;
const M = { top: 16, right: 16, bottom: 48, left: 52 };

export function SpectrumView({ bars, testId }: { bars: SpectrumBar[]; testId?: string }) {
  const titleId = useId();
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const maxAmp = Math.max(...bars.map((b) => b.amplitude), 1e-9);
  const barW = (plotW / bars.length) * 0.6;

  const bx = (i: number) => M.left + (plotW / bars.length) * (i + 0.5);
  const by = (amp: number) => M.top + (1 - amp / maxAmp) * plotH;

  return (
    <figure className="line-graph" data-testid={testId}>
      <figcaption className="line-graph__title" id={titleId}>
        Frequency spectrum (harmonic amplitudes)
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={titleId} className="line-graph__svg">
        {/* Axes */}
        <line x1={M.left} x2={W - M.right} y1={H - M.bottom} y2={H - M.bottom} className="line-graph__axis" />
        <line x1={M.left} x2={M.left} y1={M.top} y2={H - M.bottom} className="line-graph__axis" />
        <text x={M.left + plotW / 2} y={H - 8} className="line-graph__label">
          frequency (Hz)
        </text>
        <text
          x={14}
          y={M.top + plotH / 2}
          className="line-graph__label"
          transform={`rotate(-90 14 ${M.top + plotH / 2})`}
        >
          relative amplitude
        </text>
        {bars.map((b, i) => {
          const top = by(b.amplitude);
          return (
            <g key={b.harmonic}>
              <rect
                x={bx(i) - barW / 2}
                y={top}
                width={barW}
                height={Math.max(0, H - M.bottom - top)}
                fill={b.harmonic === 1 ? 'var(--accent-cyan-ink)' : 'var(--accent-violet-ink)'}
              />
              <text x={bx(i)} y={H - M.bottom + 16} className="line-graph__tick" textAnchor="middle">
                {formatSigFigs(b.frequencyHz)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="u-visually-hidden">
        <table>
          <caption>Data table for the frequency spectrum: harmonic, frequency and relative amplitude</caption>
          <thead>
            <tr>
              <th scope="col">Harmonic</th>
              <th scope="col">Frequency (Hz)</th>
              <th scope="col">Relative amplitude</th>
            </tr>
          </thead>
          <tbody>
            {bars.map((b) => (
              <tr key={b.harmonic}>
                <td>{b.harmonic}</td>
                <td>{formatSigFigs(b.frequencyHz)}</td>
                <td>{formatSigFigs(b.amplitude)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
