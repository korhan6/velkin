import { z } from 'zod';

const bool = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379/0'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),
  COOKIE_DOMAIN: z.string().optional(),
  ADMIN_URL: z.string().default('http://localhost:3001'),
  SITE_URL: z.string().default('http://localhost:3000'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be ≥ 32 chars'),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  REFRESH_TTL_DAYS: z.coerce.number().default(30),
  REQUIRE_2FA_FOR_ADMINS: bool,
  TURNSTILE_SECRET: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  S3_LEADS_BUCKET: z.string().default('velkin-leads'),
  S3_MEDIA_BUCKET: z.string().default('velkin-media'),
  MEDIA_PUBLIC_URL: z.string().default('https://media.velkine.com'),
  MAIL_PROVIDER: z.enum(['resend', 'ses', 'log']).default('log'),
  MAIL_FROM: z.string().default('Velkine <hello@velkine.com>'),
  MAIL_TEAM_TO: z.string().default('sales@velkine.com'),
  RESEND_API_KEY: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  WHATSAPP_WEBHOOK_URL: z.string().optional(),
  WEB_REVALIDATE_URL: z.string().optional(),
  REVALIDATE_SECRET: z.string().optional(),
  SWAGGER_ENABLED: bool,
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment:\n${msg}`);
  }
  if (parsed.data.NODE_ENV === 'production' && !parsed.data.TURNSTILE_SECRET) {
    throw new Error('TURNSTILE_SECRET is required in production');
  }
  cached = parsed.data;
  return cached;
}
