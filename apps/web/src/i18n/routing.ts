import { defineRouting } from 'next-intl/routing';

/**
 * Adding a language = add its code here + a messages/<code>.json file (+ translations in the CMS).
 * RTL scripts are handled automatically through `dir` and logical CSS properties (ps/pe, ms/me, start/end).
 */
export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always',
  localeDetection: true,
});

export const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur']);

export const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  de: 'Deutsch',
  zh: '中文',
  ar: 'العربية',
};

export const isRtl = (locale: string) => RTL_LOCALES.has(locale);
