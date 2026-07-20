import './WaveEquation.css';

/**
 * The wave equation v = fλ as MathML with a visual text fallback
 * (IMPLEMENTATION_PLAN §1: "MathML with visual fallback"). Browsers that
 * implement MathML Core expose the `MathMLElement` interface; where it is
 * absent the plain-text form renders instead — same content, no blank space.
 * The conceptual meaning is always shown beside the symbols — never a bare
 * triangle mnemonic (SCIENCE_REVIEW §2.2).
 */

const mathMlSupported =
  typeof window !== 'undefined' && typeof window.MathMLElement !== 'undefined';

export function WaveEquation({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`wave-equation${compact ? ' wave-equation--compact' : ''}`} data-teacher-layer="equations">
      {mathMlSupported ? (
        <math display="inline" aria-label="v equals f times lambda">
          <mrow>
            <mi>v</mi>
            <mo>=</mo>
            <mi>f</mi>
            <mo>&#x2062;</mo>
            <mi>λ</mi>
          </mrow>
        </math>
      ) : (
        <span className="wave-equation__fallback">v = f × λ</span>
      )}
      {!compact ? (
        <p className="wave-equation__meaning">
          speed = <strong>how many waves pass each second</strong> (frequency,
          Hz) × <strong>how long each wave is</strong> (wavelength, m). The
          rearrangements λ = v/f and f = v/λ say the same thing.
        </p>
      ) : null}
    </div>
  );
}
