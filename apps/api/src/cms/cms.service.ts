import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { pickTranslation } from '../common/locale';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { env } from '../config/env';
import { RESOURCES, SETTINGS, type ResourceName } from './cms.schemas';

const TTL = 300;
type AnyDelegate = {
  findMany: (args?: unknown) => Promise<Record<string, unknown>[]>;
  findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
  create: (args: unknown) => Promise<Record<string, unknown>>;
  update: (args: unknown) => Promise<Record<string, unknown>>;
  delete: (args: unknown) => Promise<unknown>;
};

@Injectable()
export class CmsService {
  private readonly log = new Logger('CMS');
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  private delegate(r: ResourceName): AnyDelegate {
    return (this.prisma as unknown as Record<string, AnyDelegate>)[RESOURCES[r].model];
  }

  /* ───────── Public, localized, cached ───────── */

  services(locale: string) {
    return this.redis.wrap(`cms:services:${locale}`, TTL, async () => {
      const rows = await this.prisma.service.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } });
      return rows.map((s) => ({ slug: s.slug, code: s.code, image: s.image, technologies: s.technologies, ...pickTranslation(s.translations, locale) }));
    });
  }

  industries(locale: string) {
    return this.redis.wrap(`cms:industries:${locale}`, TTL, async () => {
      const rows = await this.prisma.industry.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } });
      return rows.map((s) => ({ slug: s.slug, icon: s.icon, image: s.image, ...pickTranslation(s.translations, locale) }));
    });
  }

  projects(locale: string) {
    return this.redis.wrap(`cms:projects:${locale}`, TTL, async () => {
      const rows = await this.prisma.project.findMany({ where: { published: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
      return rows.map(({ translations, id: _id, published: _p, createdAt: _c, sortOrder: _s, ...rest }) => ({
        metrics: [],
        ...rest,
        ...pickTranslation(translations, locale),
      }));
    });
  }

  posts(locale: string) {
    return this.redis.wrap(`cms:posts:${locale}`, TTL, async () => {
      const rows = await this.prisma.post.findMany({ where: { published: true, publishedAt: { lte: new Date() } }, orderBy: { publishedAt: 'desc' } });
      return rows.map((p) => ({
        slug: p.slug,
        coverImage: p.coverImage,
        tags: p.tags,
        authorName: p.authorName,
        readingMinutes: p.readingMinutes,
        publishedAt: p.publishedAt?.toISOString(),
        ...pickTranslation(p.translations, locale),
      }));
    });
  }

  /** File URLs are never listed publicly — they are returned by `download()` so every download is recorded. */
  resources(locale: string) {
    return this.redis.wrap(`cms:resources:${locale}`, TTL, async () => {
      const rows = await this.prisma.resource.findMany({ where: { published: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
      return rows.map((r) => {
        const { fileUrl: _f, ...t } = pickTranslation<{ fileUrl?: string; title: string; summary: string }>(r.translations, locale);
        return { slug: r.slug, kind: r.kind, gated: r.gated, coverImage: r.coverImage, pages: r.pages, ...t };
      });
    });
  }

  async download(slug: string, body: { email?: string; name?: string; company?: string; consent: boolean; locale: string }, country: string | null) {
    const r = await this.prisma.resource.findFirst({ where: { slug, published: true } });
    if (!r) throw new NotFoundException();
    const { fileUrl } = pickTranslation<{ fileUrl?: string }>(r.translations, body.locale);
    if (!fileUrl) throw new NotFoundException();
    const withContact = !!body.email && body.consent;
    await this.prisma.resourceDownload.create({
      data: {
        resourceId: r.id,
        locale: body.locale,
        country,
        consent: withContact,
        // Contact data is stored only with explicit consent
        email: withContact ? body.email!.toLowerCase().trim() : null,
        name: withContact ? body.name?.trim() || null : null,
        company: withContact ? body.company?.trim() || null : null,
      },
    });
    return { url: fileUrl };
  }

  testimonials(locale: string) {
    return this.redis.wrap(`cms:testimonials:${locale}`, TTL, async () => {
      const rows = await this.prisma.testimonial.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } });
      return rows.map((q) => ({ authorName: q.authorName, company: q.company, photo: q.photo, projectSlug: q.projectSlug, ...pickTranslation(q.translations, locale) }));
    });
  }

  certifications() {
    return this.redis.wrap('cms:certifications', TTL, async () => {
      const rows = await this.prisma.certification.findMany({
        where: { published: true, OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }] },
        orderBy: { sortOrder: 'asc' },
      });
      return rows.map(({ id: _i, published: _p, sortOrder: _s, createdAt: _c, updatedAt: _u, validUntil, ...c }) => ({ ...c, validUntil: validUntil?.toISOString() ?? null }));
    });
  }

  team(locale: string) {
    return this.redis.wrap(`cms:team:${locale}`, TTL, async () => {
      const rows = await this.prisma.teamMember.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } });
      return rows.map((m) => ({ name: m.name, photo: m.photo, linkedin: m.linkedin, ...pickTranslation(m.translations, locale) }));
    });
  }

  clients() {
    return this.redis.wrap('cms:clients', TTL, () =>
      this.prisma.clientLogo.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' }, select: { name: true, logoUrl: true, url: true } }),
    );
  }

  async setting(key: keyof typeof SETTINGS) {
    return this.redis.wrap(`cms:setting:${key}`, TTL, async () => (await this.prisma.setting.findUnique({ where: { key } }))?.value ?? null);
  }

  /* ───────── Admin CRUD ───────── */

  list(r: ResourceName) {
    return this.delegate(r).findMany({ orderBy: RESOURCES[r].order });
  }

  async get(r: ResourceName, id: string) {
    const row = await this.delegate(r).findUnique({ where: { id } });
    if (!row) throw new NotFoundException();
    return row;
  }

  async create(r: ResourceName, body: unknown) {
    const row = await this.delegate(r).create({ data: this.parse(r, body, false) });
    await this.invalidate();
    return row;
  }

  async update(r: ResourceName, id: string, body: unknown) {
    const row = await this.delegate(r).update({ where: { id }, data: this.parse(r, body, true) });
    await this.invalidate();
    return row;
  }

  async remove(r: ResourceName, id: string) {
    await this.delegate(r).delete({ where: { id } });
    await this.invalidate();
  }

  downloads(take = 200) {
    return this.prisma.resourceDownload.findMany({ orderBy: { createdAt: 'desc' }, take, include: { resource: { select: { slug: true } } } });
  }

  async putSetting(key: string, value: unknown) {
    if (!(key in SETTINGS)) throw new NotFoundException();
    const parsed = SETTINGS[key as keyof typeof SETTINGS].safeParse(value);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues);
    const v = parsed.data as Prisma.InputJsonValue;
    await this.prisma.setting.upsert({ where: { key }, create: { key, value: v }, update: { value: v } });
    await this.invalidate();
    return { key, value: parsed.data };
  }

  private parse(r: ResourceName, body: unknown, partial: boolean) {
    const schema = RESOURCES[r].schema;
    const res = partial ? schema.partial().safeParse(body) : schema.safeParse(body);
    if (!res.success) throw new BadRequestException({ message: 'Validation failed', issues: res.error.issues });
    const data = { ...(res.data as Record<string, unknown>) };
    for (const k of ['publishedAt', 'validUntil']) if (typeof data[k] === 'string') data[k] = new Date(data[k] as string);
    return data;
  }

  /** Clears API cache and asks the website to revalidate its ISR pages. */
  private async invalidate() {
    await this.redis.delPattern('cms:*');
    const { WEB_REVALIDATE_URL: url, REVALIDATE_SECRET: secret } = env();
    if (!url || !secret) return;
    fetch(url, { method: 'POST', headers: { 'x-revalidate-secret': secret }, signal: AbortSignal.timeout(5000) }).catch((e) =>
      this.log.warn(`Web revalidation failed: ${String(e)}`),
    );
  }
}
