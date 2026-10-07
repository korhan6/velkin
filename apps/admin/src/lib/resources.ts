/** Declarative editor config: adding a CMS field = one line here (+ the API zod schema). */
export type Field =
  | { key: string; label: string; type: 'text' | 'url' | 'textarea' | 'markdown'; required?: boolean }
  | { key: string; label: string; type: 'number'; step?: number }
  | { key: string; label: string; type: 'bool' }
  | { key: string; label: string; type: 'select'; options: string[] }
  | { key: string; label: string; type: 'list' } // string[]
  | { key: string; label: string; type: 'specs' } // {label,value}[]
  | { key: string; label: string; type: 'metrics' } // {value,label}[]
  | { key: string; label: string; type: 'image' } // single uploaded URL
  | { key: string; label: string; type: 'gallery' }; // uploaded URL[]

export type Resource = {
  name: string;
  label: string;
  titleOf: (row: Record<string, unknown>) => string;
  fields: Field[];
  translated: Field[];
};

const INDUSTRIES = ['manufacturing', 'logistics', 'energy', 'healthcare', 'events', 'education', 'government', 'startups'];
const ICONS = ['factory', 'boxes', 'bolt', 'cross', 'spark', 'book', 'shield', 'rocket', 'globe'];
const TYPES = ['humanoid', 'quadruped', 'arm', 'mobile', 'telepresence', 'cell', 'electronics'];
const REGIONS = ['AF', 'AS', 'EU', 'NA', 'SA', 'OC', 'AN'];
const t = (row: Record<string, unknown>, k = 'title') => String((row.translations as Record<string, Record<string, unknown>>)?.en?.[k] ?? '');

