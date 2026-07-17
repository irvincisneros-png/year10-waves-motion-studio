import type { ReactNode } from 'react';

/**
 * Renders content that is available to assistive technology but hidden
 * visually. Use for labels, status text, and context that sighted users
 * infer from layout.
 */
export function VisuallyHidden({
  children,
  as: Tag = 'span',
}: {
  children: ReactNode;
  as?: 'span' | 'div';
}) {
  return <Tag className="u-visually-hidden">{children}</Tag>;
}
