import './SkipLink.css';

/**
 * Skip link — the first focusable element on the page. Visually hidden until
 * focused, then jumps focus to the main landmark.
 *
 * The click is handled in JS rather than relying on fragment navigation:
 * the app uses a hash router, so letting the browser rewrite the hash to
 * `#main-content` would be treated as a route change (and WebKit does not
 * move focus on fragment navigation anyway).
 */
export function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a
      className="skip-link"
      href={`#${targetId}`}
      onClick={(e) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
          target.focus();
          target.scrollIntoView({ block: 'start' });
        }
      }}
    >
      Skip to main content
    </a>
  );
}
