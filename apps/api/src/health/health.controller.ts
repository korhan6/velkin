import { Controller, Get, ServiceUnavailableException, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';

@ApiTags('health')
@SkipThrottle()
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  @Get()
  async check() {
    const [db, cache] = await Promise.all([
      this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      this.redis.ping().catch(() => false),
    ]);
    const body = { status: db ? 'ok' : 'degraded', db, cache, time: new Date().toISOString(), version: process.env.APP_VERSION ?? 'dev' };
    if (!db) throw new ServiceUnavailableException(body);
    return body;
  }
}
