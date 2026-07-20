import { useId } from 'react';
import type { FocusState } from '../../science/vision';

interface Props {
  pupilOpeningPercent: number;
  imageScale: number;
  focus: FocusState;
}

export function EyeDiagram({ pupilOpeningPercent, imageScale, focus }: Props) {
  const titleId = useId();
  const pupilHalf = 5 + pupilOpeningPercent * 0.12;
  const lensWidth = 10 + Math.min(18, focus.idealAccommodationPercent * 0.18);
  const imageHeight = 18 + imageScale * 20;
  const description = `Eye teaching model. Relative pupil opening ${pupilOpeningPercent.toFixed(0)} percent. The optical image at the retina is inverted in the ray diagram. Focus state: ${focus.status}. Retina-to-optic-nerve signal path is labelled separately.`;
  return (
    <figure>
      <svg className="light-diagram" viewBox="0 0 700 360" role="img" aria-labelledby={titleId}>
        <title id={titleId}>{description}</title>
        <path className="eye-diagram__cornea" d="M100 180 C115 78 235 45 385 80 C505 108 570 144 590 180 C570 216 505 252 385 280 C235 315 115 282 100 180 Z" />
        <path className="eye-diagram__retina" d="M535 117 C575 145 590 166 590 180 C590 194 575 215 535 243" />
        <rect className="eye-diagram__iris" x="185" y={180 - pupilHalf - 25} width="10" height="25" rx="4" />
        <rect className="eye-diagram__iris" x="185" y={180 + pupilHalf} width="10" height="25" rx="4" />
        <ellipse className="eye-diagram__lens" cx="238" cy="180" rx={lensWidth} ry="68" />
        <path className="eye-diagram__ray" d={`M28 112 L190 ${180 - pupilHalf / 2} L565 ${180 + imageHeight / 2}`} />
        <path className="eye-diagram__ray" d={`M28 248 L190 ${180 + pupilHalf / 2} L565 ${180 - imageHeight / 2}`} />
        <path className="eye-diagram__signal" d="M575 180 C622 180 634 205 675 214" />
        <text x="14" y="104">object rays</text>
        <text x="112" y="65">cornea</text>
        <text x="171" y="330">iris / pupil</text>
        <text x="220" y="95">lens</text>
        <text x="512" y="92">retina / fovea</text>
        <text x="584" y="238">optic nerve → brain</text>
        <text x="388" y="330">vitreous humour</text>
      </svg>
      <figcaption>{description}</figcaption>
    </figure>
  );
}