export const RESOURCES: Record<string, Resource> = {
  projects: {
    name: 'projects',
    label: 'Projects',
    titleOf: (r) => t(r) || String(r.slug),
    fields: [
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'industry', label: 'Industry', type: 'select', options: INDUSTRIES },
      { key: 'type', label: 'Type', type: 'select', options: TYPES },
      { key: 'region', label: 'Region', type: 'select', options: REGIONS },
      { key: 'countryCode', label: 'Country (ISO-2)', type: 'text', required: true },
      { key: 'client', label: 'Client name (empty = "Client under NDA")', type: 'text' },
      { key: 'year', label: 'Year', type: 'number' },
      { key: 'specs', label: 'Specs (DOF, torque, autonomy…)', type: 'specs' },
      { key: 'services', label: 'Service slugs', type: 'list' },
      { key: 'heroImage', label: 'Hero image', type: 'image' },
      { key: 'videoUrl', label: 'Loop video URL (MP4/WebM, < 4 MB)', type: 'url' },
      { key: 'gallery', label: 'Gallery', type: 'gallery' },
      { key: 'featured', label: 'Featured on home', type: 'bool' },
      { key: 'published', label: 'Published', type: 'bool' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
    ],
    translated: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'summary', label: 'Summary', type: 'textarea', required: true },
      { key: 'problem', label: 'Problem', type: 'textarea' },
      { key: 'solution', label: 'Solution', type: 'textarea' },
      { key: 'results', label: 'Results', type: 'textarea' },
      { key: 'metrics', label: 'Quantified results (value + label, e.g. "−38 %" / "cycle time")', type: 'metrics' },
    ],
  },
  services: {
    name: 'services',
    label: 'Services',
    titleOf: (r) => `${r.code} · ${t(r)}`,
    fields: [
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'image', label: 'Card photo (4:3)', type: 'image' },
      { key: 'technologies', label: 'Technologies', type: 'list' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'published', label: 'Published', type: 'bool' },
    ],
    translated: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'summary', label: 'Summary', type: 'textarea', required: true },
      { key: 'body', label: 'Body (Markdown)', type: 'markdown', required: true },
      { key: 'capabilities', label: 'Capabilities', type: 'list' },
      { key: 'deliverables', label: 'Deliverables', type: 'list' },
    ],
  },
  industries: {
    name: 'industries',
    label: 'Industries',
    titleOf: (r) => t(r) || String(r.slug),
    fields: [
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'icon', label: 'Icon', type: 'select', options: ICONS },
      { key: 'image', label: 'Photo (3:2)', type: 'image' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'published', label: 'Published', type: 'bool' },
    ],
    translated: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'summary', label: 'Summary', type: 'textarea', required: true },
      { key: 'body', label: 'Introduction', type: 'textarea', required: true },
      { key: 'problems', label: 'Typical problems', type: 'list' },
      { key: 'solutions', label: 'How we solve them', type: 'list' },
    ],
  },
  resources: {
    name: 'resources',
    label: 'White papers & datasheets',
    titleOf: (r) => `${r.kind === 'datasheet' ? 'Datasheet' : 'White paper'} · ${t(r)}`,
    fields: [
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'kind', label: 'Kind', type: 'select', options: ['whitepaper', 'datasheet'] },
      { key: 'gated', label: 'Offer optional email capture before download', type: 'bool' },
      { key: 'coverImage', label: 'Cover', type: 'image' },
      { key: 'pages', label: 'Pages', type: 'number' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'published', label: 'Published', type: 'bool' },
    ],
    translated: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'summary', label: 'Summary', type: 'textarea', required: true },
      { key: 'fileUrl', label: 'PDF for this language (upload or URL)', type: 'image' },
    ],
  },
  testimonials: {
    name: 'testimonials',
    label: 'Testimonials',
    titleOf: (r) => `${r.authorName} · ${r.company}`,
    fields: [
      { key: 'authorName', label: 'Name', type: 'text', required: true },
      { key: 'company', label: 'Company', type: 'text', required: true },
      { key: 'photo', label: 'Photo', type: 'image' },
      { key: 'projectSlug', label: 'Related case study (slug)', type: 'text' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'published', label: 'Published (only with written approval)', type: 'bool' },
    ],
    translated: [
      { key: 'quote', label: 'Quote', type: 'textarea', required: true },
      { key: 'authorRole', label: 'Job title', type: 'text', required: true },
    ],
  },
  certifications: {
    name: 'certifications',
    label: 'Certifications',
    titleOf: (r) => `${r.name} · ${r.issuer}`,
    fields: [
      { key: 'name', label: 'Name (e.g. ISO 9001:2015)', type: 'text', required: true },
      { key: 'issuer', label: 'Certification body', type: 'text', required: true },
      { key: 'code', label: 'Certificate number', type: 'text' },
      { key: 'logoUrl', label: 'Logo', type: 'image' },
      { key: 'certificateUrl', label: 'Certificate PDF / verification URL', type: 'url' },
      { key: 'validUntil', label: 'Valid until (UTC ISO, e.g. 2028-05-01T00:00:00Z)', type: 'text' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'published', label: 'Published', type: 'bool' },
    ],
    translated: [],
  },
  posts: {
    name: 'posts',
    label: 'Blog',
    titleOf: (r) => t(r) || String(r.slug),
    fields: [
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'coverImage', label: 'Cover', type: 'image' },
      { key: 'tags', label: 'Tags', type: 'list' },
      { key: 'authorName', label: 'Author', type: 'text' },
      { key: 'readingMinutes', label: 'Reading minutes', type: 'number' },
      { key: 'publishedAt', label: 'Publish at (UTC ISO)', type: 'text' },
      { key: 'published', label: 'Published', type: 'bool' },
    ],
    translated: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'excerpt', label: 'Excerpt', type: 'textarea', required: true },
      { key: 'body', label: 'Body (Markdown)', type: 'markdown', required: true },
    ],
  },
  team: {
    name: 'team',
    label: 'Team',
    titleOf: (r) => String(r.name),
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'photo', label: 'Photo', type: 'image' },
      { key: 'linkedin', label: 'LinkedIn URL', type: 'url' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'published', label: 'Published', type: 'bool' },
    ],
    translated: [
      { key: 'role', label: 'Role', type: 'text', required: true },
      { key: 'bio', label: 'Bio', type: 'textarea', required: true },
    ],
  },
  clients: {
    name: 'clients',
    label: 'Client logos',
    titleOf: (r) => String(r.name),
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'logoUrl', label: 'Logo (SVG, monochrome)', type: 'image' },
      { key: 'url', label: 'Website', type: 'url' },
      { key: 'sortOrder', label: 'Sort order', type: 'number' },
      { key: 'published', label: 'Published', type: 'bool' },
    ],
    translated: [],
  },
};
