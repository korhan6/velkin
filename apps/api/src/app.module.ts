import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import Redis from 'ioredis';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { AuthModule } from './auth/auth.module';
import { CmsModule } from './cms/cms.module';
import { CfThrottlerGuard } from './common/http';
import { PrismaModule } from './common/prisma.service';
import { RedisModule } from './common/redis.service';
import { env } from './config/env';
import { HealthController } from './health/health.controller';
import { LeadsModule } from './leads/leads.module';
import { NotificationsModule } from './notifications/notifications.service';
import { StorageModule } from './storage/s3.service';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: env().NODE_ENV === 'production' ? 'info' : 'debug',
        genReqId: (req) => (req.headers['cf-ray'] as string) || (req.headers['x-request-id'] as string) || randomUUID(),
        redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]', 'req.body.password'],
        customProps: (req) => ({ country: req.headers['cf-ipcountry'] }),
        transport: env().NODE_ENV === 'production' ? undefined : { target: 'pino-pretty', options: { singleLine: true } },
        autoLogging: { ignore: (req) => req.url === '/health' },
      },
    }),
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }],
        storage: new ThrottlerStorageRedisService(new Redis(env().REDIS_URL, { maxRetriesPerRequest: 2 })),
      }),
    }),
    PrismaModule,
    RedisModule,
    StorageModule,
    NotificationsModule,
    AuthModule,
    LeadsModule,
    CmsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: CfThrottlerGuard }],
})
export class AppModule {}
