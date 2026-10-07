/**
 * Seeds: first admin user (from env) + initial services/projects/posts (from seed-data.json, generated from the web seed).
 * Idempotent: upserts by slug/email. Run: pnpm --filter @velkin/api build && pnpm --filter @velkin/api seed
 * ⚠️ Projects in seed-data.json are DEMO placeholders — replace or unpublish them from the admin before launch.
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const prisma = new PrismaClient();

type SeedData = {
  services: { slug: string; code: string; technologies: string[]; translations: Prisma.InputJsonValue }[];
  industries: { slug: string; icon: string; translations: Prisma.InputJsonValue }[];
  projects: (Record<string, unknown> & { slug: string; translations: Prisma.InputJsonValue })[];
  posts: { slug: string; tags: string[]; publishedAt: string; authorName: string; readingMinutes: number; translations: Prisma.InputJsonValue }[];
};

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    if (password.length < 12) throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters');
    await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      create: { email: email.toLowerCase(), name: 'Admin', role: 'ADMIN', passwordHash: await bcrypt.hash(password, 12) },
      update: {},
    });
    console.log(`✓ admin ${email}`);
  }

  const file = [join(__dirname, 'seed-data.json'), join(__dirname, '../../prisma/seed-data.json')].find((p) => {
    try {
      readFileSync(p);
      return true;
    } catch {
      return false;
    }
  });
  if (!file) return console.log('No seed-data.json found; skipping content.');
  const data = JSON.parse(readFileSync(file, 'utf8')) as SeedData;

  for (const [i, s] of data.services.entries()) {
    await prisma.service.upsert({ where: { slug: s.slug }, create: { ...s, sortOrder: i }, update: {} });
  }
  for (const [i, ind] of (data.industries ?? []).entries()) {
    await prisma.industry.upsert({ where: { slug: ind.slug }, create: { ...ind, sortOrder: i }, update: {} });
  }
  for (const [i, p] of data.projects.entries()) {
    const { slug, translations, ...rest } = p;
    await prisma.project.upsert({
      where: { slug },
      create: { slug, translations, sortOrder: i, published: true, ...(rest as Omit<Prisma.ProjectCreateInput, 'slug' | 'translations'>) },
      update: {},
    });
  }
  for (const p of data.posts) {
    await prisma.post.upsert({ where: { slug: p.slug }, create: { ...p, publishedAt: new Date(p.publishedAt), published: true }, update: {} });
  }
  console.log(`✓ ${data.services.length} services, ${data.industries?.length ?? 0} industries, ${data.projects.length} projects, ${data.posts.length} posts`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
