import { useRef, type ReactNode } from 'react';
import { usePageChrome } from '../app/usePageChrome';

/**
 * Standard route wrapper: renders the main heading (which receives focus on
 * client-side navigation), sets the document title, and announces the route
 * change politely.
 */
export function Page({
  title,
  heading,
  lead,
  children,
}: {
  /** Short name used in the document title + announcement. */
  title: string;
  /** Visible h1 (defaults to `title`). */
  heading?: ReactNode;
  lead?: ReactNode;
  children: ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  usePageChrome(title, headingRef);

  return (
    <div className="page">
      <h1 tabIndex={-1} ref={headingRef} className="page__heading">
        {heading ?? title}
      </h1>
      {lead ? <p className="page__lead">{lead}</p> : null}
      {children}
    </div>
  );
}
