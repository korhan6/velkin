import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getIndustries, getPosts, getProjects, getServices } from '@/lib/content';
import { SITE_URL } from '@/lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const def = routing.defaultLocale;
  const [services, industries, projects, posts] = await Promise.all([getServices(def), getIndustries(def), getProjects(def), getPosts(def)]);
  const paths: { p: string; priority: number; date?: string }[] = [
    { p: '', priority: 1 },
    { p: '/services', priority: 0.9 },
    { p: '/industries', priority: 0.8 },
    { p: '/projects', priority: 0.9 },
    { p: '/about', priority: 0.7 },
    { p: '/resources', priority: 0.7 },
    { p: '/contact', priority: 0.8 },
    { p: '/legal/privacy', priority: 0.2 },
    { p: '/legal/terms', priority: 0.2 },
    ...services.map((s) => ({ p: `/services/${s.slug}`, priority: 0.8 })),
    ...industries.map((s) => ({ p: `/industries/${s.slug}`, priority: 0.7 })),
    ...projects.map((x) => ({ p: `/projects/${x.slug}`, priority: 0.7 })),
    ...posts.map((x) => ({ p: `/resources/${x.slug}`, priority: 0.6, date: x.publishedAt })),
  ];
  return paths.flatMap(({ p, priority, date }) =>
    routing.locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${p}`,
      lastModified: date ? new Date(date) : new Date(),
      priority,
      alternates: {
        languages: Object.fromEntries([...routing.locales.map((l) => [l, `${SITE_URL}/${l}${p}`]), ['x-default', `${SITE_URL}/${def}${p}`]]),
      },
    })),
  );
}
