import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Real client IP. Only trust CF-Connecting-IP because the origin accepts traffic from Cloudflare only
 * (Security Group + Traefik trustedIPs). Falls back to Express' req.ip (trust proxy enabled).
 */
export function clientIp(req: Request): string {
  const cf = req.headers['cf-connecting-ip'];
  return (typeof cf === 'string' && cf) || req.ip || '0.0.0.0';
}

export function clientCountry(req: Request): string | null {
  const c = req.headers['cf-ipcountry'];
  return typeof c === 'string' && /^[A-Z]{2}$/.test(c) && c !== 'XX' && c !== 'T1' ? c : null;
}

@Injectable()
export class CfThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    return clientIp(req as unknown as Request);
  }
}

export class ZodPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}
  transform(value: unknown) {
    const r = this.schema.safeParse(value);
    if (!r.success) throw new BadRequestException({ message: 'Validation failed', issues: r.error.issues });
    return r.data;
  }
}
