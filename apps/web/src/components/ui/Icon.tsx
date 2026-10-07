import type { SVGProps } from 'react';

/** One thin-line icon set (24px grid, 1.5 stroke, round joins). */
const PATHS: Record<string, string> = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  arrowDown: 'M12 5v14M6 13l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  close: 'M6 6l12 12M18 6L6 18',
  menu: 'M4 7h16M4 12h16M4 17h16',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  phone: 'M7 3h3l1.5 5-2 1.5a12 12 0 0 0 5 5l1.5-2 5 1.5v3a2 2 0 0 1-2 2A17 17 0 0 1 5 5a2 2 0 0 1 2-2z',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z',
  file: 'M7 3h7l5 5v13H7zM14 3v5h5',
  play: 'M8 5v14l11-7z',
  quote: 'M7 17c-1.7 0-3-1.3-3-3V11c0-2.8 1.8-5 4.5-6M16 17c-1.7 0-3-1.3-3-3V11c0-2.8 1.8-5 4.5-6',
  factory: 'M3 21V10l5 3V10l5 3V10l5 3V4h3v17zM7 17h2M12 17h2M17 17h2',
  boxes: 'M3 13h8v8H3zM13 13h8v8h-8zM8 3h8v8H8z',
  bolt: 'M13 3L5 14h6l-1 7 8-11h-6z',
  cross: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z',
  rocket: 'M5 15c-1.5 1.5-2 4-2 6 2 0 4.5-.5 6-2M9 15l-3-3 2-4h5c2-3 5-5 8-5 0 3-2 6-5 8v5l-4 2zM15 9h.01',
  linkedin: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 10.5V17M8 7.25v.01M12 17v-6.5M12 13.5a2.75 2.75 0 0 1 5.5 0V17',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, className = '', ...rest }: { name: IconName | string; size?: number } & SVGProps<SVGSVGElement>) {
  const d = PATHS[name] ?? PATHS.plus;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}
