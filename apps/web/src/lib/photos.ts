import manifest from './photos.generated.json';

/**
 * Local photos dropped in apps/web/public/photos (see public/photos/LEEME.md).
 * CMS images (admin) always win; these fill the empty slots.
 */
const M = manifest as Record<string, string>;

export const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const photo = (key: string): string | null => M[key.toLowerCase()] ?? null;

/** projects/<slug>-1 … projects/<slug>-12 */
export const galleryFor = (slug: string): string[] =>
  Array.from({ length: 12 }, (_, i) => photo(`projects/${slug}-${i + 1}`)).filter((x): x is string => !!x);
