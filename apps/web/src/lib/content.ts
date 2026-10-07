import 'server-only';
import { cache } from 'react';
import { seed } from './seed';
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

export const getServices = list<Service>('services', seed.services);
export const getIndustries = list<Industry>('industries', seed.industries);
export const getProjects = list<Project>('projects', seed.projects);
export const getPosts = list<Post>('posts', seed.posts);
export const getTeam = list<TeamMember>('team', seed.team);
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
export const getHeroMedia = cache(async (locale: string): Promise<HeroMedia> => (await api<HeroMedia>('hero', locale)) ?? {});
