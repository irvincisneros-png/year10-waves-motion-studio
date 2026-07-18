import { useId } from 'react';
import { formatSigFigs } from '../../science/units';
import './LineGraph.css';

/**
 * Reusable SVG line/scatter graph (IMPLEMENTATION_PLAN §5: graphs take typed
 * series produced by engines and never compute physics themselves).
 *
 * - Axis labels carry units (SCIENCE_REVIEW §20.14 — no bare numbers).
 * - A visually-hidden data table is always rendered as the accessible
 *   equivalent of the plot.
 * - Pure render: animation synchronisation comes from the parent re-passing
 *   series each clock tick, so reduced-motion stepping "just works".
 */

export interface GraphSeries {
  label: string;
  points: readonly { at: number; value: number }[];
  /** 'line' joins points; 'scatter' marks them. */
  mode?: 'line' | 'scatter';
  colour?: string;
}

export interface LineGraphProps {
  title: string;
  xLabel: string;
  yLabel: string;
  series: GraphSeries[];
  height?: number;
  /** Fixed y range (else auto from data, symmetric-padded). */
  yDomain?: [number, number];
  xDomain?: [number, number];
  testId?: string;
  /** Cap on rows in the accessible table (evenly sampled). */
  tableRows?: number;
}

const M = { top: 14, right: 14, bottom: 44, left: 58 };
const W = 640;

function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return [min];
  const span = max - min;
  const step = 10 ** Math.floor(Math.log10(span / count));
  const err = span / count / step;
  const mult = err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1;
  const tick = step * mult;
  const start = Math.ceil(min / tick) * tick;
  const ticks: number[] = [];
  for (let v = start; v <= max + tick * 1e-9; v += tick) ticks.push(v);
  return ticks;
}

export function LineGraph({
  title,
  xLabel,
  yLabel,
  series,
  height = 300,
  yDomain,
  xDomain,
  testId,
  tableRows = 12,
}: LineGraphProps) {
  const titleId = useId();
  const all = series.flatMap((s) => s.points);
  const xs = all.map((p) => p.at);
  const ys = all.map((p) => p.value);
  const [xMin, xMax] = xDomain ?? [Math.min(...xs, 0), Math.max(...xs, 1e-9)];
  let [yMin, yMax] = yDomain ?? [Math.min(...ys, 0), Math.max(...ys, 1e-9)];
  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }
  const plotW = W - M.left - M.right;
  const plotH = height - M.top - M.bottom;
  const sx = (x: number) => M.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => M.top + (1 - (y - yMin) / (yMax - yMin)) * plotH;

  const xTicks = niceTicks(xMin, xMax);
  const yTicks = niceTicks(yMin, yMax);

  const palette = ['var(--accent-cyan-ink)', 'var(--accent-violet-ink)'];

  // Accessible table: evenly sample the first series (and align others by index).
  const sampleIdx = (n: number) => {
    if (n <= tableRows) return Array.from({ length: n }, (_, i) => i);
    return Array.from({ length: tableRows }, (_, i) =>
      Math.round((i * (n - 1)) / (tableRows - 1)),
    );
  };

  return (
    <figure className="line-graph" data-testid={testId}>
      <figcaption className="line-graph__title" id={titleId}>
        {title}
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-labelledby={titleId}
        className="line-graph__svg"
      >
        {/* Gridlines + ticks */}
        {yTicks.map((v) => (
          <g key={`y${v}`}>
            <line
              x1={M.left}
              x2={W - M.right}
              y1={sy(v)}
              y2={sy(v)}
              className="line-graph__grid"
            />
            <text x={M.left - 8} y={sy(v)} className="line-graph__tick line-graph__tick--y">
              {formatSigFigs(v)}
            </text>
          </g>
        ))}
        {xTicks.map((v) => (
          <g key={`x${v}`}>
            <line
              y1={M.top}
              y2={height - M.bottom}
              x1={sx(v)}
              x2={sx(v)}
              className="line-graph__grid"
            />
            <text x={sx(v)} y={height - M.bottom + 18} className="line-graph__tick">
              {formatSigFigs(v)}
            </text>
          </g>
        ))}
        {/* Axes */}
        <line
          x1={M.left}
          x2={W - M.right}
          y1={height - M.bottom}
          y2={height - M.bottom}
          className="line-graph__axis"
        />
        <line x1={M.left} x2={M.left} y1={M.top} y2={height - M.bottom} className="line-graph__axis" />
        <text x={M.left + plotW / 2} y={height - 8} className="line-graph__label">
          {xLabel}
        </text>
        <text
          x={14}
          y={M.top + plotH / 2}
          className="line-graph__label"
          transform={`rotate(-90 14 ${M.top + plotH / 2})`}
        >
          {yLabel}
        </text>
        {/* Series */}
        {series.map((s, i) => {
          const colour = s.colour ?? palette[i % palette.length];
          if ((s.mode ?? 'line') === 'scatter') {
            return (
              <g key={s.label}>
                {s.points.map((p, j) => (
                  <circle key={j} cx={sx(p.at)} cy={sy(p.value)} r={4.5} fill={colour} />
                ))}
              </g>
            );
          }
          const d = s.points
            .map((p, j) => `${j === 0 ? 'M' : 'L'}${sx(p.at).toFixed(2)},${sy(p.value).toFixed(2)}`)
            .join(' ');
          return <path key={s.label} d={d} fill="none" stroke={colour} strokeWidth={2.5} />;
        })}
      </svg>
      {/* Accessible data-table equivalent (always present). The hidden class
          sits on a wrapper div: a table's min-content width ignores width:1px
          and would otherwise poke out of the clip box and cause page-level
          horizontal overflow. */}
      <div className="u-visually-hidden">
      <table>
        <caption>
          Data table for {title}: {xLabel} against {yLabel}
        </caption>
        <thead>
          <tr>
            <th scope="col">{xLabel}</th>
            {series.map((s) => (
              <th scope="col" key={s.label}>
                {s.label} — {yLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {series.length > 0
            ? sampleIdx(series[0].points.length).map((idx) => (
                <tr key={idx}>
                  <td>{formatSigFigs(series[0].points[idx]?.at ?? 0)}</td>
                  {series.map((s) => (
                    <td key={s.label}>{formatSigFigs(s.points[idx]?.value ?? 0)}</td>
                  ))}
                </tr>
              ))
            : null}
        </tbody>
      </table>
      </div>
    </figure>
  );
}
