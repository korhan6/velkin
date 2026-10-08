/**
 * E2E against a real Postgres + Redis (CI spins them up as services; locally: `docker compose -f infra/docker-compose.dev.yml up -d`).
 * Run: DATABASE_URL=... REDIS_URL=... pnpm --filter @velkin/api exec prisma migrate deploy && pnpm --filter @velkin/api test:e2e
 */
import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

process.env.JWT_ACCESS_SECRET ??= 'e2e-secret-e2e-secret-e2e-secret-e2e';
process.env.MAIL_PROVIDER = 'log';
process.env.NODE_ENV = 'test';

describe('Velkine API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { AppModule } = await import('../src/app.module');
    const { S3Service } = await import('../src/storage/s3.service');
    const mod = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(S3Service)
      .useValue({
        presignLeadUpload: async () => ({ key: 'leads/tmp/2026-01-01/00000000-0000-0000-0000-000000000000/a.pdf', url: 'https://s3.example/put' }),
        exists: async () => ({ ok: true, size: 1 }),
      })
      .compile();
    app = mod.createNestApplication();
    app.use(cookieParser());
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => app?.close());

  it('GET /health', () => request(app.getHttpServer()).get('/health').expect(200));

  it('GET /v1/public/services returns an array', async () => {
    const res = await request(app.getHttpServer()).get('/v1/public/services?locale=es').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /v1/leads validates input', () => request(app.getHttpServer()).post('/v1/leads').send({ name: 'x' }).expect(400));

  it('POST /v1/leads creates a lead', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/leads')
      .send({
        name: 'Grace Hopper',
        email: 'grace@example.com',
        country: 'US',
        projectType: 'robotics',
        description: 'Autonomous inspection robot for a warehouse.',
        budgetUnsure: true,
        timeline: 'flexible',
        locale: 'en',
        timezone: 'America/New_York',
        consent: true,
      })
      .expect(201);
    expect(res.body.reference).toMatch(/^VK-/);
  });

  it('admin endpoints require auth', () => request(app.getHttpServer()).get('/v1/admin/leads').expect(401));
});
