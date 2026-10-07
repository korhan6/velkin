import { z } from 'zod';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'kebab-case slug').max(80);
const url = z.string().url().max(1000);
const localeKey = z.string().regex(/^[a-z]{2}(-[a-z]{2})?$/);

/** translations: { en: {...complete}, es: {...partial}, ... } — English is the fallback and must be complete. */
function translations<T extends z.ZodRawShape>(shape: T) {
  const full = z.object(shape);
  return z
    .record(localeKey, full.partial())
    .refine((v) => full.safeParse(v.en).success, { message: 'English (en) translation is required and complete' });
}

const metric = z.object({ value: z.string().max(24), label: z.string().max(80) });

export const ProjectSchema = z.object({
  slug,
  client: z.string().max(120).nullable().optional(),
  industry: z.string().max(40),
  type: z.string().max(40),
  region: z.enum(['AF', 'AS', 'EU', 'NA', 'SA', 'OC', 'AN']),
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  year: z.number().int().min(1990).max(2100).nullable().optional(),
  specs: z.array(z.object({ label: z.string().max(40), value: z.string().max(120) })).max(12).default([]),
  services: z.array(slug).max(10).default([]),
  heroImage: url.nullable().optional(),
  videoUrl: url.nullable().optional(),
  gallery: z.array(url).max(24).default([]),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  translations: translations({
    title: z.string().min(2).max(160),
    summary: z.string().min(2).max(400),
    problem: z.string().max(4000),
    solution: z.string().max(4000),
    results: z.string().max(4000),
    metrics: z.array(metric).max(4),
  }),
});

export const ServiceSchema = z.object({
  slug,
  code: z.string().max(12),
  image: url.nullable().optional(),
  technologies: z.array(z.string().max(40)).max(20).default([]),
  sortOrder: z.number().int().default(0),
  published: z.boolean().default(true),
  translations: translations({
    title: z.string().min(2).max(120),
    summary: z.string().max(400),
    body: z.string().max(20000),
    capabilities: z.array(z.string().max(120)).max(20),
    deliverables: z.array(z.string().max(120)).max(20),
  }),
});

export const IndustrySchema = z.object({
  slug,
  icon: z.enum(['factory', 'boxes', 'bolt', 'cross', 'spark', 'book', 'shield', 'rocket', 'globe']).default('factory'),
  image: url.nullable().optional(),
  sortOrder: z.number().int().default(0),
  published: z.boolean().default(true),
  translations: translations({
    title: z.string().min(2).max(120),
    summary: z.string().max(300),
    body: z.string().max(4000),
    problems: z.array(z.string().max(160)).max(10),
    solutions: z.array(z.string().max(160)).max(10),
  }),
});

export const ResourceSchema = z.object({
  slug,
  kind: z.enum(['whitepaper', 'datasheet']).default('whitepaper'),
  gated: z.boolean().default(true),
  coverImage: url.nullable().optional(),
  pages: z.number().int().min(1).max(500).nullable().optional(),
  sortOrder: z.number().int().default(0),
  published: z.boolean().default(false),
  translations: translations({ title: z.string().min(2).max(200), summary: z.string().max(400), fileUrl: url }),
});

export const PostSchema = z.object({
  slug,
  coverImage: url.nullable().optional(),
  tags: z.array(z.string().max(30)).max(10).default([]),
  authorName: z.string().max(120).nullable().optional(),
  readingMinutes: z.number().int().min(1).max(120).default(5),
  publishedAt: z.string().datetime().nullable().optional(),
  published: z.boolean().default(false),
  translations: translations({ title: z.string().min(2).max(200), excerpt: z.string().max(400), body: z.string().max(100000) }),
});

export const TestimonialSchema = z.object({
  authorName: z.string().min(2).max(120),
  company: z.string().min(1).max(120),
  photo: url.nullable().optional(),
  projectSlug: slug.nullable().optional(),
  sortOrder: z.number().int().default(0),
  published: z.boolean().default(false),
  translations: translations({ quote: z.string().min(10).max(800), authorRole: z.string().max(120) }),
});

export const CertificationSchema = z.object({
  name: z.string().min(2).max(120),
  issuer: z.string().min(2).max(120),
  code: z.string().max(60).nullable().optional(),
  logoUrl: url.nullable().optional(),
  certificateUrl: url.nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  sortOrder: z.number().int().default(0),
  published: z.boolean().default(true),
});

export const TeamSchema = z.object({
  name: z.string().min(2).max(120),
  photo: url.nullable().optional(),
  linkedin: url.nullable().optional(),
  sortOrder: z.number().int().default(0),
  published: z.boolean().default(true),
  translations: translations({ role: z.string().max(120), bio: z.string().max(1000) }),
});

export const ClientSchema = z.object({
  name: z.string().min(1).max(120),
  logoUrl: url,
  url: url.nullable().optional(),
  sortOrder: z.number().int().default(0),
  published: z.boolean().default(true),
});

export const SETTINGS = {
  stats: z.object({ projects: z.number().int().min(0), countries: z.number().int().min(0), years: z.number().int().min(0), robots: z.number().int().min(0) }),
  hero: z.object({ poster: url.nullable().optional(), mp4: url.nullable().optional(), webm: url.nullable().optional() }),
} as const;

export const RESOURCES = {
  projects: { model: 'project', schema: ProjectSchema, order: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] },
  services: { model: 'service', schema: ServiceSchema, order: [{ sortOrder: 'asc' }] },
  industries: { model: 'industry', schema: IndustrySchema, order: [{ sortOrder: 'asc' }] },
  resources: { model: 'resource', schema: ResourceSchema, order: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] },
  posts: { model: 'post', schema: PostSchema, order: [{ publishedAt: 'desc' }] },
  testimonials: { model: 'testimonial', schema: TestimonialSchema, order: [{ sortOrder: 'asc' }] },
  certifications: { model: 'certification', schema: CertificationSchema, order: [{ sortOrder: 'asc' }] },
  team: { model: 'teamMember', schema: TeamSchema, order: [{ sortOrder: 'asc' }] },
  clients: { model: 'clientLogo', schema: ClientSchema, order: [{ sortOrder: 'asc' }] },
} as const;

export type ResourceName = keyof typeof RESOURCES;
export const isResource = (r: string): r is ResourceName => r in RESOURCES;

export const DownloadSchema = z.object({
  email: z.string().email().max(200).optional(),
  name: z.string().max(120).optional(),
  company: z.string().max(160).optional(),
  consent: z.boolean().default(false),
  locale: z.string().regex(/^[a-z]{2}(-[A-Za-z]{2})?$/).default('en'),
});
