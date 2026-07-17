import { displacementVsPosition, wavelengthOf, type WaveParams } from '../../science/waves';

/**
 * Labelled SVG wave-anatomy diagram (data-driven, not hand-drawn art):
 * a transverse sine generated from the engine plus a longitudinal particle
 * strip, with crest / trough / equilibrium / amplitude / wavelength labels
 * (individually toggleable) and compression / rarefaction labels.
 */
export type AnatomyLabel = 'crest' | 'trough' | 'equilibrium' | 'amplitude' | 'wavelength';

export const ALL_ANATOMY_LABELS: readonly AnatomyLabel[] = [
  'crest',
  'trough',
  'equilibrium',
  'amplitude',
  'wavelength',
];

const W = 640;
const H = 360;
const TOP = { y0: 110, amp: 62 }; // transverse panel centre + pixel amplitude
const STRIP = { y: 250, h: 64 }; // longitudinal strip

/** Fixed teaching wave: 2 wavelengths across the panel, snapshot at t = 0. */
const PARAMS: WaveParams = { amplitude: 1, frequency: 2, speed: 3.2, phase: Math.PI / 2 };
const SPAN = 2 * wavelengthOf(PARAMS); // 3.2 m → two wavelengths visible

export function WaveAnatomyDiagram({ show }: { show?: ReadonlySet<AnatomyLabel> }) {
  const visible = (l: AnatomyLabel) => !show || show.has(l);
  const samples = displacementVsPosition(PARAMS, 0, SPAN, 160, 0);
  const sx = (x: number) => (x / SPAN) * (W - 40) + 20;
  const sy = (v: number) => TOP.y0 - v * TOP.amp;
  const path = samples
    .map((s, i) => `${i === 0 ? 'M' : 'L'}${sx(s.at).toFixed(1)},${sy(s.value).toFixed(1)}`)
    .join(' ');

  const lambda = wavelengthOf(PARAMS);
  // With phase π/2 the curve is cos: crest at x = 0, λ, 2λ; trough at λ/2, 3λ/2.
  const crestX = sx(lambda);
  const troughX = sx(lambda / 2);

  // Longitudinal strip particles: position = equilibrium + displacement along x.
  const parts: number[] = [];
  const N = 64;
  for (let i = 0; i < N; i++) {
    const eq = (SPAN * i) / (N - 1);
    const d = samples[Math.round((i * (samples.length - 1)) / (N - 1))].value;
    parts.push(sx(eq) + d * 14);
  }
  // Particles crowd where the displacement gradient d′(x) is most negative.
  // For the cos profile d(x) = A·cos(kx), d′(x) = −Ak·sin(kx), which is most
  // negative at x = λ/4 (compression); most positive at x = 3λ/4 (rarefaction).
  const compressionX = sx(lambda * 0.25);
  const rarefactionX = sx(lambda * 0.75);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="anatomy-svg"
      role="img"
      aria-label="Labelled wave anatomy: a transverse wave showing crest, trough, equilibrium, amplitude and wavelength, and a longitudinal particle strip showing compressions and rarefactions"
      data-testid="wave-anatomy"
    >
      <text x={20} y={24} fontSize={14} fontWeight={600} fill="var(--ink-strong)">
        Transverse wave (displacement ⟂ propagation →)
      </text>

      {/* equilibrium line */}
      {visible('equilibrium') ? (
        <g>
          <line x1={20} x2={W - 20} y1={TOP.y0} y2={TOP.y0} stroke="var(--ink-muted)" strokeDasharray="6 5" />
          <text x={W - 24} y={TOP.y0 - 6} fontSize={12} fill="var(--ink-muted)" textAnchor="end">
            equilibrium
          </text>
        </g>
      ) : null}

      <path d={path} fill="none" stroke="var(--accent-cyan-ink)" strokeWidth={3} />

      {visible('crest') ? (
        <g data-testid="label-crest">
          <circle cx={crestX} cy={sy(1)} r={5} fill="var(--accent-violet-ink)" />
          <text x={crestX} y={sy(1) - 12} fontSize={13} textAnchor="middle" fill="var(--ink-strong)">
            crest
          </text>
        </g>
      ) : null}

      {visible('trough') ? (
        <g data-testid="label-trough">
          <circle cx={troughX} cy={sy(-1)} r={5} fill="var(--accent-violet-ink)" />
          <text x={troughX} y={sy(-1) + 22} fontSize={13} textAnchor="middle" fill="var(--ink-strong)">
            trough
          </text>
        </g>
      ) : null}

      {visible('amplitude') ? (
        <g data-testid="label-amplitude">
          <line
            x1={sx(2 * lambda)}
            x2={sx(2 * lambda)}
            y1={TOP.y0}
            y2={sy(1)}
            stroke="var(--ink-strong)"
            strokeWidth={2}
            markerEnd="url(#arrow)"
          />
          <text x={sx(2 * lambda) + 8} y={(TOP.y0 + sy(1)) / 2} fontSize={13} fill="var(--ink-strong)">
            amplitude A
          </text>
        </g>
      ) : null}

      {visible('wavelength') ? (
        <g data-testid="label-wavelength">
          <line
            x1={crestX}
            x2={sx(2 * lambda)}
            y1={sy(1) - 30}
            y2={sy(1) - 30}
            stroke="var(--ink-strong)"
            strokeWidth={2}
          />
          <line x1={crestX} x2={crestX} y1={sy(1) - 36} y2={sy(1) - 24} stroke="var(--ink-strong)" strokeWidth={2} />
          <line
            x1={sx(2 * lambda)}
            x2={sx(2 * lambda)}
            y1={sy(1) - 36}
            y2={sy(1) - 24}
            stroke="var(--ink-strong)"
            strokeWidth={2}
          />
          <text
            x={(crestX + sx(2 * lambda)) / 2}
            y={sy(1) - 38}
            fontSize={13}
            textAnchor="middle"
            fill="var(--ink-strong)"
          >
            wavelength λ (crest to crest)
          </text>
        </g>
      ) : null}

      {/* Longitudinal strip */}
      <text x={20} y={STRIP.y - 18} fontSize={14} fontWeight={600} fill="var(--ink-strong)">
        Longitudinal wave (displacement ∥ propagation →)
      </text>
      <rect x={20} y={STRIP.y} width={W - 40} height={STRIP.h} fill="var(--surface-sunken)" rx={8} />
      {parts.map((px, i) => (
        <circle key={i} cx={px} cy={STRIP.y + STRIP.h / 2} r={4} fill="var(--accent-violet-ink)" />
      ))}
      <text x={compressionX} y={STRIP.y + STRIP.h + 20} fontSize={13} textAnchor="middle" fill="var(--ink-strong)">
        compression
      </text>
      <text x={rarefactionX} y={STRIP.y + STRIP.h + 20} fontSize={13} textAnchor="middle" fill="var(--ink-strong)">
        rarefaction
      </text>

      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink-strong)" />
        </marker>
      </defs>
    </svg>
  );
}
