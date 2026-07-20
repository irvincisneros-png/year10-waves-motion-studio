import { useId } from 'react';
import type { RefractionResult } from '../../science/optics';

interface Props {
  mode: 'reflection' | 'refraction';
  incidentAngleDeg: number;
  result?: RefractionResult;
  showNormal?: boolean;
  firstMedium?: string;
  secondMedium?: string;
}

export function RayDiagram({
  mode,
  incidentAngleDeg,
  result,
  showNormal = true,
  firstMedium = 'Air',
  secondMedium = 'Water',
}: Props) {
  const titleId = useId();
  const cx = 320;
  const cy = 170;
  const length = 150;
  const rad = (incidentAngleDeg * Math.PI) / 180;
  const incident = { x: cx - length * Math.sin(rad), y: cy - length * Math.cos(rad) };
  const reflected = { x: cx + length * Math.sin(rad), y: cy - length * Math.cos(rad) };
  const refractedRad = ((result?.refractedAngleDeg ?? 0) * Math.PI) / 180;
  const refracted = { x: cx + length * Math.sin(refractedRad), y: cy + length * Math.cos(refractedRad) };
  const description = mode === 'reflection'
    ? `Reflection ray diagram. Incident and reflected angles are both ${incidentAngleDeg.toFixed(0)} degrees from the normal.`
    : result?.totalInternalReflection
      ? `Total internal reflection from ${firstMedium} to ${secondMedium}. No refracted ray exists at ${incidentAngleDeg.toFixed(0)} degrees.`
      : `Refraction from ${firstMedium} to ${secondMedium}: incident ${incidentAngleDeg.toFixed(0)} degrees and refracted ${(result?.refractedAngleDeg ?? 0).toFixed(1)} degrees from the normal.`;

  return (
    <figure>
      <svg className="light-diagram" viewBox="0 0 640 340" role="img" aria-labelledby={titleId}>
        <title id={titleId}>{description}</title>
        <rect className="light-diagram__medium-a" width="640" height="170" />
        <rect className="light-diagram__medium-b" y="170" width="640" height="170" />
        <line className="light-diagram__boundary" x1="20" x2="620" y1={cy} y2={cy} />
        {showNormal ? <line className="light-diagram__normal" x1={cx} x2={cx} y1="15" y2="325" /> : null}
        <line className="light-diagram__incident" x1={incident.x} y1={incident.y} x2={cx} y2={cy} />
        <line className="light-diagram__reflected" x1={cx} y1={cy} x2={reflected.x} y2={reflected.y} />
        {mode === 'refraction' && result && !result.totalInternalReflection ? (
          <line className="light-diagram__refracted" x1={cx} y1={cy} x2={refracted.x} y2={refracted.y} />
        ) : null}
        <text x="24" y="30">{mode === 'reflection' ? 'Incident side' : firstMedium}</text>
        <text x="24" y="326">{mode === 'reflection' ? 'Mirror boundary' : secondMedium}</text>
        <text x={incident.x - 16} y={incident.y - 8}>incident ray</text>
        <text x={reflected.x - 38} y={reflected.y - 8}>reflected ray</text>
        {mode === 'refraction' && result && !result.totalInternalReflection ? <text x={refracted.x - 28} y={refracted.y + 20}>refracted ray</text> : null}
        {result?.totalInternalReflection ? <text x="345" y="205">TIR — no refracted ray</text> : null}
        {showNormal ? <text x="328" y="34">normal</text> : null}
      </svg>
      <figcaption>{description}</figcaption>
    </figure>
  );
}
