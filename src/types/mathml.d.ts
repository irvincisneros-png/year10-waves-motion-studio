/**
 * MathML Core intrinsic elements for JSX. React 19 renders MathML elements
 * natively; @types/react does not yet declare them, so the subset used by the
 * app (WaveEquation) is augmented here.
 */
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type MathMLProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      math: MathMLProps & { display?: 'block' | 'inline' };
      mrow: MathMLProps;
      mi: MathMLProps;
      mo: MathMLProps;
      mn: MathMLProps;
      mfrac: MathMLProps;
    }
  }
}
