import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type LeadStatus } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { continentOf } from '../common/geo';
import { normalizeLocale } from '../common/locale';
import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { S3Service } from '../storage/s3.service';
import type { CreateLeadDto, UpdateLeadDto } from './leads.dto';
import { TurnstileService } from './turnstile.service';

export function makeReference(now = new Date()) {
  const d = now.toISOString().slice(0, 10).replace(/-/g, '');
  const r = randomBytes(3).toString('hex').toUpperCase();
  return `VK-${d}-${r}`;
}

export function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly turnstile: TurnstileService,
    private readonly notify: NotificationsService,
  ) {}

  async create(dto: CreateLeadDto, ctx: { ip: string; ipCountry: string | null }) {
    if (dto.website) throw new BadRequestException('Invalid submission'); // honeypot
    if (!(await this.turnstile.verify(dto.turnstileToken, ctx.ip))) throw new ForbiddenException('Security check failed');

    const attachments = dto.attachments ?? [];
    for (const a of attachments) {
      const head = await this.s3.exists(a.key);
      if (!head.ok) throw new BadRequestException(`Attachment not found: ${a.filename}`);
    }

    const preferredCallAt = dto.preferredCallAt ? new Date(dto.preferredCallAt) : null;
    if (preferredCallAt && (preferredCallAt.getTime() < Date.now() || preferredCallAt.getTime() > Date.now() + 60 * 86400_000)) {
      throw new BadRequestException('Invalid call slot');
    }

    const lead = await this.prisma.lead.create({
      data: {
        reference: makeReference(),
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        company: dto.company?.trim() || null,
        jobTitle: dto.jobTitle?.trim() || null,
        phone: dto.phone?.trim() || null,
        country: dto.country,
        ipCountry: ctx.ipCountry,
        region: continentOf(dto.country),
        locale: normalizeLocale(dto.locale),
        timezone: isValidTimeZone(dto.timezone) ? dto.timezone : 'UTC',
        projectType: dto.projectType,
        industry: dto.industry ?? null,
        description: dto.description.trim(),
        budgetAmount: dto.budgetUnsure || dto.budgetAmount == null ? null : new Prisma.Decimal(dto.budgetAmount),
        budgetCurrency: dto.budgetCurrency ?? null,
        budgetUnsure: dto.budgetUnsure,
        budgetRange: dto.budgetRange ?? (dto.budgetUnsure ? 'unsure' : null),
        timeline: dto.timeline,
        preferredCallAt,
        consentAt: new Date(),
        source: dto.source?.slice(0, 500) ?? null,
        utm: dto.utm ?? undefined,
        attachments: { create: attachments.map((a) => ({ key: a.key, filename: a.filename, contentType: a.contentType, size: a.size })) },
      },
    });

    // Notifications must never block or fail the visitor's request
    void this.notify.onNewLead(lead, attachments.length);
    return { reference: lead.reference };
  }

  async list(q: { status?: string; region?: string; country?: string; q?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, Number(q.page) || 1);
    const take = Math.min(100, Math.max(1, Number(q.pageSize) || 25));
    const where: Prisma.LeadWhereInput = {
      ...(q.status ? { status: q.status as LeadStatus } : { status: { not: 'SPAM' } }),
      ...(q.region ? { region: q.region } : {}),
      ...(q.country ? { country: q.country } : {}),
      ...(q.q
        ? {
            OR: [
              { name: { contains: q.q, mode: 'insensitive' } },
              { email: { contains: q.q, mode: 'insensitive' } },
              { company: { contains: q.q, mode: 'insensitive' } },
              { reference: { contains: q.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * take, take, include: { _count: { select: { attachments: true } } } }),
      this.prisma.lead.count({ where }),
    ]);
    return { items, total, page, pageSize: take };
  }

  async stats(days = 90) {
    const since = new Date(Date.now() - days * 86400_000);
    const where = { createdAt: { gte: since }, status: { not: 'SPAM' as LeadStatus } };
    const [byRegion, byCountry, byStatus, total] = await Promise.all([
      this.prisma.lead.groupBy({ by: ['region'], where, _count: { _all: true } }),
      this.prisma.lead.groupBy({ by: ['country'], where, _count: { _all: true }, orderBy: { _count: { country: 'desc' } }, take: 20 }),
      this.prisma.lead.groupBy({ by: ['status'], where: { createdAt: { gte: since } }, _count: { _all: true } }),
      this.prisma.lead.count({ where }),
    ]);
    return {
      since: since.toISOString(),
      total,
      byRegion: byRegion.map((r) => ({ region: r.region, count: r._count._all })),
      byCountry: byCountry.map((r) => ({ country: r.country, count: r._count._all })),
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
    };
  }

  async get(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id }, include: { attachments: true } });
    if (!lead) throw new NotFoundException();
    const attachments = await Promise.all(lead.attachments.map(async (a) => ({ ...a, url: await this.s3.presignDownload(a.key, a.filename) })));
    return { ...lead, attachments };
  }

  update(id: string, dto: UpdateLeadDto) {
    return this.prisma.lead.update({ where: { id }, data: { status: dto.status as LeadStatus | undefined, notes: dto.notes } });
  }

  /** Right-to-erasure: removes the lead and its files. */
  async remove(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id }, include: { attachments: true } });
    if (!lead) throw new NotFoundException();
    await Promise.allSettled(lead.attachments.map((a) => this.s3.delete(a.key)));
    await this.prisma.lead.delete({ where: { id } });
  }
}
