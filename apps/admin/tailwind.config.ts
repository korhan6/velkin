import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0A0A0A', 2: '#111111' },
        bone: '#EDEAE3',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        graphite: { 200: '#BDBDBA', 300: '#8F8F8B', 400: '#80807C', 500: '#4A4A47', 700: '#1F1F1E' },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
} satisfies Config;
