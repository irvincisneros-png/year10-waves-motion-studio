import { pressureVsPosition, longitudinalParticles } from '../../science/sound';
import type { WaveParams } from '../../science/waves';

/**
 * Labelled SVG anatomy of a sound wave (data-driven, not hand-drawn art): a
 * vibrating source at the left, a strip of air particles that bunch into
 * compressions and spread into rarefactions, and the matching pressure-vs-
 * position curve beneath — all generated from the sound engine at one instant.
 * Shows the honest link: a compression is a pressure MAXIMUM (bunched
 * particles), a rarefaction is a pressure MINIMUM (spread particles).
 */

const W = 640;
const H = 320;
const STRIP = { y: 70, h: 70 };
const CURVE = { y0: 220, amp: 55 };

/** Fixed teaching wave: two wavelengths across the strip, snapshot at t = 0. */
const PARAMS: WaveParams = { amplitude: 1, frequency: 2, speed: 6, phase: 0 };
const SPAN = 4; // metres shown = 2 wavelengths (λ = v/f = 3 m ... span chosen for clarity)

export function SoundAnatomyDiagram() {
  const sx = (x: number) => (x / SPAN) * (W - 60) + 30;

  const N = 90;
  const equilibria = Array.from({ length: N }, (_, i) => (SPAN * i) / (N - 1));
  const particles = longitudinalParticles(PARAMS, equilibria, 0, 0.18);

  const pressure = pressureVsPosition(PARAMS, 0, SPAN, 160, 0);
  const py = (v: number) => CURVE.y0 - v * CURVE.amp;
  const path = pressure
    .map((s, i) => `${i === 0 ? 'M' : 'L'}${sx(s.at).toFixed(1)},${py(s.value).toFixed(1)}`)
    .join(' ');

  // A compression sits at a pressure maximum, a rarefaction at a minimum. For
  // this cos-pressure snapshot p = A·cos(kx): max at x = 0, λ, 2λ; min at λ/2,
  // 3λ/2. λ = v/f = 3 m, so within SPAN = 4 m: compression at 0 and 3 m,
  // rarefaction at 1.5 m.
  const lambda = 3;
  const compressionXs = [0, lambda].filter((x) => x <= SPAN);
  const rarefactionXs = [lambda / 2, (3 * lambda) / 2].filter((x) => x <= SPAN);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="anatomy-svg"
      role="img"
      aria-label="Sound wave anatomy: a vibrating source drives a strip of air particles that bunch into compressions and spread into rarefactions, with the matching pressure-versus-position curve below. A compression is a pressure maximum; a rarefaction is a pressure minimum."
      data-testid="sound-anatomy"
    >
      <text x={20} y={26} fontSize={14} fontWeight={600} fill="var(--ink-strong)">
        Longitudinal sound wave (particles vibrate ∥ propagation →)
      </text>

      {/* Vibrating source (loudspeaker cone) at the left edge. */}
      <g>
        <rect x={8} y={STRIP.y + 6} width={10} height={STRIP.h - 12} rx={2} fill="var(--ink-muted)" />
        <text x={4} y={STRIP.y + STRIP.h + 18} fontSize={12} fill="var(--ink-muted)">
          source
        </text>
      </g>

      {/* Air-particle strip. */}
      <rect x={24} y={STRIP.y} width={W - 44} height={STRIP.h} fill="var(--surface-sunken)" rx={8} />
      {particles.map((p, i) => (
        <circle key={i} cx={sx(p.position)} cy={STRIP.y + STRIP.h / 2} r={3.2} fill="var(--accent-violet-ink)" />
      ))}

      {compressionXs.map((x) => (
        <g key={`c${x}`} data-testid="label-compression">
          <line x1={sx(x)} x2={sx(x)} y1={STRIP.y - 6} y2={STRIP.y + STRIP.h + 6} stroke="var(--accent-cyan-ink)" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={sx(x)} y={STRIP.y - 10} fontSize={12} textAnchor="middle" fill="var(--ink-strong)">
            compression
          </text>
        </g>
      ))}
      {rarefactionXs.map((x) => (
        <g key={`r${x}`} data-testid="label-rarefaction">
          <line x1={sx(x)} x2={sx(x)} y1={STRIP.y - 6} y2={STRIP.y + STRIP.h + 6} stroke="var(--ink-muted)" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={sx(x)} y={STRIP.y + STRIP.h + 32} fontSize={12} textAnchor="middle" fill="var(--ink-strong)">
            rarefaction
          </text>
        </g>
      ))}

      {/* Pressure-vs-position curve. */}
      <text x={20} y={CURVE.y0 - CURVE.amp - 14} fontSize={13} fontWeight={600} fill="var(--ink-strong)">
        Pressure vs position
      </text>
      <line x1={30} x2={W - 30} y1={CURVE.y0} y2={CURVE.y0} stroke="var(--ink-muted)" strokeDasharray="6 5" />
      <text x={W - 26} y={CURVE.y0 - 6} fontSize={11} fill="var(--ink-muted)" textAnchor="end">
        rest pressure
      </text>
      <path d={path} fill="none" stroke="var(--accent-cyan-ink)" strokeWidth={2.5} />
      <text x={sx(0) + 4} y={py(1) - 6} fontSize={11} fill="var(--ink-strong)">
        high (compression)
      </text>
      <text x={sx(lambda / 2) + 4} y={py(-1) + 16} fontSize={11} fill="var(--ink-strong)">
        low (rarefaction)
      </text>
    </svg>
  );
}
