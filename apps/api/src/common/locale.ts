export const DEFAULT_LOCALE = 'en';

/** Picks one locale from a `{ [locale]: {...} }` JSON blob, falling back field-by-field to English. */
export function pickTranslation<T extends Record<string, unknown>>(translations: unknown, locale: string, fallback = DEFAULT_LOCALE): T {
  const all = (translations ?? {}) as Record<string, Record<string, unknown>>;
  const base = all[fallback] ?? {};
  const wanted = all[locale] ?? all[locale.split('-')[0]] ?? {};
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(wanted)) {
    if (v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)) out[k] = v;
  }
  return out as T;
}

export function normalizeLocale(input: unknown): string {
  const s = typeof input === 'string' ? input.trim().toLowerCase() : '';
  return /^[a-z]{2}(-[a-z]{2})?$/.test(s) ? s : DEFAULT_LOCALE;
}
