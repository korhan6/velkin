import type { SVGProps } from 'react';

/**
 * Isotipo "V": two articulated links pivoting on a circular joint.
 * Colors follow `currentColor` for the links; the pivot ring uses --accent and the cutout uses --bg,
 * so the mark works on light and dark sections. `articulate` plays one discreet joint movement (CSS: .vk-articulate).
 */
export const LINK_ANGLE = 24;
const PX = 32;
const PY = 52;

export function LogoMark({
  title = 'Velkin',
  className,
  articulate = false,
  ...rest
}: SVGProps<SVGSVGElement> & { articulate?: boolean; title?: string }) {
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const };
  const link = (side: -1 | 1) => (
    <g
      className={articulate ? (side < 0 ? 'vk-link-l' : 'vk-link-r') : undefined}
      style={{ transformOrigin: `${PX}px ${PY}px`, transform: `rotate(${side * LINK_ANGLE}deg)` }}
    >
      <rect x="27.5" y="6" width="9" height="50" rx="4.5" fill="currentColor" />
    </g>
  );
  return (
    <svg viewBox="0 0 64 64" className={className} {...a11y} {...rest}>
      {link(-1)}
      {link(1)}
      <circle cx={PX} cy={PY} r="6.5" fill="var(--logo-cutout, rgb(var(--bg, 250 250 248)))" />
      <circle cx={PX} cy={PY} r="4.4" fill="none" stroke="rgb(var(--accent, 31 63 166))" strokeWidth="2.4" />
    </svg>
  );
}

/** Wordmark VELKIN — geometric caps; the "E" has no vertical stem (three floating bars). */
export const WORDMARK_LETTERS: { char: string; d: string }[] = [
  { char: 'V', d: 'M0 0 L15 40 L30 0' },
  { char: 'E', d: 'M44 0 H72 M44 20 H68 M44 40 H72' },
  { char: 'L', d: 'M86 0 V40 H112' },
  { char: 'K', d: 'M126 0 V40 M154 0 L130 22 M136 17 L154 40' },
  { char: 'I', d: 'M168 0 V40' },
  { char: 'N', d: 'M182 40 V0 L212 40 V0' },
];

export function Wordmark({ className, title = 'VELKIN', ...rest }: SVGProps<SVGSVGElement> & { title?: string }) {
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const };
  return (
    <svg viewBox="-4 -4 222 48" className={className} {...a11y} {...rest}>
      <g fill="none" stroke="currentColor" strokeWidth="5.2" strokeLinecap="square" strokeLinejoin="miter">
        {WORDMARK_LETTERS.map((l, i) => (
          <path key={l.char + i} d={l.d} />
        ))}
      </g>
    </svg>
  );
}
