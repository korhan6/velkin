import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true },
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        ink: { DEFAULT: v('ink'), 2: v('ink-2'), 3: v('ink-3') },
        line: { DEFAULT: v('line'), 2: v('line-2') },
        placeholder: v('placeholder'),
        graphite: { DEFAULT: v('graphite'), 2: v('graphite-2') },
        'on-graphite': { DEFAULT: v('on-graphite'), 2: v('on-graphite-2') },
        accent: { DEFAULT: v('accent'), hover: v('accent-hover'), dark: v('accent-on-dark') },
      },
      fontFamily: {
        // Inter (opsz axis) renders as "Inter Display" automatically at large sizes.
        sans: ['"Inter Variable"', '"Inter Fallback"', '"Noto Sans Arabic"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(2.75rem, 6.2vw, 6rem)', { lineHeight: '1.02', letterSpacing: '-0.025em', fontWeight: '600' }],
        'display-lg': ['clamp(2.25rem, 4.4vw, 4.25rem)', { lineHeight: '1.05', letterSpacing: '-0.022em', fontWeight: '600' }],
        'display-md': ['clamp(1.75rem, 3vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-sm': ['clamp(1.375rem, 2vw, 1.75rem)', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '600' }],
        body: ['1.0625rem', { lineHeight: '1.6' }],
        lead: ['clamp(1.125rem, 1.4vw, 1.3125rem)', { lineHeight: '1.55' }],
      },
      maxWidth: { frame: '1360px', prose: '68ch' },
      transitionTimingFunction: { precise: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    },
  },
  plugins: [],
};
export default config;
