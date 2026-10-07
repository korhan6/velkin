export type Spec = { label: string; value: string };
export type Metric = { value: string; label: string };

export type Service = {
  slug: string;
  code: string;
  image?: string | null;
  title: string;
  summary: string;
  body: string;
  capabilities: string[];
  deliverables: string[];
  technologies: string[];
};

export type Industry = {
  slug: string;
  icon: string;
  image?: string | null;
  title: string;
  summary: string;
  body: string;
  problems: string[];
  solutions: string[];
};

export type Project = {
  slug: string;
  client?: string | null;
  title: string;
  summary: string;
  problem: string;
  solution: string;
  results: string;
  metrics: Metric[];
  industry: string;
  type: string;
  region: string;
  countryCode: string;
  year?: number | null;
  specs: Spec[];
  heroImage?: string | null;
  videoUrl?: string | null;
  gallery: string[];
  featured: boolean;
  services: string[];
};

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImage?: string | null;
  tags: string[];
  publishedAt: string;
  authorName?: string | null;
  readingMinutes: number;
};

export type Resource = {
  slug: string;
  kind: 'whitepaper' | 'datasheet';
  gated: boolean;
  coverImage?: string | null;
  pages?: number | null;
  title: string;
  summary: string;
};

export type Testimonial = {
  quote: string;
  authorName: string;
  authorRole: string;
  company: string;
  photo?: string | null;
  projectSlug?: string | null;
};

export type Certification = {
  name: string;
  issuer: string;
  code?: string | null;
  logoUrl?: string | null;
  certificateUrl?: string | null;
  validUntil?: string | null;
};

export type TeamMember = { name: string; role: string; bio: string; photo?: string | null; linkedin?: string | null };
export type ClientLogo = { name: string; logoUrl: string; url?: string | null };
export type Stats = { projects: number; countries: number; years: number; robots: number };
export type HeroMedia = { poster?: string | null; mp4?: string | null; webm?: string | null };
