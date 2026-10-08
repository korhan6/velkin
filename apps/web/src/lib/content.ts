import 'server-only';
import { cache } from 'react';
import { seed } from './seed';
import { galleryFor, photo, slugify } from './photos';
import type {
  Certification,
  ClientLogo,
  HeroMedia,
  Industry,
  Post,
  Project,
  Resource,
  Service,
  Stats,
  TeamMember,
  Testimonial,
} from './types';

const API = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || '';

/** True when the site is rendering built-in demo content (no API configured). */
export const usingSeed = !API;

/** CMS fetch with ISR (5 min) + on-demand revalidation through the `cms` tag. Falls back to seed data. */
async function api<T>(path: string, locale: string): Promise<T | null> {
  if (!API) return null;
  const sep = path.includes('?') ? '&' : '?';
  try {
    const res = await fetch(`${API}/v1/public/${path}${sep}locale=${locale}`, {
      next: { revalidate: 300, tags: ['cms'] },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const list = <T,>(path: string, fallback: (l: string) => T[]) =>
  cache(async (locale: string): Promise<T[]> => (await api<T[]>(path, locale)) ?? fallback(locale));

// Local photos (public/photos) fill any slot the CMS left empty
const withPhotos =
  <T,>(fn: (locale: string) => Promise<T[]>, fill: (x: T, i: number) => T) =>
  cache(async (locale: string) => (await fn(locale)).map(fill));

export const getServices = withPhotos(list<Service>('services', seed.services), (s) => ({ ...s, image: s.image || photo(`services/${s.slug}`) }));
export const getIndustries = withPhotos(list<Industry>('industries', seed.industries), (s) => ({ ...s, image: s.image || photo(`industries/${s.slug}`) }));
export const getProjects = withPhotos(list<Project>('projects', seed.projects), (p) => ({
  ...p,
  heroImage: p.heroImage || photo(`projects/${p.slug}`),
  gallery: p.gallery?.length ? p.gallery : galleryFor(p.slug),
}));
export const getPosts = withPhotos(list<Post>('posts', seed.posts), (p) => ({ ...p, coverImage: p.coverImage || photo(`resources/${p.slug}`) }));
export const getTeam = withPhotos(list<TeamMember>('team', seed.team), (m, i) => ({ ...m, photo: m.photo || photo(`team/${slugify(m.name)}`) || photo(`team/${i + 1}`) }));
export const getResources = list<Resource>('resources', () => []);
export const getTestimonials = list<Testimonial>('testimonials', () => []);
export const getCertifications = list<Certification>('certifications', () => []);
export const getClients = list<ClientLogo>('clients', () => []);

export const getService = cache(async (l: string, slug: string) => (await getServices(l)).find((x) => x.slug === slug) ?? null);
export const getIndustry = cache(async (l: string, slug: string) => (await getIndustries(l)).find((x) => x.slug === slug) ?? null);
export const getProject = cache(async (l: string, slug: string) => (await getProjects(l)).find((x) => x.slug === slug) ?? null);
export const getPost = cache(async (l: string, slug: string) => (await getPosts(l)).find((x) => x.slug === slug) ?? null);

export const getStats = cache(
  async (locale: string): Promise<Stats> => (await api<Stats>('stats', locale)) ?? { projects: 0, countries: 0, years: 0, robots: 0 },
);
export const getHeroMedia = cache(async (locale: string): Promise<HeroMedia> => {
  const m = (await api<HeroMedia>('hero', locale)) ?? {};
  return { poster: m.poster || photo('hero'), mp4: m.mp4 || photo('hero.mp4'), webm: m.webm || photo('hero.webm') };
});

/** Facilities photos on the About page: about/taller, about/electronica, about/motores */
export const getFacilityPhotos = () => [photo('about/taller'), photo('about/electronica'), photo('about/motores')];
