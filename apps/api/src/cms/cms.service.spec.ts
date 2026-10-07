import { NotFoundException } from '@nestjs/common';
import { CmsService } from './cms.service';

process.env.DATABASE_URL ??= 'postgresql://x:y@localhost:5432/test';
process.env.JWT_ACCESS_SECRET ??= 'x'.repeat(40);

function setup(resource: Record<string, unknown> | null) {
  const created: Record<string, unknown>[] = [];
  const prisma = {
    resource: { findFirst: jest.fn(async () => resource) },
    resourceDownload: { create: jest.fn(async ({ data }) => (created.push(data), data)) },
  };
  const svc = new CmsService(prisma as never, {} as never);
  return { svc, created };
}

const wp = {
  id: 'r1',
  slug: 'cobot-safety',
  translations: { en: { title: 'Cobot safety', summary: 's', fileUrl: 'https://media.velkin.com/en.pdf' }, es: { fileUrl: 'https://media.velkin.com/es.pdf' } },
};

describe('CmsService.download', () => {
  it('returns the localized file and stores contact data only with consent', async () => {
    const { svc, created } = setup(wp);
    const r = await svc.download('cobot-safety', { email: 'Ana@Plant.com', name: 'Ana', consent: true, locale: 'es' }, 'MX');
    expect(r.url).toBe('https://media.velkin.com/es.pdf');
    expect(created[0]).toMatchObject({ email: 'ana@plant.com', name: 'Ana', consent: true, country: 'MX' });
  });

  it('drops contact data when consent is missing', async () => {
    const { svc, created } = setup(wp);
    await svc.download('cobot-safety', { email: 'ana@plant.com', consent: false, locale: 'de' }, null);
    expect(created[0]).toMatchObject({ email: null, name: null, company: null, consent: false });
  });

  it('falls back to the English file', async () => {
    const { svc } = setup(wp);
    expect((await svc.download('cobot-safety', { consent: false, locale: 'pt' }, null)).url).toBe('https://media.velkin.com/en.pdf');
  });

  it('404s for unpublished or unknown resources', async () => {
    const { svc } = setup(null);
    await expect(svc.download('nope', { consent: false, locale: 'en' }, null)).rejects.toBeInstanceOf(NotFoundException);
  });
});
