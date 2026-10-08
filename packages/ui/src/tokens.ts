/**
 * Velkine design tokens — corporate light theme. Single source of truth for web + admin.
 * Contrasts (WCAG 2.2) measured on bg #FAFAF8:
 *   ink 18:1 · ink2 10.4:1 · ink3 5.1:1 · accent 8.7:1 (white on accent 9:1)
 * Accent: Azul industrial profundo. Alternative kept for reference: naranja quemado #B4410F.
 */
export const palette = {
  bg: '#FAFAF8',
  surface: '#FFFFFF',
  ink: '#111111',
  ink2: '#3D3D3A',
  ink3: '#6B6B66',
  line: '#E6E5E1',
  line2: '#D4D3CE',
  placeholder: '#ECEBE7',
  graphite: '#141414',
  graphite2: '#1E1E1D',
  onGraphite: '#EDEDEA',
  onGraphite2: '#9A9A95',
  accent: '#1F3FA6',
  accentHover: '#18338A',
  accentOnDark: '#8FA6FF',
} as const;

export const ALT_ACCENT = '#B4410F';

export const motion = {
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
  easeArray: [0.22, 1, 0.36, 1] as const,
  reveal: { distance: 12, duration: 500, stagger: 60 },
  pageFade: 200,
};
