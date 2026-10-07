import type { ReactNode } from 'react';

/** Simple, fast crossfade between pages (200 ms). Disabled by prefers-reduced-motion in CSS. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-fade">{children}</div>;
}
