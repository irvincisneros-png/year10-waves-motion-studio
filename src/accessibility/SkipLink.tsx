import './SkipLink.css';

/**
 * Skip link — the first focusable element on the page. Visually hidden until
 * focused, then jumps focus to the main landmark.
 */
export function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a className="skip-link" href={`#${targetId}`}>
      Skip to main content
    </a>
  );
}
