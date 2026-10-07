import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { isValidTimeZone, LeadsService, makeReference } from './leads.service';
import type { CreateLeadDto } from './leads.dto';

process.env.DATABASE_URL ??= 'postgresql://x:y@localhost:5432/test';
process.env.JWT_ACCESS_SECRET ??= 'x'.repeat(40);

const baseDto: CreateLeadDto = {
  name: 'Ada Lovelace',
  email: 'Ada@Example.com',
  country: 'DE',
  projectType: 'robotics',
  description: 'We need a six-axis cobot cell for palletizing cartons.',
  budgetUnsure: true,
  timeline: '1-3m',
  locale: 'en',
  timezone: 'Europe/Berlin',
  consent: true,
};

function setup(turnstileOk = true) {
  const created: Record<string, unknown>[] = [];
  const prisma = {
    lead: { create: jest.fn(async ({ data }) => (created.push(data), { id: 'l1', ...data })) },
  };
  const s3 = { exists: jest.fn(async () => ({ ok: true, size: 10 })) };
  const turnstile = { verify: jest.fn(async () => turnstileOk) };
  const notify = { onNewLead: jest.fn(async () => undefined) };
  const svc = new LeadsService(prisma as never, s3 as never, turnstile as never, notify as never);
  return { svc, created, notify, s3 };
}

describe('LeadsService.create', () => {
  it('stores region, normalized email and returns a reference', async () => {
    const { svc, created, notify } = setup();
    const r = await svc.create(baseDto, { ip: '1.2.3.4', ipCountry: 'DE' });
    expect(r.reference).toMatch(/^VK-\d{8}-[0-9A-F]{6}$/);
    expect(created[0]).toMatchObject({ region: 'EU', email: 'ada@example.com', ipCountry: 'DE', timezone: 'Europe/Berlin' });
    expect(notify.onNewLead).toHaveBeenCalled();
  });

  it('rejects honeypot submissions', async () => {
    const { svc } = setup();
    await expect(svc.create({ ...baseDto, website: 'spam' }, { ip: '1.1.1.1', ipCountry: null })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects failed Turnstile checks', async () => {
    const { svc } = setup(false);
    await expect(svc.create(baseDto, { ip: '1.1.1.1', ipCountry: null })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects call slots in the past', async () => {
    const { svc } = setup();
    await expect(svc.create({ ...baseDto, preferredCallAt: '2020-01-01T10:00:00.000Z' }, { ip: '1.1.1.1', ipCountry: null })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('falls back to UTC for invalid time zones', async () => {
    const { svc, created } = setup();
    await svc.create({ ...baseDto, timezone: 'Mars/Olympus' }, { ip: '1.1.1.1', ipCountry: null });
    expect(created[0].timezone).toBe('UTC');
  });
});

describe('helpers', () => {
  it('makeReference uses the UTC date', () => expect(makeReference(new Date('2026-10-05T23:30:00Z'))).toMatch(/^VK-20261005-/));
  it('isValidTimeZone', () => {
    expect(isValidTimeZone('America/Bogota')).toBe(true);
    expect(isValidTimeZone('Nope/Nope')).toBe(false);
  });
});
